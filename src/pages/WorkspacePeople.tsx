import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  useWorkspaceMembersQuery,
  useInviteMemberMutation,
  useRemoveMemberMutation,
  useRevokeInviteMutation,
  useResendInviteMutation
} from '@/features/workspaces/hooks/useWorkspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  MoreHorizontal,
  User,
  Trash2,
  MailX,
  Send
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";

type UnifiedMember = {
  id: string; // 'mem-{id}' or 'inv-{id}'
  type: 'member' | 'invitation';
  name: string;
  email: string;
  role: string;
  status: 'active' | 'pending';
  lastActive: string;
  invitedBy: string;
  invitedOn: string;
  originalId: number;
};

export const WorkspacePeople: React.FC = () => {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Centralized Hooks
  const { data: members = [], isLoading: isLoadingMembers } = useWorkspaceMembersQuery(workspaceSlug);

  const inviteMutation = useInviteMemberMutation(workspaceSlug);
  const removeMemberMutation = useRemoveMemberMutation(workspaceSlug);
  const revokeInviteMutation = useRevokeInviteMutation(workspaceSlug);
  const resendInviteMutation = useResendInviteMutation(workspaceSlug);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !workspaceSlug) return;
    inviteMutation.mutate(
      { email: inviteEmail, role: inviteRole },
      {
        onSuccess: (_, variables) => {
          toast.success(`Invitation sent to ${variables.email}`);
          setInviteEmail('');
          setIsInviteModalOpen(false);
        },
        onError: (err: any) => {
          toast.error(err.message || 'Failed to send invite.');
        },
      }
    );
  };

  const isLoading = isLoadingMembers;

  // Combine and format data for table
  const tableData = useMemo(() => {
    const unified: UnifiedMember[] = [];

    members.forEach(member => {
      if (member.status === 'PENDING') {
        const email = member.email || '';
        if (email.toLowerCase().includes(searchQuery.toLowerCase())) {
          unified.push({
            id: `inv-${member.id}`,
            type: 'invitation',
            name: email, // Use email as name for pending invites
            email: email,
            role: member.role,
            status: 'pending',
            lastActive: '—',
            invitedBy: member.invited_by_email || 'System',
            invitedOn: new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            originalId: member.id,
          });
        }
      } else if (member.status === 'ACTIVE' && member.user) {
        if (
          member.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          unified.push({
            id: `mem-${member.id}`,
            type: 'member',
            name: member.user.username,
            email: member.user.email,
            role: member.role,
            status: 'active',
            lastActive: 'Just now',
            invitedBy: member.role === 'OWNER' ? '—' : 'System',
            invitedOn: new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            originalId: member.id,
          });
        }
      }
    });

    return unified;
  }, [members, searchQuery]);

  // React Table Columns
  const columns = useMemo<ColumnDef<UnifiedMember>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-9 w-9">
                <AvatarFallback className={member.type === 'invitation' ? "bg-orange-100 text-orange-600 border border-orange-200" : "bg-gradient-to-tr from-gray-900 to-gray-700 text-white"}>
                  {member.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {member.type === 'member' && (
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900 truncate text-[14px] leading-tight flex items-center gap-2">
                {member.name}
                {member.type === 'invitation' && (
                  <Badge variant="secondary" className="px-2 py-0 h-5 text-[10px] font-bold text-orange-600 bg-orange-50 border-orange-200 uppercase tracking-wide">Pending</Badge>
                )}
                {member.role === 'OWNER' && member.type === 'member' && (
                  <Badge variant="secondary" className="px-2 py-0 h-5 text-[10px] font-bold text-indigo-600 bg-indigo-50 border-indigo-100 uppercase tracking-wide">Owner</Badge>
                )}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => (
        <span className="text-gray-600 truncate text-[13.5px] font-medium">{getValue() as string}</span>
      )
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ getValue }) => (
        <span className="text-gray-600 text-[13.5px] capitalize">{(getValue() as string).toLowerCase()}</span>
      )
    },
    {
      accessorKey: 'lastActive',
      header: 'Last active',
      cell: ({ getValue }) => (
        <span className="text-gray-500 text-[13.5px]">{getValue() as string}</span>
      )
    },
    {
      accessorKey: 'invitedBy',
      header: 'Invited by',
      cell: ({ getValue }) => (
        <span className="text-gray-500 text-[13.5px] truncate">{getValue() as string}</span>
      )
    },
    {
      accessorKey: 'invitedOn',
      header: 'Invited on',
      cell: ({ getValue }) => (
        <span className="text-gray-500 text-[13.5px]">{getValue() as string}</span>
      )
    },
    {
      id: 'actions',
      header: () => <div className="text-right pr-6">Teams</div>,
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex items-center justify-end gap-2 text-gray-400">
            {member.type === 'member' && (
              <button className="p-1.5 hover:bg-gray-200 rounded-md transition-colors hover:text-gray-700">
                <User className="h-4 w-4" />
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-200 rounded-md transition-all hover:text-gray-700">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                {member.type === 'invitation' ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => resendInviteMutation.mutate(member.originalId)}
                      className="cursor-pointer text-xs font-medium flex items-center gap-2"
                    >
                      <Send className="h-3.5 w-3.5" /> Resend invitation
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => revokeInviteMutation.mutate(member.originalId)}
                      className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer text-xs font-medium flex items-center gap-2"
                    >
                      <MailX className="h-3.5 w-3.5" /> Cancel invite
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    onClick={() => removeMemberMutation.mutate(member.originalId)}
                    className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer text-xs font-medium flex items-center gap-2"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove User
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    }
  ], [resendInviteMutation, revokeInviteMutation, removeMemberMutation]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] text-[#18181B] font-sans">
      <div className="max-w-6xl w-full mx-auto p-8 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-['Outfit']">Manage people</h1>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden flex-1">
          {/* Search / Invite Bar */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3 max-w-full">
              <div className="relative flex-1 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  placeholder="Search by email or name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-gray-200 w-full rounded-lg shadow-sm focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all text-[15px]"
                />
              </div>

              <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="h-11 px-6 bg-[#18181B] text-white hover:bg-gray-800 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    <Plus className="h-4 w-4" /> Invite people
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px] p-6 gap-6 rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-[22px] font-bold text-gray-900 font-['Outfit']">Invite people for free</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleInvite} className="flex flex-col gap-5">
                    {/* Email Input */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="email" className="text-sm font-medium text-gray-600">
                        Email
                      </label>
                      <Input
                        id="email"
                        placeholder="Enter email, comma or space separated"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                        autoFocus
                        className="h-11 rounded-xl border-gray-300 shadow-sm focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                      />
                    </div>

                    {/* Invite As */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-600">
                        Invite as
                      </label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger className="h-11 rounded-xl border-gray-300 shadow-sm focus-visible:ring-indigo-500 focus-visible:border-indigo-500 bg-white">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OWNER">Owner</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="GUEST">Guest</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-500 mt-1">
                        {inviteRole === 'OWNER' && "Full administrative control of the Workspace."}
                        {inviteRole === 'ADMIN' && "Can manage users and settings, but cannot delete the Workspace."}
                        {inviteRole === 'MEMBER' && "Can access all public items in your Workspace."}
                        {inviteRole === 'GUEST' && "Can only access specific items shared with them."}
                      </span>
                    </div>

                    <DialogFooter className="mt-2 border-t border-gray-100 pt-5 sm:justify-end gap-3 flex items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsInviteModalOpen(false)}
                        className="text-gray-600 hover:text-gray-900 font-medium px-4 h-11"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={!inviteEmail || inviteMutation.isPending}
                        className="h-11 px-6 bg-[#18181B] text-white hover:bg-gray-800 rounded-xl font-medium shadow-md transition-all"
                      >
                        {inviteMutation.isPending ? 'Inviting...' : 'Send free invite'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-5 py-4 flex items-center gap-4 bg-white border-b border-gray-100">
            <Button variant="ghost" className="h-8 text-xs font-semibold px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">
              All Users ({members.filter(m => m.status === 'ACTIVE').length}) <span className="text-gray-400 ml-1.5 text-[10px]">▼</span>
            </Button>
            {members.filter(m => m.status === 'PENDING').length > 0 && (
              <Button variant="ghost" className="h-8 text-xs font-semibold px-3 text-gray-500 hover:bg-gray-50 rounded-md transition-colors">
                Pending ({members.filter(m => m.status === 'PENDING').length})
              </Button>
            )}
          </div>

          {/* React Table */}
          <div className="flex-1 overflow-auto bg-white">
            <Table>
              <TableHeader className="bg-gray-50/80 sticky top-0 z-10">
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map(header => (
                      <TableHead
                        key={header.id}
                        className={`text-xs font-semibold text-gray-500 uppercase tracking-wider ${header.id === 'name' ? 'pl-6' : ''}`}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {/* Invite Row Placeholder */}
                <TableRow
                  className="hover:bg-[#F9F9FF] cursor-pointer group"
                  onClick={() => setIsInviteModalOpen(true)}
                >
                  <TableCell colSpan={7} className="pl-6 py-3.5 border-b border-gray-100">
                    <div className="flex items-center gap-4 text-sm font-semibold text-indigo-600">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Plus className="h-4 w-4 text-indigo-600" />
                      </div>
                      <span className="group-hover:translate-x-1 transition-transform">Invite people</span>
                    </div>
                  </TableCell>
                </TableRow>

                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-gray-500 animate-pulse">
                      Loading members...
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <TableRow
                      key={row.id}
                      className={`group transition-colors ${row.original.type === 'invitation' ? 'hover:bg-orange-50/30' : 'hover:bg-gray-50/80'}`}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell
                          key={cell.id}
                          className={cell.column.id === 'name' ? 'pl-6 py-4' : ''}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};
