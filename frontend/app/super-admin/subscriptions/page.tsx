'use client';

import { useState } from 'react';
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
import { SA_SUBSCRIPTIONS, SASubscription } from '@/lib/super-admin-data';
import { formatCurrency } from '@/lib/utils';

// ── Derived total active count for distribution bar ───────────────────────────
const totalActive = SA_SUBSCRIPTIONS.reduce((sum, p) => sum + p.activeCount, 0);

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

export default function SubscriptionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const handleField = (key: keyof typeof defaultForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCancel = () => {
    setForm(defaultForm);
    setShowForm(false);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app: send to API
    setShowForm(false);
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
            onClick={() => setShowForm((v) => !v)}
          >
            <Plus className="h-4 w-4" />
            Create Plan
          </Button>
        }
      />

      {/* ── Create Plan Form (toggle) ─────────────────────────────────────────── */}
      {showForm && (
        <Card title="New Subscription Plan" actions={
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
                Create Plan
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── Plan Cards Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SA_SUBSCRIPTIONS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>

      {/* ── Plan Distribution ─────────────────────────────────────────────────── */}
      <Card title="Plan Distribution" subtitle="Active subscriptions per plan">
        <div className="space-y-4">
          {SA_SUBSCRIPTIONS.map((plan) => {
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
function PlanCard({ plan }: { plan: SASubscription }) {
  const isUnlimited = (n: number) => n >= 999;

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
          <Button variant="outline" size="sm" className="flex-1 justify-center">
            <Pencil className="h-3.5 w-3.5" />
            Edit Plan
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 justify-center">
            <Building2 className="h-3.5 w-3.5" />
            View Centers
          </Button>
        </div>
      </div>
    </div>
  );
}
