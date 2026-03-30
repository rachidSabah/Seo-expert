"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Shield,
  Bell,
  Palette,
  Plug,
  Eye,
  EyeOff,
  Check,
  X,
  Upload,
  Globe,
  Link2,
  Key,
  Loader2,
  Smartphone,
  Monitor,
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  BarChart3,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

// --- Mock Data ---

const timezones = [
  "UTC",
  "America/New_York (EST)",
  "America/Chicago (CST)",
  "America/Denver (MST)",
  "America/Los_Angeles (PST)",
  "Europe/London (GMT)",
  "Europe/Paris (CET)",
  "Europe/Berlin (CET)",
  "Asia/Tokyo (JST)",
  "Asia/Shanghai (CST)",
  "Australia/Sydney (AEST)",
];

const languages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Japanese",
  "Chinese (Simplified)",
];

const sessions = [
  {
    id: 1,
    device: "Desktop",
    browser: "Chrome 121",
    os: "macOS Sonoma",
    ip: "192.168.1.100",
    lastActive: "Now",
    current: true,
    icon: <Monitor className="h-4 w-4" />,
  },
  {
    id: 2,
    device: "Mobile",
    browser: "Safari 17",
    os: "iOS 17.2",
    ip: "192.168.1.101",
    lastActive: "2 hours ago",
    current: false,
    icon: <Smartphone className="h-4 w-4" />,
  },
];

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

// --- Component ---

