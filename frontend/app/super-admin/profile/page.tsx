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
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SA_AUDIT_LOGS } from '@/lib/super-admin-data';
import { useSAProfileStore } from '@/lib/store/sa-profile-store';
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

// ─── Activity Item ────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const INITIAL_SESSIONS = [
  { id: 'sess1', device: 'Chrome on macOS', ip: '203.0.113.10', location: 'New York, USA', current: true, time: 'Now' },
  { id: 'sess2', device: 'Safari on iPhone', ip: '203.0.113.11', location: 'New York, USA', current: false, time: '2h ago' },
];

export default function ProfilePage() {
  const profile = useSAProfileStore((s) => s.profile);
  const updateProfile = useSAProfileStore((s) => s.update);

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);

  // Re-sync once the persisted profile store finishes rehydrating from localStorage,
  // since that happens after this component's initial useState runs.
  useEffect(() => {
    setName(profile.name);
    setPhone(profile.phone);
  }, [profile.name, profile.phone]);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [saved, setSaved] = useState(false);
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myLogs = SA_AUDIT_LOGS.filter((l) => l.userId === 'sa1').slice(0, 6);

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSave = () => {
    updateProfile({ name, phone });
    toast.success('Profile updated');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleUpdatePassword = () => {
    if (!currentPw || !newPw || !confirmPw) {
      toast.error('Fill in all password fields');
      return;
    }
    if (newPw !== confirmPw) {
      toast.error('New password and confirmation do not match');
      return;
    }
    toast.success('Password updated');
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({ avatar: reader.result as string });
      toast.success('Avatar updated');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRevokeSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success('Session revoked');
  };

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
                {profile.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar}
                    alt={name}
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
                <h3 className="text-lg font-bold text-slate-900">{name}</h3>
                <p className="text-sm text-slate-400 mt-0.5">{profile.role}</p>
                <span className="inline-flex items-center gap-1.5 mt-2 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1">
                  <Shield className="h-3 w-3" />
                  Super Administrator
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-0">
              <InfoRow icon={KeyRound} label="Login ID"   value={profile.loginId} />
              <InfoRow icon={Phone}   label="Phone"      value={profile.phone} />
              <InfoRow icon={Clock}   label="Last Login" value={formatDate(profile.lastLogin)} />
              <InfoRow icon={UserCircle} label="Member Since" value={new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} />
            </div>
          </Card>

          {/* Recent Activity */}
          <Card title="My Recent Actions" subtitle="Last 6 actions performed">
            <div className="space-y-3">
              {myLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-indigo-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700">{log.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400 truncate">{log.entityName}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0 mt-0.5">
                    {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                  value={profile.loginId}
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
                  value={profile.role}
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
              <Button onClick={handleSave}>
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
              <Button variant="secondary" onClick={handleUpdatePassword}>
                <Key className="h-4 w-4" />
                Update Password
              </Button>
            </div>
          </Card>

          {/* Active Sessions */}
          <Card title="Active Sessions" subtitle="Devices currently logged in to your account">
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                  <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">{session.device}</p>
                      {session.current && (
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Current</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{session.ip} · {session.location} · {session.time}</p>
                  </div>
                  {!session.current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleRevokeSession(session.id)}
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
