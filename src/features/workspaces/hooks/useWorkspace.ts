import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Workspace, type WorkspaceMember, type Channel } from '@/lib/api';

// Queries
export const useWorkspacesQuery = () => {
  return useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: () => api.listWorkspaces(),
  });
};

export const useWorkspaceMembersQuery = (workspaceSlug: string | undefined) => {
  return useQuery<WorkspaceMember[]>({
    queryKey: ['workspace-members', workspaceSlug],
    queryFn: () => workspaceSlug ? api.listWorkspaceMembers(workspaceSlug) : Promise.resolve([]),
    enabled: !!workspaceSlug,
  });
};

export const useWorkspaceChannelsQuery = (workspaceSlug: string | undefined) => {
  return useQuery<Channel[]>({
    queryKey: ['channels', workspaceSlug],
    queryFn: () => workspaceSlug ? api.listChannels(workspaceSlug) : Promise.resolve([]),
    enabled: !!workspaceSlug,
  });
};

// Mutations
export const useCreateWorkspaceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name }: { name: string }) => api.createWorkspace(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
};

export const useInviteMemberMutation = (workspaceSlug: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) => api.inviteWorkspaceMember(workspaceSlug!, email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceSlug] });
    },
  });
};

export const useRemoveMemberMutation = (workspaceSlug: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: number) => api.removeWorkspaceMember(workspaceSlug!, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceSlug] });
    },
  });
};

export const useRevokeInviteMutation = (workspaceSlug: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: number) => api.revokeWorkspaceInvitation(workspaceSlug!, inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceSlug] });
    },
  });
};

export const useResendInviteMutation = (workspaceSlug: string | undefined) => {
  return useMutation({
    mutationFn: (inviteId: number) => api.resendWorkspaceInvitation(workspaceSlug!, inviteId),
  });
};

export const useAcceptInviteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => api.acceptWorkspaceInvitation(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
};

export const useSetDefaultWorkspaceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => api.setDefaultWorkspace(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
};

export const useToggleAutopayMutation = (workspaceSlug: string | undefined) => {
  return useMutation({
    mutationFn: () => api.toggleAutopay(workspaceSlug!),
  });
};

export const useCheckoutSessionMutation = (workspaceSlug: string | undefined) => {
  return useMutation({
    mutationFn: () => api.checkoutSession(workspaceSlug!),
  });
};
