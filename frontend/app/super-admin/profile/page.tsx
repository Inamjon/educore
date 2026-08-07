'use client';

import { useState, useEffect, useRef } from 'react';
import {
  UserCircle,
  KeyRound,
  Phone,
  Shield,
  Clock,
  Key,
  Activity,
  Save,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store/auth-store';
import { useSAProfileStore } from '@/lib/store/sa-profile-store';
import { useUserQuery, useUpdateSelfMutation, useChangePasswordMutation } from '@/lib/queries/users';
import { useSessionsQuery, useRevokeSessionMutation } from '@/lib/queries/auth';
import { useAuditLogsQuery } from '@/lib/queries/audit-logs';
import { ApiError } from '@/lib/api/client';
import { toast } from '@/lib/store/toast-store';

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-sm text-slate-800 font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const authUser = useAuthStore((s) => s.user);
  const cachedProfile = useSAProfileStore((s) => s.profile);
  const syncCache = useSAProfileStore((s) => s.update);

  const { data: user, isLoading: userLoading } = useUserQuery(authUser?.id ?? null);
  const { data: sessions, isLoading: sessionsLoading } = useSessionsQuery();
  const { data: myLogs } = useAuditLogsQuery({ userId: authUser?.id, pageSize: 6 });

  const updateSelfMutation = useUpdateSelfMutation();
  const changePasswordMutation = useChangePasswordMutation();
  const revokeMutation = useRevokeSessionMutation();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  // Tracks which user record the form fields were last populated from —
  // lets the form re-seed itself the moment `user` loads/changes without a
  // setState-in-effect render flash (React's recommended "adjust state
  // during render" pattern for syncing from an async query result).
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null);

  if (user && user.id !== syncedUserId) {
    setSyncedUserId(user.id);
    setName(`${user.first_name} ${user.last_name}`.trim());
    setPhone(user.phone);
  }

  // Keep the header/dashboard display cache — useSAProfileStore — fresh
  // with real data too, same "display cache only" role useAuthStore
  // already plays. Writing to the external Zustand store (not local React
  // state) is exactly what an effect is for.
  useEffect(() => {
    if (!user) return;
    syncCache({
      name: user.full_name,
      loginId: user.login_id,
      phone: user.phone,
      role: user.roles[0]?.name ?? 'Super Administrator',
      joinedAt: user.created_at,
      lastLogin: user.last_login ?? user.created_at,
      avatar: user.avatar_url ?? undefined,
    });
  }, [user, syncCache]);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = (name || cachedProfile.name)
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function handleSave() {
    if (!user) return;
    const [firstName, ...rest] = name.trim().split(' ');
    const lastName = rest.join(' ') || firstName;
    try {
      await updateSelfMutation.mutateAsync({ userId: user.id, input: { firstName, lastName, phone } });
      toast.success('Profile updated');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update profile.');
    }
  }

  async function handleUpdatePassword() {
    if (!user) return;
    if (!currentPw || !newPw || !confirmPw) {
      toast.error('Fill in all password fields');
      return;
    }
    if (newPw !== confirmPw) {
      toast.error('New password and confirmation do not match');
      return;
    }
    try {
      await changePasswordMutation.mutateAsync({ userId: user.id, currentPassword: currentPw, newPassword: newPw });
      toast.success('Password updated');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update password.');
    }
  }

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await updateSelfMutation.mutateAsync({ userId: user.id, input: { avatarUrl: reader.result as string } });
        toast.success('Avatar updated');
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to update avatar.');
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleRevokeSession(id: string) {
    try {
      await revokeMutation.mutateAsync(id);
      toast.success('Session revoked');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to revoke session.');
    }
  }

  if (userLoading || !user) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading profile…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <PageHeader
        title="Profile"
        subtitle="Manage your Super Admin account and security settings"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Profile Card ─────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Avatar Card */}
          <Card>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="relative">
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="h-24 w-24 rounded-2xl object-cover shadow-lg"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                    {initials}
                  </div>
                )}
                <button
                  onClick={handleAvatarClick}
                  className="absolute -bottom-1.5 -right-1.5 h-8 w-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5 text-slate-500" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{user.full_name}</h3>
                <p className="text-sm text-slate-400 mt-0.5">{user.roles[0]?.name ?? '—'}</p>
                <span className="inline-flex items-center gap-1.5 mt-2 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1">
                  <Shield className="h-3 w-3" />
                  Super Administrator
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-0">
              <InfoRow icon={KeyRound} label="Login ID"   value={user.login_id} />
              <InfoRow icon={Phone}   label="Phone"      value={user.phone} />
              <InfoRow icon={Clock}   label="Last Login" value={formatDate(user.last_login)} />
              <InfoRow icon={UserCircle} label="Member Since" value={new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} />
            </div>
          </Card>

          {/* Recent Activity */}
          <Card title="My Recent Actions" subtitle="Last 6 actions performed">
            <div className="space-y-3">
              {(myLogs ?? []).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No recent actions recorded.</p>
              )}
              {(myLogs ?? []).map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-indigo-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 capitalize">{log.action} {log.entity_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400 truncate">{log.ip_address ?? '—'}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0 mt-0.5">
                    {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Right: Edit Forms ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card title="Personal Information" subtitle="Update your account details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Full Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Login ID</label>
                <Input
                  value={user.login_id}
                  disabled
                  className="bg-slate-50 text-slate-400 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Phone Number</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555-000-0000"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Role</label>
                <Input
                  value={user.roles[0]?.name ?? '—'}
                  disabled
                  className="bg-slate-50 text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-slate-100">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved!
                </span>
              )}
              <Button onClick={handleSave} loading={updateSelfMutation.isPending}>
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </Card>

          {/* Change Password */}
          <Card title="Change Password" subtitle="Use a strong, unique password">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Current Password</label>
                <div className="relative">
                  <Input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">New Password</label>
                <div className="relative">
                  <Input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Confirm New Password</label>
                <Input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-slate-100">
              <Button variant="secondary" onClick={handleUpdatePassword} loading={changePasswordMutation.isPending}>
                <Key className="h-4 w-4" />
                Update Password
              </Button>
            </div>
          </Card>

          {/* Active Sessions */}
          <Card title="Active Sessions" subtitle="Devices currently logged in to your account">
            <div className="space-y-3">
              {sessionsLoading && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading sessions…
                </div>
              )}
              {(sessions ?? []).map((session) => (
                <div key={session.id} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                  <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">{session.device_name}</p>
                      {session.current && (
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Current</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {session.ip_address ?? '—'}
                      {session.location ? ` · ${session.location}` : ''} · {formatDate(session.last_activity_at)}
                    </p>
                  </div>
                  {!session.current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleRevokeSession(session.id)}
                      loading={revokeMutation.isPending && revokeMutation.variables === session.id}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