export function Settings() {
  const [profileName, setProfileName] = useState("Admin");
  const [profileEmail, setProfileEmail] = useState("admin@seoexpert.com");
  const [companyName, setCompanyName] = useState("SEO Expert Pro");
  const [timezone, setTimezone] = useState("America/New_York (EST)");
  const [language, setLanguage] = useState("English");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    { id: "ranking", label: "Ranking Change Alerts", description: "Get notified when keyword rankings change significantly", enabled: true },
    { id: "backlinks", label: "New Backlink Alerts", description: "Notifications when new backlinks are detected", enabled: true },
    { id: "audit", label: "Audit Completion Alerts", description: "Receive alerts when SEO audits finish running", enabled: true },
    { id: "competitor", label: "Competitor Alerts", description: "Get notified when competitors make significant changes", enabled: false },
    { id: "weekly", label: "Weekly Summary Emails", description: "Receive a weekly digest of SEO performance", enabled: true },
    { id: "monthly", label: "Monthly Reports", description: "Automatic monthly report delivery via email", enabled: true },
    { id: "broken", label: "Broken Link Alerts", description: "Immediate alerts when broken links are detected", enabled: true },
  ]);

  // White-label state
  const [whiteLabelEnabled, setWhiteLabelEnabled] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [brandColor, setBrandColor] = useState("#10b981");
  const [customDomain, setCustomDomain] = useState("");
  const [reportFooter, setReportFooter] = useState("");

  // Integration state
  const [googleSearchConsole, setGoogleSearchConsole] = useState(false);
  const [googleAnalytics, setGoogleAnalytics] = useState(false);

  const toggleNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    );
  };

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: "", color: "", checks: { length: false, uppercase: false, lowercase: false, number: false, special: false } };

    const checks = {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword),
    };

    const score = Object.values(checks).filter(Boolean).length;
    let label = "";
    let color = "";
    if (score <= 2) { label = "Weak"; color = "bg-red-500"; }
    else if (score <= 3) { label = "Medium"; color = "bg-amber-500"; }
    else if (score <= 4) { label = "Strong"; color = "bg-emerald-500"; }
    else { label = "Very Strong"; color = "bg-emerald-600"; }

    return { score, label, color, checks };
  }, [newPassword]);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordStrength.score < 3) {
      toast.error("Password is too weak. Please choose a stronger password.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("seo_token") : null;
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        setIsChangingPassword(false);
        return;
      }

      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Failed to change password");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
      ) : (
        <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      )}
      <span className={met ? "text-emerald-600" : "text-muted-foreground"}>{text}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <User className="h-6 w-6 text-emerald-500" />
          Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account, security, notifications, and integrations.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="text-sm"><User className="h-4 w-4 mr-1.5" />Profile</TabsTrigger>
          <TabsTrigger value="security" className="text-sm"><Shield className="h-4 w-4 mr-1.5" />Security</TabsTrigger>
          <TabsTrigger value="notifications" className="text-sm"><Bell className="h-4 w-4 mr-1.5" />Notifications</TabsTrigger>
          <TabsTrigger value="branding" className="text-sm"><Palette className="h-4 w-4 mr-1.5" />Branding</TabsTrigger>
          <TabsTrigger value="integrations" className="text-sm"><Plug className="h-4 w-4 mr-1.5" />Integrations</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Profile Information</CardTitle>
              <CardDescription>Update your personal details and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-2xl font-bold">
                      A
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" className="w-fit text-sm">
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Upload Photo
                    </Button>
                    <span className="text-[11px] text-muted-foreground">JPG, PNG — Max 5MB</span>
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="flex flex-col gap-6 mt-4">
            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-md flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {/* Password Strength Meter */}
                    {newPassword && (
                      <div className="space-y-2 mt-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                              style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground min-w-[80px] text-right">
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <RequirementItem met={passwordStrength.checks.length} text="At least 8 characters" />
                          <RequirementItem met={passwordStrength.checks.uppercase} text="At least one uppercase letter" />
                          <RequirementItem met={passwordStrength.checks.lowercase} text="At least one lowercase letter" />
                          <RequirementItem met={passwordStrength.checks.number} text="At least one number" />
                          <RequirementItem met={passwordStrength.checks.special} text="At least one special character" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className={confirmPassword && confirmPassword !== newPassword ? "border-red-500 focus-visible:ring-red-500" : ""}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Passwords do not match
                      </p>
                    )}
                  </div>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white w-fit"
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Update Password
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-emerald-500" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
                      <Key className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">2FA Authentication</p>
                      <p className="text-xs text-muted-foreground">Protect your account with two-factor authentication</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800 text-[10px]">
                      Coming Soon
                    </Badge>
                    <Switch disabled />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-emerald-500" />
                  Active Sessions
                </CardTitle>
                <CardDescription>Manage devices currently signed in to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center gap-4 p-4 rounded-lg border bg-muted/20">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                        {session.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {session.browser} on {session.os}
                          </p>
                          {session.current && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 text-[10px]">
                              Current Session
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>IP: {session.ip}</span>
                          <span>•</span>
                          <span>Last active: {session.lastActive}</span>
                        </div>
                      </div>
                      {!session.current && (
                        <Button variant="outline" size="sm" className="text-xs text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950">
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
              <CardDescription>Choose which alerts and notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {notifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <div className="flex items-center justify-between py-4">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center shrink-0 mt-0.5">
                          <Bell className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{notification.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{notification.description}</p>
                        </div>
                      </div>
                      <Switch checked={notification.enabled} onCheckedChange={() => toggleNotification(notification.id)} />
                    </div>
                    {index < notifications.length - 1 && <Separator />}
                  </React.Fragment>
                ))}
              </div>

              <Separator className="my-4" />

              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-500" />
                  Email Notifications
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Notification Email</Label>
                    <Input defaultValue="admin@seoexpert.com" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Digest Frequency</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Digest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <Card className="mt-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">White-label Branding</CardTitle>
                  <CardDescription>Customize the appearance for client-facing reports</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Enable</span>
                  <Switch checked={whiteLabelEnabled} onCheckedChange={setWhiteLabelEnabled} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!whiteLabelEnabled ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Palette className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold">White-label Branding</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[300px]">
                    Enable white-label to customize report appearance with your own branding, logo, and colors.
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setWhiteLabelEnabled(true)}>
                    Enable White-label
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <Label>Brand Name</Label>
                      <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Your brand name" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Logo</Label>
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/30">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button variant="outline" size="sm" className="text-xs w-fit">Upload Logo</Button>
                          <span className="text-[11px] text-muted-foreground">PNG, SVG — Max 2MB</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Primary Color</Label>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg border overflow-hidden">
                          <input
                            type="color"
                            value={brandColor}
                            onChange={(e) => setBrandColor(e.target.value)}
                            className="h-full w-full cursor-pointer"
                          />
                        </div>
                        <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="w-[120px] font-mono text-xs" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Custom Domain</Label>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="reports.yourdomain.com" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Report Footer Text</Label>
                      <Input value={reportFooter} onChange={(e) => setReportFooter(e.target.value)} placeholder="Footer text..." />
                    </div>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white w-fit">
                      Save Branding
                    </Button>
                  </div>

                  {/* Preview */}
                  <div>
                    <Label className="text-sm text-muted-foreground mb-3 block">Branded Report Preview</Label>
                    <div className="rounded-xl border overflow-hidden">
                      <div className="p-5" style={{ backgroundColor: brandColor + "15", borderBottom: `3px solid ${brandColor}` }}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-8 w-8 rounded flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                            <span className="text-white font-bold text-sm">{(brandName || "B").charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold" style={{ color: brandColor }}>{brandName || "Your Brand"}</h4>
                            <p className="text-[10px] text-muted-foreground">SEO Report</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Score", value: "85" },
                            { label: "Keywords", value: "892" },
                            { label: "Links", value: "12.8K" },
                          ].map((stat) => (
                            <div key={stat.label} className="text-center p-2 rounded bg-background/80">
                              <p className="text-[9px] text-muted-foreground">{stat.label}</p>
                              <p className="text-xs font-bold">{stat.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 bg-muted/30">
                        <div className="space-y-1.5">
                          <div className="h-2 w-full rounded bg-muted" />
                          <div className="h-2 w-4/5 rounded bg-muted" />
                          <div className="h-2 w-3/5 rounded bg-muted" />
                        </div>
                      </div>
                      <div className="px-3 py-2 border-t" style={{ backgroundColor: brandColor + "10" }}>
                        <p className="text-[10px] text-muted-foreground text-center">{reportFooter || "© 2024 Your Brand"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="flex flex-col gap-6 mt-4">
            {/* Google Integrations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Connected Services</CardTitle>
                <CardDescription>Connect third-party services to enhance your SEO data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Google Search Console */}
                  <div className="flex items-start gap-4 p-5 rounded-xl border bg-muted/20">
                    <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                      <Globe className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">Google Search Console</h4>
                        {googleSearchConsole ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 text-[10px]">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            Not Connected
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Import search performance data, impressions, clicks, and CTR directly from Google Search Console.
                      </p>
                      {googleSearchConsole && (
                        <p className="text-xs text-emerald-600 mt-1">Last synced: 15 minutes ago</p>
                      )}
                    </div>
                    <Button
                      variant={googleSearchConsole ? "outline" : "default"}
                      className={!googleSearchConsole ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                      onClick={() => setGoogleSearchConsole(!googleSearchConsole)}
                    >
                      {googleSearchConsole ? (
                        <>
                          <XCircle className="h-4 w-4 mr-1.5" />
                          Disconnect
                        </>
                      ) : (
                        <>
                          <Link2 className="h-4 w-4 mr-1.5" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Google Analytics */}
                  <div className="flex items-start gap-4 p-5 rounded-xl border bg-muted/20">
                    <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center shrink-0">
                      <BarChart3 className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">Google Analytics</h4>
                        {googleAnalytics ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 text-[10px]">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            Not Connected
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Connect Google Analytics 4 to track organic traffic, user behavior, and conversion data alongside your SEO metrics.
                      </p>
                      {googleAnalytics && (
                        <p className="text-xs text-emerald-600 mt-1">Last synced: 30 minutes ago</p>
                      )}
                    </div>
                    <Button
                      variant={googleAnalytics ? "outline" : "default"}
                      className={!googleAnalytics ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                      onClick={() => setGoogleAnalytics(!googleAnalytics)}
                    >
                      {googleAnalytics ? (
                        <>
                          <XCircle className="h-4 w-4 mr-1.5" />
                          Disconnect
                        </>
                      ) : (
                        <>
                          <Link2 className="h-4 w-4 mr-1.5" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>

                  {/* More Integrations Coming Soon */}
                  <div className="flex items-start gap-4 p-5 rounded-xl border border-dashed bg-muted/10">
                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Plug className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">More Integrations</h4>
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800 text-[10px]">
                          Coming Soon
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Slack notifications, Ahrefs integration, SEMrush integration, and more are on the way.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Key Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4 text-emerald-500" />
                  API Key Management
                </CardTitle>
                <CardDescription>Manage API keys for programmatic access to the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/20">
                    <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                      <Key className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Production API Key</p>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">sk-prod-****************************a4f2</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 text-[10px]">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/20">
                    <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center shrink-0">
                      <Key className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Test API Key</p>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">sk-test-****************************b7e1</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800 text-[10px]">
                      Test
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" className="mt-4 text-sm">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Generate New Key
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
