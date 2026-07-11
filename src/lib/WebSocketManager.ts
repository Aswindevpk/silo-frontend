type StreamNamespace = 'system' | 'chat' | 'calls';

type Handler = (data: any) => void;

class WebSocketManager {
  private socket: WebSocket | null = null;
  private isConnecting = false;
  private backoffCount = 0;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  
  private messageHandlers = new Map<string, Map<string, Set<Handler>>>();
  private stateListeners = new Set<(isConnected: boolean, isAuthenticated: boolean) => void>();

  private isConnected = false;
  private isAuthenticated = false;
  private intentionalDisconnect = false;

  public connect() {
    if (this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING || this.isConnecting) {
      return;
    }

    this.intentionalDisconnect = false;
    this.isConnecting = true;
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/users/';
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log("WebSocket connected.");
      this.isConnecting = false;
      this.backoffCount = 0;
      this.isConnected = true;
      this.notifyListeners();
      
      if (this.pingInterval) clearInterval(this.pingInterval);
      this.pingInterval = setInterval(() => {
        if (this.socket?.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ stream: 'system', payload: { type: 'ping' } }));
        }
      }, 25000);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const stream = data.stream || 'system';
        const payload = data.payload || data;
        const type = payload.type || payload.status;

        if (stream === 'system' && type === 'auth_success') {
          this.isAuthenticated = true;
          this.notifyListeners();
        }

        if (stream && type) {
          const streamHandlers = this.messageHandlers.get(stream);
          if (streamHandlers) {
            const handlers = streamHandlers.get(type);
            if (handlers) {
              handlers.forEach((handler) => handler(payload.data || payload));
            }
          }
        }
      } catch (err) {
        console.error('Error parsing web socket frame message', err);
      }
    };

    this.socket.onclose = (event) => {
      this.handleDisconnect(event.code);
    };

    this.socket.onerror = (err) => {
      console.error('WebSocket encountered an error', err);
      // We don't need to close it here, onclose will fire automatically
    };
  }

  private handleDisconnect(code: number) {
    this.isConnecting = false;
    if (this.pingInterval) clearInterval(this.pingInterval);
    
    this.isConnected = false;
    this.isAuthenticated = false;
    this.notifyListeners();
    
    this.socket = null;

    if (this.intentionalDisconnect) {
      return; // Do not reconnect if we intentionally disconnected
    }

    if (code === 4003) {
      console.log("WebSocket disconnected with 4003 (Forbidden). Will not reconnect automatically until re-authenticated.");
      return;
    }
    
    const maxBackoff = 30000;
    const baseDelay = 1000;
    const delay = Math.min(baseDelay * Math.pow(1.5, this.backoffCount), maxBackoff);
    
    console.log(`WebSocket disconnected. Reconnecting in ${Math.round(delay / 1000)}s...`);
    
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.backoffCount += 1;
      this.connect();
    }, delay);
  }

  public disconnect() {
    this.intentionalDisconnect = true;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.isAuthenticated = false;
    this.isConnecting = false;
    this.notifyListeners();
  }

  public subscribeToChannel(channelId: number) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        stream: 'system',
        payload: {
          type: 'subscribe',
          channel_id: channelId
        }
      }));
    }
  }

  public sendJsonMessage(stream: StreamNamespace, message: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        stream,
        payload: message
      }));
    } else {
      console.warn('Cannot send websocket message: Socket is not open.');
    }
  }

  public registerMessageHandler(stream: StreamNamespace, type: string, handler: Handler) {
    if (!this.messageHandlers.has(stream)) {
      this.messageHandlers.set(stream, new Map());
    }
    const streamHandlers = this.messageHandlers.get(stream)!;
    
    if (!streamHandlers.has(type)) {
      streamHandlers.set(type, new Set());
    }
    streamHandlers.get(type)!.add(handler);

    return () => {
      const sh = this.messageHandlers.get(stream);
      if (sh) {
        const th = sh.get(type);
        if (th) {
          th.delete(handler);
          if (th.size === 0) sh.delete(type);
        }
        if (sh.size === 0) this.messageHandlers.delete(stream);
      }
    };
  }

  public onStateChange(listener: (isConnected: boolean, isAuthenticated: boolean) => void) {
    this.stateListeners.add(listener);
    // Notify immediately with current state
    listener(this.isConnected, this.isAuthenticated);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.stateListeners.forEach(listener => listener(this.isConnected, this.isAuthenticated));
  }
}

export const wsManager = new WebSocketManager();
