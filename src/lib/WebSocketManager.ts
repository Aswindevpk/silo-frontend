
type Handler = (data: any, fullFrame: any) => void;

class WebSocketManager {
  private socket: WebSocket | null = null;
  private isConnecting = false;
  private backoffCount = 0;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  private messageHandlers = new Map<string, Set<Handler>>();
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

    // Use the current window host (e.g., localhost:5173) so the request goes through the Vite proxy
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = import.meta.env.VITE_WS_URL || `${protocol}//${window.location.host}/ws/users/`;
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
          // Send ping according to new spec or just a simple ping type
          this.socket.send(JSON.stringify({ type: 'system.ping' }));
        }
      }, 25000);
    };

    this.socket.onmessage = (event) => {
      try {
        const frame = JSON.parse(event.data);
        const type = frame.type; // e.g. "chat.message_received", "presence.status_change"

        // Handle old structure for backwards compatibility if needed
        let resolvedType = type;
        if (!type && frame.stream) {
          resolvedType = `${frame.stream}.${frame.payload?.type || frame.payload?.status}`;
        }

        if (resolvedType === 'system.auth_success') {
          this.isAuthenticated = true;
          this.notifyListeners();
        }

        if (resolvedType) {
          const handlers = this.messageHandlers.get(resolvedType);
          if (handlers) {
            handlers.forEach((handler) => handler(frame.payload || frame, frame));
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
      return;
    }

    if (code === 4001 || code === 4003) {
      console.log(`WebSocket disconnected with ${code} (Forbidden/Unauthorized). Will not reconnect automatically until re-authenticated.`);
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


  public sendJsonMessage(type: string, payload: any, workspaceId?: string, channelId?: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type,
        workspace_id: workspaceId,
        channel_id: channelId,
        payload
      }));
    } else {
      console.warn('Cannot send websocket message: Socket is not open.');
    }
  }

  public registerMessageHandler(type: string, handler: Handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    const handlers = this.messageHandlers.get(type)!;
    handlers.add(handler);

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.messageHandlers.delete(type);
      }
    };
  }

  public onStateChange(listener: (isConnected: boolean, isAuthenticated: boolean) => void) {
    this.stateListeners.add(listener);
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
