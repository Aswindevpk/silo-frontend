import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, type WorkspaceMember } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Download, 
  Search, 
  Plus, 
  MoreHorizontal, 
  User 
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const WorkspacePeople: React.FC = () => {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadMembers = async () => {
    if (!workspaceSlug) return;
    try {
      setLoading(true);
      const data = await api.listWorkspaceMembers(workspaceSlug);
      setMembers(data);
    } catch (err: any) {
      toast.error('Failed to load members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [workspaceSlug]);

  const handleInvite = async () => {
    if (!inviteEmail || !workspaceSlug) return;
    try {
      setInviting(true);
      await api.inviteWorkspaceMember(workspaceSlug, inviteEmail, 'MEMBER');
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      // Ideally refetch pending invites or members if API supports it
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invite.');
    } finally {
      setInviting(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] text-[#18181B] font-sans">
      <div className="max-w-6xl w-full mx-auto p-8 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-['Outfit']">Manage people</h1>
            <a href="#" className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-colors bg-indigo-50 px-2 py-1 rounded-md">Learn more</a>
          </div>
          <Button variant="outline" className="text-sm h-9 flex items-center gap-2 border-gray-200 hover:bg-gray-50 shadow-sm transition-all rounded-lg">
            <Download className="h-4 w-4 text-gray-500" /> Export
          </Button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden flex-1">
          {/* Search / Invite Bar */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3 max-w-full">
              <div className="relative flex-1 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input 
                  placeholder="Search or invite by email" 
                  value={inviteEmail || searchQuery} // Simple combo input for both search and invite
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setSearchQuery(e.target.value);
                  }}
                  className="pl-10 h-11 border-gray-200 w-full rounded-lg shadow-sm focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all text-[15px]"
                />
              </div>
              <Button 
                onClick={handleInvite} 
                disabled={!inviteEmail || inviting} 
                className="h-11 px-6 bg-[#18181B] text-white hover:bg-gray-800 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:hover:shadow-none"
              >
                <Plus className="h-4 w-4" /> {inviting ? 'Inviting...' : 'Invite people'}
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-5 py-4 flex items-center gap-4 bg-white border-b border-gray-100">
            <Button variant="ghost" className="h-8 text-xs font-semibold px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">
              All Users ({members.length}) <span className="text-gray-400 ml-1.5 text-[10px]">▼</span>
            </Button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto bg-white">
            <Table>
              <TableHeader className="bg-gray-50/80 sticky top-0 z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[300px] text-xs font-semibold text-gray-500 uppercase tracking-wider pl-6">Name</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last active</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Invited by</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Invited on</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pr-6">Teams</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Invite Row Placeholder */}
                <TableRow className="hover:bg-[#F9F9FF] cursor-pointer group">
                  <TableCell colSpan={7} className="pl-6 py-3.5 border-b border-gray-100">
                    <div className="flex items-center gap-4 text-sm font-semibold text-indigo-600">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Plus className="h-4 w-4 text-indigo-600" />
                      </div>
                      <span className="group-hover:translate-x-1 transition-transform">Invite people</span>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Member Rows */}
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-gray-500 animate-pulse">
                      Loading members...
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id} className="hover:bg-gray-50/80 group transition-colors">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-gray-900 to-gray-700 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                              {member.user.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 truncate text-[14px] leading-tight flex items-center gap-2">
                              {member.user.username}
                              {member.role === 'OWNER' && (
                                <Badge variant="secondary" className="px-2 py-0 h-5 text-[10px] font-bold text-indigo-600 bg-indigo-50 border-indigo-100 uppercase tracking-wide">Owner</Badge>
                              )}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 truncate text-[13.5px] font-medium">
                        {member.user.email}
                      </TableCell>
                      <TableCell className="text-gray-600 text-[13.5px] capitalize">
                        {member.role.toLowerCase()}
                      </TableCell>
                      <TableCell className="text-gray-500 text-[13.5px]">
                        Just now
                      </TableCell>
                      <TableCell className="text-gray-500 text-[13.5px] truncate">
                        {member.role === 'OWNER' ? '—' : 'System'}
                      </TableCell>
                      <TableCell className="text-gray-500 text-[13.5px]">
                        {new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2 text-gray-400">
                          <button className="p-1.5 hover:bg-gray-200 rounded-md transition-colors hover:text-gray-700">
                            <User className="h-4 w-4" />
                          </button>
                          <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-200 rounded-md transition-all hover:text-gray-700">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
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
