import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { type WorkspaceSubscription } from '@/lib/api';
import {
  useWorkspacesQuery,
  useWorkspaceMembersQuery,
  useToggleAutopayMutation,
  useCheckoutSessionMutation,
  useInviteMemberMutation
} from '@/features/workspaces/hooks/useWorkspace';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  CreditCard,
  Users,
  ShieldCheck,
  Zap,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Loader2,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';

export const BillingSettings: React.FC = () => {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();

  const [subscription, setSubscription] = useState<WorkspaceSubscription | null>(null);

  // Invite member state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviting, setInviting] = useState(false);

  const { data: workspaces = [], isLoading: isLoadingWorkspaces } = useWorkspacesQuery();
  const { data: members = [], isLoading: isLoadingMembers } = useWorkspaceMembersQuery(workspaceSlug);

  const toggleAutopayMutation = useToggleAutopayMutation(workspaceSlug);
  const checkoutSessionMutation = useCheckoutSessionMutation(workspaceSlug);
  const inviteMemberMutation = useInviteMemberMutation(workspaceSlug);

  // Derive data synchronously instead of using effects
  useEffect(() => {
    if (workspaces.length > 0 && workspaceSlug && !subscription) {
      const ws = workspaces.find((w) => w.slug === workspaceSlug);
      if (ws) {
        // Assume mock sub for now unless we successfully fetch it
        setSubscription({
          workspace: ws.id,
          tier: 'FREE',
          status: 'ACTIVE',
          auto_renew: true
        });
      }
    }
  }, [workspaces, workspaceSlug]);

  const handleToggleAutopay = async () => {
    if (!workspaceSlug || !subscription) return;
    toggleAutopayMutation.mutate(undefined, {
      onSuccess: (updatedSub) => {
        setSubscription(updatedSub);
        toast.success(`Automatic renewal (Autopay) is now ${updatedSub.auto_renew ? 'ON' : 'OFF'}.`);
      },
      onError: (err: any) => {
        toast.error(err.message || 'Failed to toggle autopay configuration.');
      }
    });
  };

  const handleUpgradeSubscription = async () => {
    if (!workspaceSlug) return;
    toast.info('Redirecting to Stripe checkout portal...');
    checkoutSessionMutation.mutate(undefined, {
      onSuccess: (session) => {
        if (session && session.checkout_url) {
          window.location.href = session.checkout_url;
        } else {
          setSubscription((prev) => prev ? { ...prev, tier: 'PREMIUM', status: 'ACTIVE' } : null);
          toast.success('Workspace subscription upgraded to PREMIUM!');
        }
      },
      onError: (err: any) => {
        toast.error(err.message || 'Failed to initialize payment gateway.');
      }
    });
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceSlug || !inviteEmail) return;

    setInviting(true);
    inviteMemberMutation.mutate({ email: inviteEmail, role: inviteRole }, {
      onSuccess: () => {
        toast.success(`Invitation successfully sent to ${inviteEmail}!`);
        setInviteEmail('');
        setInviting(false);
      },
      onError: (err: any) => {
        toast.error(err.message || 'Failed to send workspace invitation.');
        setInviting(false);
      }
    });
  };

  const loading = isLoadingWorkspaces || isLoadingMembers;

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-white text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin text-[#18181B]" />
      </div>
    );
  }

  const isPremium = subscription?.tier === 'PREMIUM';
  const memberCount = members.length;
  const isAtLimit = !isPremium && memberCount >= 2;

  return (
    <div className="flex-grow overflow-y-auto p-8 bg-white text-[#18181B]">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header Title */}
        <div>
          <h1 className="text-2xl font-bold text-[#18181B] flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-[#18181B]" />
            Billing & Membership Settings
          </h1>
          <p className="text-sm text-gray-500">
            Manage organization members, invite engineers, and control subscription renewal schedules.
          </p>
        </div>

        {/* Member limits alerts */}
        {isAtLimit && (
          <div className="p-4 border border-amber-600/30 bg-amber-950/20 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-amber-400">Free Tier Limit Reached</h4>
              <p className="text-xs text-gray-500 mt-1">
                You have reached the maximum of 2 members allowed on the Free Plan. To invite more collaborators, please upgrade this workspace to the Premium Plan.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Status Box */}
          <Card className="border-gray-200 bg-white text-[#18181B]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 uppercase tracking-wider">Plan Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold tracking-tight">
                  {isPremium ? 'Premium' : 'Free'}
                </span>
                <span className="text-xs text-[#18181B]0">Tier</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <ShieldCheck className="h-4 w-4 text-[#18181B]" />
                <span className="text-gray-500">
                  Status: <strong className="text-[#18181B]">Active</strong>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Autopay Control Box */}
          <Card className="border-gray-200 bg-white text-[#18181B]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 uppercase tracking-wider">Autopay Renewal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {subscription?.auto_renew ? 'Automatic Renewal Enabled' : 'Expires at end of cycle'}
                </span>
                <button
                  onClick={handleToggleAutopay}
                  className="text-[#18181B] hover:text-sky-300 transition-colors"
                >
                  {subscription?.auto_renew ? (
                    <ToggleRight className="h-9 w-9" />
                  ) : (
                    <ToggleLeft className="h-9 w-9 text-zinc-600" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-[#18181B]0 leading-tight">
                Disable to prevent automatically charging the saved Stripe payment card.
              </p>
            </CardContent>
          </Card>

          {/* Members count Box */}
          <Card className="border-gray-200 bg-white text-[#18181B]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 uppercase tracking-wider">Total Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold tracking-tight">{memberCount}</span>
                <span className="text-xs text-[#18181B]0">/ {!isPremium ? '2 max' : 'unlimited'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Users className="h-4 w-4 text-[#18181B]" />
                <span>Members list active</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detail Panel 1: Upgrade to Premium (Stripe) */}
        {!isPremium && (
          <Card className="border-sky-950/40 bg-sky-950/10 text-[#18181B]">
            <CardHeader>
              <CardTitle className="text-xl text-[#18181B] flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Upgrade Workspace to Premium
              </CardTitle>
              <CardDescription className="text-gray-500">
                Unlock unlimited members, voice huddles, and real-time document synchronization features.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="text-2xl font-bold">$29 <span className="text-xs font-normal text-gray-500">/ month flat rate</span></div>
                <p className="text-xs text-gray-500">Includes secure payment processing powered by Stripe Checkout.</p>
              </div>
              <Button
                onClick={handleUpgradeSubscription}
                className="bg-[#18181B] text-white hover:bg-black font-extrabold w-full sm:w-auto"
              >
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Active Members list */}
          <Card className="border-gray-200 bg-white text-[#18181B]">
            <CardHeader>
              <CardTitle className="text-lg text-[#18181B] flex items-center gap-2">
                <Users className="h-5 w-5 text-[#18181B]" />
                Workspace Collaborators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2.5 rounded bg-white/40 border border-gray-200/40">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#18181B]">
                        @{member.user?.username}
                      </div>
                      <div className="text-xs text-[#18181B]0 truncate">{member.user?.email}</div>
                    </div>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono uppercase">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Invitation sender */}
          <Card className="border-gray-200 bg-white text-[#18181B]">
            <CardHeader>
              <CardTitle className="text-lg text-[#18181B] flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#18181B]" />
                Invite New Member
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email" className="text-gray-700">Email Address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    required
                    disabled={isAtLimit}
                    placeholder="engineer@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="bg-white border-gray-200 text-[#18181B]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-role" className="text-gray-700">Permission Role</Label>
                  <select
                    id="invite-role"
                    disabled={isAtLimit}
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded p-2 text-sm text-[#18181B] focus:outline-none"
                  >
                    <option value="MEMBER">Member (Read/Write)</option>
                    <option value="ADMIN">Admin (Manage Channels)</option>
                    <option value="GUEST">Guest (Limited channels)</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={isAtLimit || inviting}
                  className="w-full bg-[#18181B] text-white hover:bg-black font-bold"
                >
                  {inviting ? 'Sending Invite...' : 'Send Invitation Token'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};
