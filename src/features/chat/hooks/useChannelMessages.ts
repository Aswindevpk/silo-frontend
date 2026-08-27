import { useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Message } from '@/lib/api';
import { useWebSocket } from '@/context/WebSocketContext';

export function useChannelMessages(channelId: string | undefined, parsedChannelId: number) {
  const queryClient = useQueryClient();
  const { registerMessageHandler } = useWebSocket();

  // Query Messages
  const { 
    data, 
    isLoading, 
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['messages', parsedChannelId],
    queryFn: ({ pageParam = 1 }) => api.listMessages(parsedChannelId, pageParam as number),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.next ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!parsedChannelId,
  });

  // Flatten messages and explicitly sort them chronologically 
  // (oldest first) so they render top-to-bottom correctly in the UI.
  const messages = (data?.pages.flatMap(page => {
    if (page && Array.isArray((page as any).results)) {
      return (page as any).results as Message[];
    } else if (Array.isArray(page)) {
      return page as Message[];
    }
    return [];
  }) || []).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Helper to mutate nested infinite query pages
  const updateMessageInPages = (
    old: { pages: any[], pageParams: unknown[] } | undefined,
    updater: (msg: Message) => Message
  ) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map(page => {
        if (page && Array.isArray(page.results)) {
          return {
            ...page,
            results: page.results.map(updater)
          };
        } else if (Array.isArray(page)) {
          return page.map(updater);
        }
        return page;
      })
    };
  };

  // Websocket listener for incoming real-time updates
  useEffect(() => {
    if (!channelId) return;

    const cleanupMsg = registerMessageHandler('chat.message_received', (payload: any) => {
      queryClient.setQueryData(
        ['messages', parsedChannelId],
        (old: { pages: any[], pageParams: unknown[] } | undefined) => {
          if (!old) return old;
          // Check for duplicates
          let exists = false;
          old.pages.forEach(p => {
            const arr = (p && Array.isArray(p.results)) ? p.results : (Array.isArray(p) ? p : []);
            arr.forEach((m: any) => {
              if (String(m.id) === String(payload.id)) exists = true;
            });
          });
          if (exists) return old;

          // Inject into the first page (since it holds the newest messages)
          const newPages = [...old.pages];
          if (newPages.length > 0) {
            const firstPage = newPages[0];
            if (firstPage && Array.isArray(firstPage.results)) {
              newPages[0] = {
                ...firstPage,
                results: [payload, ...firstPage.results]
              };
            } else if (Array.isArray(firstPage)) {
              newPages[0] = [payload, ...firstPage];
            }
          }
          return { ...old, pages: newPages };
        }
      );
    });

    const cleanupReaction = registerMessageHandler('chat.reaction_updated', (payload: any) => {
      queryClient.setQueryData(
        ['messages', parsedChannelId],
        (old: any) => updateMessageInPages(old, m => String(m.id) === String(payload.id) ? payload : m)
      );
    });

    const cleanupEdit = registerMessageHandler('chat.message_edited', (payload: any) => {
      queryClient.setQueryData(
        ['messages', parsedChannelId],
        (old: any) => updateMessageInPages(old, m => String(m.id) === String(payload.id) ? payload : m)
      );
    });

    const cleanupDelete = registerMessageHandler('chat.message_deleted', (payload: any) => {
      queryClient.setQueryData(
        ['messages', parsedChannelId],
        (old: any) => updateMessageInPages(old, m => String(m.id) === String(payload.id) ? payload : m)
      );
    });

    const cleanupPin = registerMessageHandler('chat.message_pinned', (payload: any) => {
      queryClient.setQueryData(
        ['messages', parsedChannelId],
        (old: any) => updateMessageInPages(old, m => String(m.id) === String(payload.id) ? payload : m)
      );
    });

    return () => {
      cleanupMsg();
      cleanupReaction();
      cleanupEdit();
      cleanupDelete();
      cleanupPin();
    };
  }, [channelId, parsedChannelId, registerMessageHandler, queryClient]);

  return { 
    messages, 
    isLoading, 
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  };
}
