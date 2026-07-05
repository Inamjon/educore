'use client';

import { useState } from 'react';
import {
  Users,
  Layers,
  Star,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Award,
  Clock,
  Copy,
  Check,
  Edit3,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { TEACHER_PROFILE } from '@/lib/teacher-data';
import { cn } from '@/lib/utils';

function StatMiniCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="bg-white/10 rounded-xl px-4 py-3 text-center min-w-[90px]">
      <p className="text-xl font-bold text-white leading-none">
        {value}
        {unit && <span className="text-sm font-normal text-indigo-200 ml-0.5">{unit}</span>}
      </p>
      <p className="text-xs text-indigo-200 mt-1">{label}</p>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-slate-50 last:border-0">
      <span className="text-sm font-medium text-slate-500 sm:w-36 flex-shrink-0">{label}</span>
      <span className="text-sm text-slate-900 flex-1">{children}</span>
    </div>
  );
}

function StatRow({
  icon: Icon,
  label,
  value,
  iconClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  iconClass: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', iconClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="flex-1 text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function CopyRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-slate-900 font-medium truncate">{value}</p>
      </div>
      <button
        onClick={handleCopy}
        className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
        title="Copy"
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : (
          <Copy className="h-4 w-4 text-slate-400" />
        )}
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const p = TEACHER_PROFILE;
  const subjects = p.specialization.split(' & ').concat([p.subject]).filter(Boolean);
  const uniqueSubjects = [...new Set(subjects)];

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Left: identity */}
          <div className="flex items-center gap-5 flex-1">
            <Avatar
              name={p.name}
              size="xl"
              className="bg-white/20 text-white ring-4 ring-white/20"
            />
            <div>
              <h1 className="text-2xl font-bold text-white">{p.name}</h1>
              <p className="text-indigo-200 text-sm mt-0.5">Mathematics Teacher</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {uniqueSubjects.map((s) => (
                  <span
                    key={s}
                    className="text-xs font-medium text-white bg-white/20 rounded-full px-3 py-1"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: stats + edit */}
          <div className="flex flex-col gap-4 items-start md:items-end">
            <div className="flex gap-3">
              <StatMiniCard label="Students" value={p.totalStudents} />
              <StatMiniCard label="Groups" value={p.totalGroups} />
              <StatMiniCard label="Rating" value={p.rating} unit="/5" />
            </div>
            <Button
              className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-none"
              variant="outline"
            >
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Personal Information */}
        <div className="lg:col-span-3">
          <Card title="Personal Information" subtitle="Your professional and contact details">
            <div>
              <InfoRow label="Full Name">{p.name}</InfoRow>
              <InfoRow label="Email">
                <a href={`mailto:${p.email}`} className="text-indigo-600 hover:underline">
                  {p.email}
                </a>
              </InfoRow>
              <InfoRow label="Phone">{p.phone}</InfoRow>
              <InfoRow label="Specialization">{p.specialization}</InfoRow>
              <InfoRow label="Subjects">{p.subject}</InfoRow>
              <InfoRow label="Joined">
                {new Date(p.joinedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </InfoRow>
              <InfoRow label="Bio">
                <span className="text-slate-600 leading-relaxed">{p.bio}</span>
              </InfoRow>
            </div>
            <div className="pt-4">
              <Button variant="outline" size="sm">
                <Edit3 className="h-3.5 w-3.5" />
                Edit Information
              </Button>
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Teaching Statistics */}
          <Card title="Teaching Statistics" subtitle="Your performance overview">
            <div>
              <StatRow
                icon={Users}
                label="Total Students"
                value={p.totalStudents}
                iconClass="bg-blue-50 text-blue-600"
              />
              <StatRow
                icon={Layers}
                label="Active Groups"
                value={p.totalGroups}
                iconClass="bg-indigo-50 text-indigo-600"
              />
              <StatRow
                icon={Clock}
                label="Years Experience"
                value={`${p.yearsExperience} years`}
                iconClass="bg-amber-50 text-amber-600"
              />
              <StatRow
                icon={Star}
                label="Average Rating"
                value={`${p.rating} / 5.0`}
                iconClass="bg-emerald-50 text-emerald-600"
              />
            </div>
          </Card>

          {/* Contact & Social */}
          <Card title="Contact & Social" subtitle="Quick contact information">
            <div>
              <CopyRow icon={Mail} label="Email address" value={p.email} />
              <CopyRow icon={Phone} label="Phone number" value={p.phone} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
