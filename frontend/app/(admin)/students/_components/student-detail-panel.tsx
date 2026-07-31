"use client";

import { ChevronLeft, KeyRound, Phone, Users, DollarSign, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { ATTENDANCE_RECORDS, INVOICES } from "@/lib/data";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Student } from "@/types";

const ATTENDANCE_COLORS: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-700",
  absent: "bg-red-100 text-red-600",
  late: "bg-amber-100 text-amber-700",
  excused: "bg-blue-100 text-blue-700",
};

interface StudentDetailPanelProps {
  student: Student;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function StudentDetailPanel({ student, onBack, onEdit, onDelete }: StudentDetailPanelProps) {
  const attendance = ATTENDANCE_RECORDS.filter((a) => a.studentId === student.id);
  const invoices = INVOICES.filter((i) => i.studentId === student.id);

  return (
    <Card noPadding>
      <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <Avatar name={student.name} size="md" />
          <div>
            <p className="font-semibold text-slate-900">{student.name}</p>
            <p className="text-xs text-slate-500">{student.groupName}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge status={student.status} />
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Personal Information
          </h4>
          <div className="space-y-3">
            <InfoRow icon={<KeyRound className="h-4 w-4" />} label="Login ID" value={student.loginId} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={student.phone} />
            <InfoRow icon={<Users className="h-4 w-4" />} label="Group" value={student.groupName} />
            <InfoRow icon={<Users className="h-4 w-4" />} label="Parent" value={student.parentName} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Parent Phone" value={student.parentPhone} />
            <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Balance" value={student.balance > 0 ? `-$${student.balance}` : "Paid"} />
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Recent Attendance</h4>
            {attendance.length === 0 ? (
              <p className="text-sm text-slate-400">No attendance records.</p>
            ) : (
              <div className="space-y-1.5">
                {attendance.map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${ATTENDANCE_COLORS[rec.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(rec.date)}</span>
                    </div>
                    {rec.note && <span className="text-xs text-slate-400 truncate max-w-[140px]">{rec.note}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Invoice History</h4>
            {invoices.length === 0 ? (
              <p className="text-sm text-slate-400">No invoices found.</p>
            ) : (
              <div className="space-y-1.5">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-xs text-slate-700">{inv.groupName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{formatCurrency(inv.amount)}</span>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-400 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-slate-400 block">{label}</span>
        <span className="text-sm text-slate-700 font-medium">{value}</span>
      </div>
    </div>
  );
}
