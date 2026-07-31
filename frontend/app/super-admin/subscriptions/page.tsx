'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  GitBranch,
  Users,
  GraduationCap,
  Plus,
  X,
  Pencil,
  Building2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { useSASubscriptionsStore, type SASubscription } from '@/lib/store/sa-subscriptions-store';
import { toast } from '@/lib/store/toast-store';
import { formatCurrency } from '@/lib/utils';

// ── Create Plan form default state ────────────────────────────────────────────
const defaultForm = {
  name: '',
  price: '',
  billingCycle: 'monthly',
  maxBranches: '',
  maxStudents: '',
  maxTeachers: '',
  features: '',
};

const billingOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual' },
];

const PLAN_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ec4899'];

export default function SubscriptionsPage() {
  const plans = useSASubscriptionsStore((s) => s.items);
  const addPlan = useSASubscriptionsStore((s) => s.add);
  const updatePlan = useSASubscriptionsStore((s) => s.update);
  const totalActive = plans.reduce((sum, p) => sum + p.activeCount, 0);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const handleField = (key: keyof typeof defaultForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCancel = () => {
    setForm(defaultForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (plan: SASubscription) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      price: String(plan.price),
      billingCycle: plan.billingCycle,
      maxBranches: String(plan.maxBranches),
      maxStudents: String(plan.maxStudents),
      maxTeachers: String(plan.maxTeachers),
      features: plan.features.join('\n'),
    });
    setShowForm(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const features = form.features
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);
    const payload = {
      name: form.name as SASubscription['name'],
      price: Number(form.price) || 0,
      billingCycle: form.billingCycle as SASubscription['billingCycle'],
      maxBranches: Number(form.maxBranches) || 0,
      maxStudents: Number(form.maxStudents) || 0,
      maxTeachers: Number(form.maxTeachers) || 0,
      features,
    };
    if (editingId) {
      updatePlan(editingId, payload);
      toast.success('Plan updated');
    } else {
      addPlan({
        ...payload,
        activeCount: 0,
        color: PLAN_COLORS[plans.length % PLAN_COLORS.length],
      });
      toast.success('Plan created');
    }
    setShowForm(false);
    setEditingId(null);
    setForm(defaultForm);
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <PageHeader
        title="Subscription Plans"
        subtitle="Manage platform subscription tiers and pricing"
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              if (showForm) {
                handleCancel();
              } else {
                setEditingId(null);
                setForm(defaultForm);
                setShowForm(true);
              }
            }}
          >
            <Plus className="h-4 w-4" />
            Create Plan
          </Button>
        }
      />

      {/* ── Create Plan Form (toggle) ─────────────────────────────────────────── */}
      {showForm && (
        <Card title={editingId ? 'Edit Subscription Plan' : 'New Subscription Plan'} actions={
          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close form"
          >
            <X className="h-5 w-5" />
          </button>
        }>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Plan Name</label>
                <input
                  required
                  placeholder="e.g. Professional"
                  value={form.name}
                  onChange={(e) => handleField('name', e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Price */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Price (USD)</label>
                <input
                  required
                  type="number"
                  min={0}
                  placeholder="e.g. 149"
                  value={form.price}
                  onChange={(e) => handleField('price', e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Billing Cycle */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Billing Cycle</label>
                <Select
                  value={form.billingCycle}
                  onChange={(e) => handleField('billingCycle', e.target.value)}
                  options={billingOptions}
                  className="w-full"
                />
              </div>

              {/* Max Branches */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Max Branches</label>
                <input
                  required
                  type="number"
                  min={1}
                  placeholder="e.g. 5"
                  value={form.maxBranches}
                  onChange={(e) => handleField('maxBranches', e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Max Students */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Max Students</label>
                <input
                  required
                  type="number"
                  min={1}
                  placeholder="e.g. 1000"
                  value={form.maxStudents}
                  onChange={(e) => handleField('maxStudents', e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Max Teachers */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Max Teachers</label>
                <input
                  required
                  type="number"
                  min={1}
                  placeholder="e.g. 50"
                  value={form.maxTeachers}
                  onChange={(e) => handleField('maxTeachers', e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Features */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Features <span className="text-slate-400 font-normal">(one per line)</span>
              </label>
              <textarea
                rows={4}
                placeholder={"e.g.\nAdvanced analytics\nAPI access\nPriority support"}
                value={form.features}
                onChange={(e) => handleField('features', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                <Plus className="h-4 w-4" />
                {editingId ? 'Save Changes' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── Plan Cards Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onEdit={handleEdit} />
        ))}
      </div>

      {/* ── Plan Distribution ─────────────────────────────────────────────────── */}
      <Card title="Plan Distribution" subtitle="Active subscriptions per plan">
        <div className="space-y-4">
          {plans.map((plan) => {
            const pct = totalActive > 0 ? (plan.activeCount / totalActive) * 100 : 0;
            return (
              <div key={plan.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: plan.color }}
                    />
                    <span className="font-medium text-slate-700">{plan.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-xs">
                    <span>{plan.activeCount} active</span>
                    <span className="font-semibold text-slate-700">{pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: plan.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ── Plan Card sub-component ────────────────────────────────────────────────────
function PlanCard({ plan, onEdit }: { plan: SASubscription; onEdit: (plan: SASubscription) => void }) {
  const router = useRouter();
  const isUnlimited = (n: number) => n >= 999;

  const handleViewCenters = () => {
    const tier = plan.name.toLowerCase();
    if (tier === 'basic' || tier === 'pro' || tier === 'enterprise') {
      router.push(`/super-admin/centers?subscription=${tier}`);
    } else {
      router.push('/super-admin/centers');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
      {/* Colored top border accent */}
      <div className="h-1 w-full flex-shrink-0" style={{ backgroundColor: plan.color }} />

      <div className="p-6 flex flex-col flex-1 gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">
                {plan.price === 0 ? 'Custom' : formatCurrency(plan.price)}
              </span>
              {plan.price > 0 && (
                <Badge
                  label={`/${plan.billingCycle === 'monthly' ? 'month' : 'year'}`}
                  variant="secondary"
                />
              )}
            </div>
          </div>
          {/* Active count badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 flex-shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {plan.activeCount} active
          </span>
        </div>

        {/* Features */}
        <ul className="space-y-1.5 flex-1">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              {feature}
            </li>
          ))}
        </ul>

        {/* Limits */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-50">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <GitBranch className="h-3.5 w-3.5 text-slate-400" />
            <span>{isUnlimited(plan.maxBranches) ? '∞' : plan.maxBranches} branches</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span>{isUnlimited(plan.maxStudents) ? '∞' : plan.maxStudents.toLocaleString()} students</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
            <span>{isUnlimited(plan.maxTeachers) ? '∞' : plan.maxTeachers} teachers</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1 justify-center" onClick={() => onEdit(plan)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit Plan
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 justify-center" onClick={handleViewCenters}>
            <Building2 className="h-3.5 w-3.5" />
            View Centers
          </Button>
        </div>
      </div>
    </div>
  );
}
