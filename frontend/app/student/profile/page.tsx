'use client';

import { useState } from 'react';
import {
  Users,
  Layers,
  Phone,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Copy,
  Check,
  Edit3,
  CreditCard,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { STUDENT_PROFILE, STUDENT_STATS, STUDENT_COURSES, STUDENT_PAYMENT } from '@/lib/student-data';
import { toast } from '@/lib/store/toast-store';
import { cn, formatCurrency } from '@/lib/utils';

function StatMiniCard({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
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
        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-slate-400" />}
      </button>
    </div>
  );
}

function PaymentMethodDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  function handleSelect(provider: 'Payme' | 'Click') {
    toast.error(`${provider} integratsiyasi hali ulanmagan — API kalitlari qo'shilgach ishga tushadi.`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>To&apos;lov usulini tanlang</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <button
            onClick={() => handleSelect('Payme')}
            className="w-full flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3.5 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
          >
            <span className="font-semibold text-slate-900">Payme</span>
            <CreditCard className="h-5 w-5 text-slate-400" />
          </button>
          <button
            onClick={() => handleSelect('Click')}
            className="w-full flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3.5 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
          >
            <span className="font-semibold text-slate-900">Click</span>
            <CreditCard className="h-5 w-5 text-slate-400" />
          </button>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentProfilePage() {
  const p = STUDENT_PROFILE;
  const payment = STUDENT_PAYMENT;
  const [payDialogOpen, setPayDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-5 flex-1">
            <Avatar name={p.name} size="xl" className="bg-white/20 text-white ring-4 ring-white/20" />
            <div>
              <h1 className="text-2xl font-bold text-white">{p.name}</h1>
              <p className="text-indigo-200 text-sm mt-0.5">{p.grade} &middot; {p.groupName}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span
                  className="text-xs font-medium text-white bg-white/20 rounded-full px-3 py-1"
                  title="Login ID"
                >
                  {p.loginId}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 items-start md:items-end">
            <div className="flex gap-3">
              <StatMiniCard label="Attendance" value={STUDENT_STATS.attendanceRate} unit="%" />
              <StatMiniCard label="Avg Grade" value={STUDENT_STATS.avgGrade} unit="%" />
              <StatMiniCard label="Courses" value={STUDENT_STATS.enrolledCourses} />
            </div>
            <Button className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-none" variant="outline">
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Personal Information */}
        <div className="lg:col-span-3">
          <Card title="Personal Information" subtitle="Your contact and enrollment details">
            <div>
              <InfoRow label="Full Name">{p.name}</InfoRow>
              <InfoRow label="Login ID">{p.loginId}</InfoRow>
              <InfoRow label="Phone">{p.phone}</InfoRow>
              <InfoRow label="Grade Level">{p.grade}</InfoRow>
              <InfoRow label="Primary Group">{p.groupName}</InfoRow>
              <InfoRow label="Parent / Guardian">
                {p.parentName} &middot; {p.parentPhone}
              </InfoRow>
              <InfoRow label="Joined">
                {new Date(p.joinedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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
          <Card title="Course Payment" subtitle={payment.courseName}>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(payment.balance)}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatCurrency(payment.paid)} of {formatCurrency(payment.amount)} paid &middot; due{' '}
                  {new Date(payment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <Badge label={payment.status === 'paid' ? 'Paid' : payment.status === 'overdue' ? 'Overdue' : 'Pending'} variant={payment.status === 'paid' ? 'success' : payment.status === 'overdue' ? 'danger' : 'warning'} />
            </div>
            <div className="pt-3">
              <Button className="w-full justify-center" onClick={() => setPayDialogOpen(true)} disabled={payment.balance <= 0}>
                <CreditCard className="h-4 w-4" />
                {payment.balance > 0 ? 'Pay Now' : 'Fully Paid'}
              </Button>
            </div>
          </Card>

          <Card title="Academic Summary" subtitle="Your performance overview">
            <div>
              <StatRow icon={Layers} label="Enrolled Courses" value={STUDENT_STATS.enrolledCourses} iconClass="bg-indigo-50 text-indigo-600" />
              <StatRow icon={ClipboardCheck} label="Attendance Rate" value={`${STUDENT_STATS.attendanceRate}%`} iconClass="bg-emerald-50 text-emerald-600" />
              <StatRow icon={GraduationCap} label="Average Grade" value={`${STUDENT_STATS.avgGrade}%`} iconClass="bg-blue-50 text-blue-600" />
              <StatRow icon={BookOpen} label="Upcoming Exams" value={STUDENT_STATS.upcomingExams} iconClass="bg-amber-50 text-amber-600" />
            </div>
          </Card>

          <Card title="My Teachers" subtitle="Across your enrolled courses">
            <div>
              {STUDENT_COURSES.map((c) => (
                <div key={c.id} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
                  <Avatar name={c.teacherName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{c.teacherName}</p>
                    <p className="text-xs text-slate-400 truncate">{c.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Contact & Guardian" subtitle="Quick contact information">
            <div>
              <CopyRow icon={Phone} label="Phone number" value={p.phone} />
              <CopyRow icon={Users} label="Parent / Guardian" value={`${p.parentName} (${p.parentPhone})`} />
            </div>
          </Card>
        </div>
      </div>

      <PaymentMethodDialog open={payDialogOpen} onOpenChange={setPayDialogOpen} />
    </div>
  );
}
