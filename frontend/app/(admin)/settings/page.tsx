"use client";
import { useState } from "react";
import {
  User,
  Building2,
  Bell,
  Lock,
  Palette,
  Globe,
  Save,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/store/toast-store";
import { PaymentGatewaysTab } from "./_components/payment-gateways-tab";

const SETTINGS_TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "payment-gateways", label: "Payment Gateways", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Lock },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "language", label: "Language & Region", icon: Globe },
];

export function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1",
        enabled ? "bg-indigo-600" : "bg-slate-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          enabled ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [attendanceAlerts, setAttendanceAlerts] = useState(true);

  const [profile, setProfile] = useState({
    firstName: "Admin",
    lastName: "User",
    loginId: "EDU-100001",
    phone: "+1 555-0000",
    role: "Administrator",
  });

  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });

  function handleSaveProfile() {
    toast.success("Profile updated");
  }

  function handleUpdatePassword() {
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      toast.error("Fill in all password fields");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      toast.error("New password and confirmation do not match");
      return;
    }
    toast.success("Password updated");
    setPasswords({ current: "", next: "", confirm: "" });
  }

  function handleSaveOrganization() {
    toast.success("Organization settings saved");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account and system preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card noPadding>
            <nav className="py-2">
              {SETTINGS_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left",
                    activeTab === id
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("h-4 w-4", activeTab === id ? "text-indigo-600" : "text-slate-400")} />
                  <span className="flex-1">{label}</span>
                  <ChevronRight className={cn("h-4 w-4 opacity-0 transition-opacity", activeTab === id && "opacity-100 text-indigo-400")} />
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-4">
          {activeTab === "profile" && (
            <Card title="Profile Settings" subtitle="Update your personal information">
              <div className="space-y-4">
                <div className="flex items-center gap-5 pb-4 border-b border-slate-50">
                  <div className="h-16 w-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl">
                    A
                  </div>
                  <div>
                    <Button variant="outline" size="sm">Change Photo</Button>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG up to 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">First Name</label>
                    <Input
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Last Name</label>
                    <Input
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Login ID</label>
                    <Input value={profile.loginId} disabled />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Phone</label>
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Role</label>
                    <Input value={profile.role} disabled className="bg-slate-50 text-slate-400" />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveProfile}>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card title="Notification Preferences" subtitle="Choose how you want to be notified">
              <div className="space-y-0 divide-y divide-slate-50">
                {[
                  { label: "Email Notifications", description: "Receive notifications via email", value: emailNotifs, toggle: () => setEmailNotifs(!emailNotifs) },
                  { label: "SMS Notifications", description: "Receive notifications via SMS", value: smsNotifs, toggle: () => setSmsNotifs(!smsNotifs) },
                  { label: "Push Notifications", description: "Browser push notifications", value: pushNotifs, toggle: () => setPushNotifs(!pushNotifs) },
                  { label: "Payment Alerts", description: "Alerts for overdue and pending payments", value: paymentAlerts, toggle: () => setPaymentAlerts(!paymentAlerts) },
                  { label: "Attendance Alerts", description: "Alerts when attendance drops below threshold", value: attendanceAlerts, toggle: () => setAttendanceAlerts(!attendanceAlerts) },
                ].map(({ label, description, value, toggle }) => (
                  <div key={label} className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{label}</p>
                      <p className="text-xs text-slate-400">{description}</p>
                    </div>
                    <ToggleSwitch enabled={value} onChange={toggle} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "security" && (
            <Card title="Security Settings" subtitle="Manage your password and authentication">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Current Password</label>
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">New Password</label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={passwords.next}
                    onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Confirm New Password</label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleUpdatePassword}>
                    <Lock className="h-4 w-4" />
                    Update Password
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "organization" && (
            <Card title="Organization Settings" subtitle="Configure your organization details">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Organization Name</label>
                  <Input defaultValue="EduCore Academy" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Contact Email</label>
                    <Input type="email" defaultValue="contact@educore.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Contact Phone</label>
                    <Input defaultValue="+1 555-0000" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Address</label>
                  <Input defaultValue="123 Education Blvd, New York, NY 10001" />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveOrganization}>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "payment-gateways" && <PaymentGatewaysTab />}

          {(activeTab === "appearance" || activeTab === "language") && (
            <Card title={activeTab === "appearance" ? "Appearance" : "Language & Region"} subtitle="Customize your experience">
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Palette className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">Coming soon</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
