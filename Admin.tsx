import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { storyTags, tagCategoryLabels, type TagCategory } from "@/react-app/data/tags";
import { countWords } from "@/react-app/utils/wordCount";
import {
  adminStats,
  pendingNovels,
  flaggedComments,
  adminUsers,
  revenueData,
  genreStats,
  formatCurrency,
  formatNumber,
  getTimeAgo,
  type PendingNovel,
  type FlaggedComment,
  type AdminUser,
} from "@/react-app/data/admin";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Shield,
  Clock,
  FileText,
  Flag,
  Search,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  BookMarked,
  Feather,
  Trophy,
  ArrowLeft,
  BarChart3,
  Plus,
  UserPlus,
  Edit,
  Trash2,
  Save,
  X,
  Check,
  Mail,
  Upload,
  FileUp,
  ImageIcon,
  Loader2,
  Layers,
  Bell,
  Gift,
  Vote,
  PenTool,
  Calendar,
  Radio,
  RotateCcw,
  Rocket,
  ArrowUpDown,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import RichTextEditor from "@/react-app/components/RichTextEditor";

type Tab = "overview" | "content" | "users" | "analytics" | "manage" | "admins" | "emails" | "writers" | "submissions" | "polls" | "cancellations" | "refunds" | "events" | "plan-changes";

export default function AdminPage() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    if (user) {
      fetch("/api/admin/check", { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          setIsAdmin(data.isAdmin);
          setCheckingAdmin(false);
        })
        .catch(() => {
          setIsAdmin(false);
          setCheckingAdmin(false);
        });
    } else if (!isPending) {
      setIsAdmin(false);
      setCheckingAdmin(false);
    }
  }, [user, isPending]);

  // Silently redirect non-admins to home page
  useEffect(() => {
    if (!isPending && !checkingAdmin && isAdmin === false) {
      navigate("/", { replace: true });
    }
  }, [isPending, checkingAdmin, isAdmin, navigate]);

  // Show loading while checking auth or admin status
  if (isPending || checkingAdmin || isAdmin === null || isAdmin === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  // Only these accounts can see/manage other admins
  const superAdminEmails = ["kennethibb136@gmail.com", "kcash2023a@gmail.com"];
  const isSuperAdmin = user?.email && superAdminEmails.includes(user.email);

  const allTabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "manage", label: "Manage", icon: <Feather className="w-4 h-4" /> },
    { id: "content", label: "Content", icon: <BookOpen className="w-4 h-4" /> },
    { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    { id: "admins", label: "Admins", icon: <Shield className="w-4 h-4" /> },
    { id: "emails", label: "Early Access", icon: <Mail className="w-4 h-4" /> },
    { id: "writers", label: "Writer Waitlist", icon: <PenTool className="w-4 h-4" /> },
    { id: "submissions", label: "Submissions", icon: <Trophy className="w-4 h-4" /> },
    { id: "polls", label: "Polls", icon: <Vote className="w-4 h-4" /> },
    { id: "events", label: "Events", icon: <Calendar className="w-4 h-4" /> },
    { id: "cancellations", label: "Cancellations", icon: <XCircle className="w-4 h-4" /> },
    { id: "refunds", label: "Refunds", icon: <RotateCcw className="w-4 h-4" /> },
    { id: "plan-changes", label: "Plan Changes", icon: <ArrowUpDown className="w-4 h-4" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
  ];

  // Hide admins and analytics tabs from non-super admins
  const tabs = isSuperAdmin ? allTabs : allTabs.filter(tab => tab.id !== "admins" && tab.id !== "analytics");

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border/50 p-4 hidden lg:block">
        <div className="mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
              <Feather className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-lg">Inkseries</span>
              <span className="block text-xs text-muted-foreground">Admin Panel</span>
            </div>
          </Link>
        </div>

        <nav className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              {user?.google_user_data?.picture ? (
                <img
                  src={user.google_user_data.picture}
                  alt={user.google_user_data.name || "Admin"}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {(user?.google_user_data?.name || "A")[0]}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.google_user_data?.name || "Admin"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate("/")}
            >
              Back to Site
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
              <Feather className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold">Admin</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Exit
          </Button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64 p-4 lg:p-8">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "manage" && <ManageTab />}
        {activeTab === "content" && <ContentTab searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
        {activeTab === "users" && <UsersTab searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
        {activeTab === "admins" && isSuperAdmin && <AdminsTab />}
        {activeTab === "emails" && <EmailsTab />}
        {activeTab === "writers" && <WriterWaitlistTab />}
        {activeTab === "submissions" && <SubmissionsTab />}
        {activeTab === "polls" && <PollsTab />}
        {activeTab === "events" && <EventsTab />}
        {activeTab === "cancellations" && <CancellationsTab />}
        {activeTab === "refunds" && <RefundsTab />}
        {activeTab === "plan-changes" && <PlanChangesTab />}
        {activeTab === "analytics" && isSuperAdmin && <AnalyticsTab />}
      </main>
    </div>
  );
}

function OverviewTab() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("We are updating Inkseries to bring you new features. Check back soon!");
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [maintenanceLoaded, setMaintenanceLoaded] = useState(false);
  
  // Coming Soon state
  const [comingSoonMode, setComingSoonMode] = useState(false);
  const [launchDate, setLaunchDate] = useState("");
  const [savingComingSoon, setSavingComingSoon] = useState(false);
  const [comingSoonLoaded, setComingSoonLoaded] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistEmails, setWaitlistEmails] = useState<Array<{ id: number; email: string; created_at: string }>>([]);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [sendLaunchEmails, setSendLaunchEmails] = useState(true);
  const [emailsSentCount, setEmailsSentCount] = useState<number | null>(null);
  
  useEffect(() => {
    fetch("/api/maintenance/status")
      .then(res => res.json())
      .then(data => {
        setMaintenanceMode(data.enabled === true);
        if (data.message) setMaintenanceMessage(data.message);
        setMaintenanceLoaded(true);
      })
      .catch(() => setMaintenanceLoaded(true));
    
    // Fetch coming soon status
    fetch("/api/coming-soon/status")
      .then(res => res.json())
      .then(data => {
        setComingSoonMode(data.enabled === true);
        if (data.launchDate) {
          // Convert to datetime-local format
          const date = new Date(data.launchDate);
          setLaunchDate(date.toISOString().slice(0, 16));
        }
        setComingSoonLoaded(true);
      })
      .catch(() => setComingSoonLoaded(true));
    
    // Fetch waitlist count
    fetch("/api/admin/launch-waitlist", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setWaitlistEmails(data.waitlist || []);
        setWaitlistCount(data.waitlist?.length || 0);
      })
      .catch(() => {});
  }, []);
  
  const toggleMaintenance = async () => {
    setSavingMaintenance(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled: !maintenanceMode, message: maintenanceMessage })
      });
      if (res.ok) {
        setMaintenanceMode(!maintenanceMode);
      }
    } catch (e) {
      console.error("Failed to toggle maintenance:", e);
    }
    setSavingMaintenance(false);
  };
  
  const toggleComingSoon = async () => {
    // If turning off and there are waitlist signups, show confirmation modal
    if (comingSoonMode && waitlistCount > 0) {
      setShowLaunchModal(true);
      return;
    }
    
    // Otherwise toggle directly
    setSavingComingSoon(true);
    try {
      const res = await fetch("/api/admin/coming-soon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          enabled: !comingSoonMode, 
          launchDate: launchDate ? new Date(launchDate).toISOString() : null 
        })
      });
      if (res.ok) {
        setComingSoonMode(!comingSoonMode);
      }
    } catch (e) {
      console.error("Failed to toggle coming soon:", e);
    }
    setSavingComingSoon(false);
  };
  
  const confirmLaunch = async () => {
    setSavingComingSoon(true);
    try {
      const res = await fetch("/api/admin/coming-soon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          enabled: false, 
          launchDate: launchDate ? new Date(launchDate).toISOString() : null,
          sendEmails: sendLaunchEmails
        })
      });
      if (res.ok) {
        const data = await res.json();
        setComingSoonMode(false);
        setShowLaunchModal(false);
        if (data.emailsSent > 0) {
          setEmailsSentCount(data.emailsSent);
          setTimeout(() => setEmailsSentCount(null), 5000);
        }
      }
    } catch (e) {
      console.error("Failed to launch:", e);
    }
    setSavingComingSoon(false);
  };
  
  const saveLaunchDate = async () => {
    setSavingComingSoon(true);
    try {
      await fetch("/api/admin/coming-soon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          enabled: comingSoonMode, 
          launchDate: launchDate ? new Date(launchDate).toISOString() : null 
        })
      });
    } catch (e) {
      console.error("Failed to save launch date:", e);
    }
    setSavingComingSoon(false);
  };
  
  const deleteFromWaitlist = async (id: number) => {
    try {
      await fetch(`/api/admin/launch-waitlist/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      setWaitlistEmails(prev => prev.filter(e => e.id !== id));
      setWaitlistCount(prev => prev - 1);
    } catch (e) {
      console.error("Failed to delete from waitlist:", e);
    }
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with Inkseries today.
        </p>
      </div>
      
      {/* Maintenance Mode Toggle */}
      {maintenanceLoaded && (
        <Card className={maintenanceMode ? "bg-amber-500/10 border-amber-500/30" : "bg-zinc-900/50 border-zinc-800"}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${maintenanceMode ? "bg-amber-500/20" : "bg-zinc-800"}`}>
                  <AlertTriangle className={`w-6 h-6 ${maintenanceMode ? "text-amber-400" : "text-zinc-500"}`} />
                </div>
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">
                    {maintenanceMode 
                      ? "Site is offline for visitors. Admins can still access." 
                      : "Site is live and accessible to everyone."
                    }
                  </p>
                </div>
              </div>
              <Button
                onClick={toggleMaintenance}
                disabled={savingMaintenance}
                variant={maintenanceMode ? "default" : "outline"}
                className={maintenanceMode ? "bg-amber-600 hover:bg-amber-700" : ""}
              >
                {savingMaintenance ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : maintenanceMode ? (
                  "Turn Off"
                ) : (
                  "Turn On"
                )}
              </Button>
            </div>
            {maintenanceMode && (
              <div className="mt-4 pt-4 border-t border-amber-500/20">
                <label className="text-sm text-muted-foreground block mb-2">Message shown to visitors:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                    placeholder="Maintenance message..."
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const res = await fetch("/api/admin/maintenance", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ enabled: maintenanceMode, message: maintenanceMessage })
                      });
                      if (res.ok) {
                        alert("Message updated!");
                      }
                    }}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Coming Soon Mode Toggle */}
      {comingSoonLoaded && (
        <Card className={comingSoonMode ? "bg-purple-500/10 border-purple-500/30" : "bg-zinc-900/50 border-zinc-800"}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${comingSoonMode ? "bg-purple-500/20" : "bg-zinc-800"}`}>
                  <Rocket className={`w-6 h-6 ${comingSoonMode ? "text-purple-400" : "text-zinc-500"}`} />
                </div>
                <div>
                  <p className="font-medium">Coming Soon Mode</p>
                  <p className="text-sm text-muted-foreground">
                    {comingSoonMode 
                      ? "Site shows launch countdown. Logged-in users can still access." 
                      : "Site is fully accessible to everyone."
                    }
                  </p>
                </div>
              </div>
              <Button
                onClick={toggleComingSoon}
                disabled={savingComingSoon}
                variant={comingSoonMode ? "default" : "outline"}
                className={comingSoonMode ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                {savingComingSoon ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : comingSoonMode ? (
                  "Turn Off"
                ) : (
                  "Turn On"
                )}
              </Button>
            </div>
            {comingSoonMode && (
              <div className="mt-4 pt-4 border-t border-purple-500/20 space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Launch Date & Time:</label>
                  <div className="flex gap-2">
                    <input
                      type="datetime-local"
                      value={launchDate}
                      onChange={(e) => setLaunchDate(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                      style={{ colorScheme: 'dark' }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={saveLaunchDate}
                      disabled={savingComingSoon}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                  {launchDate && (
                    <p className="text-xs text-purple-400 mt-2">
                      Countdown target: {new Date(launchDate).toLocaleDateString('en-NG', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Launch Waitlist</p>
                    <p className="text-xs text-muted-foreground">{waitlistCount} people signed up</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowWaitlist(!showWaitlist)}
                  >
                    {showWaitlist ? "Hide List" : "View List"}
                  </Button>
                </div>
                
                {showWaitlist && waitlistEmails.length > 0 && (
                  <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 max-h-48 overflow-y-auto">
                    {waitlistEmails.map((item) => (
                      <div key={item.id} className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 last:border-b-0">
                        <div>
                          <p className="text-sm">{item.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => deleteFromWaitlist(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {showWaitlist && waitlistEmails.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No signups yet</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Launch Confirmation Modal */}
      {showLaunchModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Launch Inkseries!</h3>
                <p className="text-sm text-muted-foreground">You're about to go live</p>
              </div>
            </div>
            
            <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendLaunchEmails}
                  onChange={(e) => setSendLaunchEmails(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-purple-500 focus:ring-purple-500"
                />
                <div>
                  <p className="font-medium">Send launch emails to waitlist</p>
                  <p className="text-sm text-muted-foreground">
                    Notify {waitlistCount} people that Inkseries is now live with their 7-day free trial offer.
                  </p>
                </div>
              </label>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowLaunchModal(false)}
                disabled={savingComingSoon}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={confirmLaunch}
                disabled={savingComingSoon}
              >
                {savingComingSoon ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Launch Now
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Emails Sent Success Toast */}
      {emailsSentCount !== null && (
        <div className="fixed bottom-4 right-4 bg-green-500/90 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4">
          <Mail className="w-5 h-5" />
          <div>
            <p className="font-medium">Launch emails sent!</p>
            <p className="text-sm opacity-90">{emailsSentCount} waitlist subscribers notified</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={formatNumber(adminStats.totalUsers)}
          change="+12.5%"
          trend="up"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Active Subscribers"
          value={formatNumber(adminStats.activeSubscribers)}
          change="+8.2%"
          trend="up"
          icon={<BookMarked className="w-5 h-5" />}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(adminStats.monthlyRevenue)}
          change="+15.3%"
          trend="up"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard
          title="Total Reads"
          value={formatNumber(adminStats.totalReads)}
          change="+22.1%"
          trend="up"
          icon={<Eye className="w-5 h-5" />}
        />
      </div>

      {/* Alerts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="bg-orange-500/10 border-orange-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-orange-400">
                {adminStats.pendingNovels} novels pending review
              </p>
              <p className="text-sm text-muted-foreground">
                New submissions awaiting approval
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
              <Flag className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-400">
                {adminStats.flaggedContent} flagged items
              </p>
              <p className="text-sm text-muted-foreground">
                Comments reported by users
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Novels Preview */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Pending Reviews</CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingNovels.slice(0, 3).map((novel) => (
              <div key={novel.id} className="flex items-start gap-3">
                <img
                  src={novel.authorAvatar}
                  alt={novel.author}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{novel.title}</p>
                  <p className="text-xs text-muted-foreground">
                    by {novel.author} • {novel.genre}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {getTimeAgo(novel.submittedAt)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Flagged Content Preview */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Flagged Comments</CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {flaggedComments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-1">{comment.content}</p>
                  <p className="text-xs text-muted-foreground">
                    {comment.reason} • {comment.reportCount} reports
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Email Notifications */}
      <NotificationActions />
      <ReferralAnalytics />
    </div>
  );
}

function ReferralAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<{
    total_successful_referrals: number;
    total_bonus_days_awarded: number;
    total_link_clicks: number;
    conversion_rate: string;
    top_referrers: Array<{
      display_name: string;
      email: string;
      referrals: number;
      days_earned: number;
      has_early_access: number;
    }>;
  } | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/admin/referrals/analytics", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (err) {
        console.error("Failed to fetch referral analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Referral Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <p className="text-2xl font-bold text-primary">{analytics.total_successful_referrals}</p>
            <p className="text-xs text-muted-foreground">Successful Referrals</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
            <p className="text-2xl font-bold text-green-500">{analytics.total_bonus_days_awarded}</p>
            <p className="text-xs text-muted-foreground">Days Awarded</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
            <p className="text-2xl font-bold text-blue-500">{analytics.total_link_clicks}</p>
            <p className="text-xs text-muted-foreground">Link Clicks</p>
          </div>
          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
            <p className="text-2xl font-bold text-orange-500">{analytics.conversion_rate}%</p>
            <p className="text-xs text-muted-foreground">Conversion Rate</p>
          </div>
        </div>

        {/* Top Referrers */}
        {analytics.top_referrers.length > 0 && (
          <div>
            <p className="font-medium mb-3">Top 10 Referrers</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {analytics.top_referrers.map((referrer, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm flex items-center gap-2">
                        {referrer.display_name || "Unknown"}
                        {referrer.has_early_access === 1 && (
                          <span className="px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded">Ambassador</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{referrer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{referrer.referrals}</p>
                    <p className="text-xs text-muted-foreground">{referrer.days_earned} days</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {analytics.top_referrers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No successful referrals yet</p>
        )}
      </CardContent>
    </Card>
  );
}

function NotificationActions() {
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [birthdayLoading, setBirthdayLoading] = useState(false);
  const [renewalResult, setRenewalResult] = useState<{ sent: number } | null>(null);
  const [birthdayResult, setBirthdayResult] = useState<{ sent: number } | null>(null);

  const sendRenewalReminders = async () => {
    setRenewalLoading(true);
    setRenewalResult(null);
    try {
      const res = await fetch("/api/notifications/check-expiry", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      setRenewalResult({ sent: data.notificationsSent || 0 });
    } catch {
      setRenewalResult({ sent: 0 });
    } finally {
      setRenewalLoading(false);
    }
  };

  const sendBirthdayNotifications = async () => {
    setBirthdayLoading(true);
    setBirthdayResult(null);
    try {
      const res = await fetch("/api/notifications/check-birthdays", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      setBirthdayResult({ sent: data.notificationsSent || 0 });
    } catch {
      setBirthdayResult({ sent: 0 });
    } finally {
      setBirthdayLoading(false);
    }
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Manually trigger notification emails for subscribers
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="font-medium">Renewal Reminders</p>
                <p className="text-xs text-muted-foreground">7, 3, and 1 day warnings</p>
              </div>
            </div>
            <Button
              onClick={sendRenewalReminders}
              disabled={renewalLoading}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              {renewalLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                "Send Renewal Reminders"
              )}
            </Button>
            {renewalResult && (
              <p className="text-xs text-center mt-2 text-amber-400">
                {renewalResult.sent} email{renewalResult.sent !== 1 ? "s" : ""} sent
              </p>
            )}
          </div>

          <div className="p-4 rounded-lg bg-pink-500/10 border border-pink-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                <Gift className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <p className="font-medium">Birthday Greetings</p>
                <p className="text-xs text-muted-foreground">Today's birthdays</p>
              </div>
            </div>
            <Button
              onClick={sendBirthdayNotifications}
              disabled={birthdayLoading}
              className="w-full bg-pink-600 hover:bg-pink-700"
            >
              {birthdayLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                "Send Birthday Greetings"
              )}
            </Button>
            {birthdayResult && (
              <p className="text-xs text-center mt-2 text-pink-400">
                {birthdayResult.sent} email{birthdayResult.sent !== 1 ? "s" : ""} sent
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ContentTab({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) {
  const [contentTab, setContentTab] = useState<"pending" | "flagged">("pending");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Content Moderation</h1>
          <p className="text-muted-foreground">
            Review submissions and manage flagged content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-muted/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/50 pb-4">
        <button
          onClick={() => setContentTab("pending")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            contentTab === "pending"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Pending Novels ({pendingNovels.length})
        </button>
        <button
          onClick={() => setContentTab("flagged")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            contentTab === "flagged"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Flagged Comments ({flaggedComments.length})
        </button>
      </div>

      {/* Content */}
      {contentTab === "pending" ? (
        <div className="space-y-4">
          {pendingNovels.map((novel) => (
            <PendingNovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {flaggedComments.map((comment) => (
            <FlaggedCommentCard key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}

function UsersTab({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | "writers" | "subscribers">("all");

  const filteredUsers = adminUsers.filter((user) => {
    if (filter === "writers") return user.isWriter;
    if (filter === "subscribers") return user.subscriptionTier !== "free";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">
            View and manage user accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-muted/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "writers", "subscribers"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <Card className="bg-card/50 border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Subscription</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Joined</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Last Active</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Stats</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">
          Platform performance and insights
        </p>
      </div>

      {/* Revenue Chart Placeholder */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-2">
            {revenueData.map((data) => (
              <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-primary to-orange-500 rounded-t-lg transition-all hover:opacity-80"
                  style={{
                    height: `${(data.revenue / 5000000) * 100}%`,
                  }}
                />
                <span className="text-xs text-muted-foreground">{data.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total: {formatCurrency(adminStats.totalRevenue)}</span>
            <span className="text-green-400 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              +15.3% vs last period
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Genre Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Genre Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {genreStats.map((genre) => (
              <div key={genre.genre} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{genre.genre}</span>
                  <span className="text-muted-foreground">{genre.count} novels</span>
                </div>
                <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full"
                    style={{ width: `${(genre.count / 245) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Top Performing Genres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {genreStats
              .sort((a, b) => b.reads - a.reads)
              .slice(0, 5)
              .map((genre, index) => (
                <div key={genre.genre} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{genre.genre}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(genre.reads)} total reads
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {((genre.reads / 2340000) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Component helpers

interface AdminProfile {
  id: number;
  auth_user_id: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  is_admin?: number;
}

function AdminsTab() {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AdminProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);
  const [adding, setAdding] = useState<number | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/admins", { credentials: "include" });
      const data = await res.json();
      setAdmins(data.admins || []);
    } catch (e) {
      console.error("Failed to fetch admins:", e);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`, { credentials: "include" });
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch (e) {
      console.error("Failed to search users:", e);
    } finally {
      setSearching(false);
    }
  };

  const handleGrantAdmin = async (profileId: number) => {
    setAdding(profileId);
    try {
      const res = await fetch(`/api/admin/admins/${profileId}`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        await fetchAdmins();
        setSearchQuery("");
        setSearchResults([]);
      } else {
        alert(data.error || "Failed to grant admin access");
      }
    } catch (e) {
      alert("Failed to grant admin access");
    } finally {
      setAdding(null);
    }
  };

  const handleRevokeAdmin = async (profileId: number) => {
    if (!confirm("Are you sure you want to remove admin access from this user?")) return;
    setRemoving(profileId);
    try {
      const res = await fetch(`/api/admin/admins/${profileId}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        await fetchAdmins();
      } else {
        alert(data.error || "Failed to revoke admin access");
      }
    } catch (e) {
      alert("Failed to revoke admin access");
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Management</h1>
        <p className="text-muted-foreground">
          Manage who has administrative access to Inkseries
        </p>
      </div>

      {/* Add New Admin */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add New Admin
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Search for a user by name or email, then click "Grant Admin" to give them admin access
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-muted/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          
          {searching && (
            <div className="mt-4 flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary" />
            </div>
          )}

          {!searching && searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.display_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {(user.email || user.display_name || "U")[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{user.display_name || "Unnamed User"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      {user.is_admin === 1 && (
                        <span className="text-xs text-primary">Already an admin</span>
                      )}
                    </div>
                  </div>
                  {user.is_admin !== 1 && (
                    <Button 
                      size="sm" 
                      onClick={() => handleGrantAdmin(user.id)}
                      disabled={adding === user.id}
                    >
                      {adding === user.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1" />
                          Grant Admin
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground text-center py-4">
              No users found matching "{searchQuery}"
            </p>
          )}

          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <p className="mt-4 text-sm text-muted-foreground text-center py-4">
              Type at least 2 characters to search
            </p>
          )}
        </CardContent>
      </Card>

      {/* Current Admins */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Current Admins ({admins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No admins found</p>
          ) : (
            <div className="space-y-3">
              {admins.map((admin, index) => (
                <div key={admin.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {admin.avatar_url ? (
                        <img src={admin.avatar_url} alt={admin.display_name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-lg font-medium text-primary">
                            {(admin.display_name || "A")[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      {index === 0 && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-[10px] text-primary-foreground font-bold">1</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{admin.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Admin since {new Date(admin.created_at).toLocaleDateString()}
                      </p>
                      {index === 0 && (
                        <span className="text-xs text-primary">Original admin</span>
                      )}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="text-red-400 hover:text-red-400 hover:bg-red-500/10"
                    onClick={() => handleRevokeAdmin(admin.id)}
                    disabled={removing === admin.id || admins.length === 1}
                    title={admins.length === 1 ? "Cannot remove the last admin" : "Remove admin access"}
                  >
                    {removing === admin.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current" />
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-1" />
                        Remove
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="p-4 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="font-medium text-blue-400 mb-1">About Admin Access</p>
            <p className="text-sm text-muted-foreground">
              Admins can manage novels, chapters, users, and content moderation. They can also grant or revoke admin access to other users. 
              Be careful who you give admin access to — they will have full control over the platform.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface AdminNovel {
  id: number;
  title: string;
  slug: string;
  author_name: string | null;
  cover_image_url: string | null;
  synopsis: string | null;
  genre: string;
  status: string;
  is_featured: number;
  total_chapters: number;
  total_reads: number;
  created_at: string;
  chapter_format: string | null;
  tags: string | string[] | null;
}

interface AdminSeason {
  id: number;
  novel_id: number;
  season_number: number;
  title: string;
  synopsis: string | null;
  cover_image_url: string | null;
  release_date: string | null;
  episode_count?: number;
}

interface AdminChapter {
  id: number;
  novel_id: number;
  chapter_number: number;
  part_number: number;
  season_id: number | null;
  season_title?: string;
  season_num?: number;
  title: string;
  content: string;
  word_count: number;
  is_premium: number;
  is_published: number;
  scheduled_release_at: string | null;
}

const GENRES = ["African Fantasy and Mythology", "Family and Identity", "Romance and First Love", "School Life and Friendships", "Street and Hustle", "Thriller and Mystery"];

function ManageTab() {
  const [novels, setNovels] = useState<AdminNovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNovelForm, setShowNovelForm] = useState(false);
  const [editingNovel, setEditingNovel] = useState<AdminNovel | null>(null);
  const [selectedNovel, setSelectedNovel] = useState<AdminNovel | null>(null);
  const [chapters, setChapters] = useState<AdminChapter[]>([]);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState<AdminChapter | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkPremium, setBulkPremium] = useState(false);
  const [bulkPublished, setBulkPublished] = useState(true);
  const [parsedChapters, setParsedChapters] = useState<Array<{ title: string; content: string }>>([]);
  const [importing, setImporting] = useState(false);
  const [selectedChapters, setSelectedChapters] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [novelSearchQuery, setNovelSearchQuery] = useState("");

  // Season states (UI to be completed)
  const [seasons, setSeasons] = useState<AdminSeason[]>([]);
  const [showSeasonForm, setShowSeasonForm] = useState(false);
  const [editingSeason, setEditingSeason] = useState<AdminSeason | null>(null);
  const [seasonForm, setSeasonForm] = useState({
    season_number: 1, title: "", synopsis: "", cover_image_url: "", release_date: ""
  });
  const [savingSeason, setSavingSeason] = useState(false);
  const [showSeasonsManager, setShowSeasonsManager] = useState(false);

  // Form states
  const [novelForm, setNovelForm] = useState({
    title: "", slug: "", author_name: "", cover_image_url: "", synopsis: "", genre: "Romance and First Love", status: "ongoing", is_featured: false, chapter_format: "chapter", tags: [] as string[]
  });
  const [chapterForm, setChapterForm] = useState({
    title: "", content: "", is_premium: false, is_published: true, scheduled_release_at: "", part_number: 1, chapter_number: 1, season_id: null as number | null
  });
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverDragging, setCoverDragging] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchNovels();
  }, []);

  useEffect(() => {
    if (selectedNovel) {
      fetchChapters(selectedNovel.id);
      fetchSeasons(selectedNovel.id);
    }
  }, [selectedNovel]);

  const fetchNovels = async () => {
    try {
      const res = await fetch("/api/admin/novels", { credentials: "include" });
      const data = await res.json();
      setNovels(data.novels || []);
    } catch (e) {
      console.error("Failed to fetch novels:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeasons = async (novelId: number) => {
    try {
      const res = await fetch(`/api/admin/novels/${novelId}/seasons`, { credentials: "include" });
      const data = await res.json();
      setSeasons(data.seasons || []);
    } catch (e) {
      console.error("Failed to fetch seasons:", e);
    }
  };

  const fetchChapters = async (novelId: number) => {
    try {
      const res = await fetch(`/api/admin/novels/${novelId}/chapters`, { credentials: "include" });
      const data = await res.json();
      setChapters(data.chapters || []);
    } catch (e) {
      console.error("Failed to fetch chapters:", e);
    }
  };

  const handleSaveSeason = async () => {
    if (!selectedNovel || !seasonForm.title) {
      alert("Season title is required");
      return;
    }
    setSavingSeason(true);
    try {
      const url = editingSeason 
        ? `/api/admin/seasons/${editingSeason.id}` 
        : `/api/admin/novels/${selectedNovel.id}/seasons`;
      const method = editingSeason ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(seasonForm),
      });
      if (res.ok) {
        await fetchSeasons(selectedNovel.id);
        setShowSeasonForm(false);
        setEditingSeason(null);
        setSeasonForm({ season_number: 1, title: "", synopsis: "", cover_image_url: "", release_date: "" });
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save season");
      }
    } catch (e) {
      alert("Failed to save season");
    } finally {
      setSavingSeason(false);
    }
  };

  const handleDeleteSeason = async (seasonId: number) => {
    if (!selectedNovel) return;
    if (!confirm("Delete this season? Episodes will be unlinked but not deleted.")) return;
    try {
      const res = await fetch(`/api/admin/seasons/${seasonId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        await fetchSeasons(selectedNovel.id);
        await fetchChapters(selectedNovel.id);
      }
    } catch (e) {
      alert("Failed to delete season");
    }
  };

  const handleEditSeason = (season: AdminSeason) => {
    setEditingSeason(season);
    setSeasonForm({
      season_number: season.season_number,
      title: season.title,
      synopsis: season.synopsis || "",
      cover_image_url: season.cover_image_url || "",
      release_date: season.release_date || ""
    });
    setShowSeasonForm(true);
  };


  const handleSaveNovel = async () => {
    if (!novelForm.title || !novelForm.slug) {
      alert("Title and slug are required");
      return;
    }
    setSaving(true);
    try {
      const url = editingNovel ? `/api/admin/novels/${editingNovel.id}` : "/api/admin/novels";
      const method = editingNovel ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(novelForm),
      });
      if (res.ok) {
        await fetchNovels();
        setShowNovelForm(false);
        setEditingNovel(null);
        setNovelForm({ title: "", slug: "", author_name: "", cover_image_url: "", synopsis: "", genre: "Romance and First Love", status: "ongoing", is_featured: false, chapter_format: "chapter", tags: [] });
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save novel");
      }
    } catch (e) {
      alert("Failed to save novel");
    } finally {
      setSaving(false);
    }
  };

  const [uploadStatus, setUploadStatus] = useState<string>("");
  
  const handleCoverUpload = async (file: File) => {
    // Check file extension as fallback since some Android phones don't set MIME type correctly
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    const hasValidMimeType = file.type.startsWith("image/") || file.type === "" || file.type === "application/octet-stream";
    
    setUploadStatus(`File selected: ${file.name} (${(file.size / 1024).toFixed(1)}KB, type: ${file.type || 'unknown'})`);
    
    if (!hasValidExtension && !hasValidMimeType) {
      setUploadStatus("Error: Invalid file type");
      alert("Please upload an image file (JPG, PNG, GIF, or WebP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadStatus("Error: File too large");
      alert("Image must be under 10MB");
      return;
    }
    
    setCoverUploading(true);
    setUploadStatus("Uploading to server...");
    
    try {
      const formData = new FormData();
      formData.append("cover", file);
      
      const res = await fetch("/api/admin/covers/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      setUploadStatus(`Server responded: ${res.status} ${res.statusText}`);
      
      const data = await res.json();
      if (res.ok && data.url) {
        setUploadStatus(`Success! URL: ${data.url}`);
        // Use functional update to avoid stale closure issue
        setNovelForm(prev => ({ ...prev, cover_image_url: data.url }));
      } else {
        setUploadStatus(`Upload failed: ${data.error || 'Unknown error'}`);
        console.error("Cover upload failed:", data);
        alert(data.error || "Failed to upload cover");
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      setUploadStatus(`Network error: ${errorMsg}`);
      console.error("Cover upload error:", e);
      alert(`Upload failed: ${errorMsg}`);
    } finally {
      setCoverUploading(false);
    }
  };

  const handleCoverDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setCoverDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleCoverUpload(file);
  };

  const handleCoverDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setCoverDragging(true);
  };

  const handleCoverDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setCoverDragging(false);
  };

  const handleDeleteNovel = async (id: number) => {
    if (!confirm("Delete this novel and all its chapters? This cannot be undone.")) return;
    try {
      await fetch(`/api/admin/novels/${id}`, { method: "DELETE", credentials: "include" });
      await fetchNovels();
      if (selectedNovel?.id === id) setSelectedNovel(null);
    } catch (e) {
      alert("Failed to delete novel");
    }
  };

  const handleEditNovel = (novel: AdminNovel) => {
    setEditingNovel(novel);
    const novelTags = novel.tags ? (typeof novel.tags === 'string' ? JSON.parse(novel.tags) : novel.tags) : [];
    setNovelForm({
      title: novel.title,
      slug: novel.slug,
      author_name: novel.author_name || "",
      cover_image_url: novel.cover_image_url || "",
      synopsis: novel.synopsis || "",
      genre: novel.genre,
      status: novel.status,
      is_featured: novel.is_featured === 1,
      chapter_format: novel.chapter_format || "chapter",
      tags: novelTags,
    });
    setShowNovelForm(true);
  };

  const handleSaveChapter = async () => {
    if (!chapterForm.title || !selectedNovel) return;
    setSaving(true);
    try {
      const url = editingChapter 
        ? `/api/admin/chapters/${editingChapter.id}` 
        : `/api/admin/novels/${selectedNovel.id}/chapters`;
      const method = editingChapter ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...chapterForm,
          scheduled_release_at: chapterForm.scheduled_release_at 
            ? new Date(chapterForm.scheduled_release_at).toISOString() 
            : null,
        }),
      });
      if (res.ok) {
        await fetchChapters(selectedNovel.id);
        await fetchNovels();
        setShowChapterForm(false);
        setEditingChapter(null);
        setChapterForm({ title: "", content: "", is_premium: false, is_published: true, scheduled_release_at: "", part_number: 1, chapter_number: 1, season_id: null });
      }
    } catch (e) {
      alert("Failed to save chapter");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChapter = async (id: number) => {
    if (!confirm("Delete this chapter?")) return;
    try {
      await fetch(`/api/admin/chapters/${id}`, { method: "DELETE", credentials: "include" });
      if (selectedNovel) {
        await fetchChapters(selectedNovel.id);
        await fetchNovels();
      }
    } catch (e) {
      alert("Failed to delete chapter");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedChapters.size === 0) return;
    if (!confirm(`Delete ${selectedChapters.size} chapter${selectedChapters.size > 1 ? 's' : ''}? This cannot be undone.`)) return;
    
    setBulkDeleting(true);
    try {
      const res = await fetch(`/api/admin/chapters/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chapterIds: Array.from(selectedChapters) }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      setSelectedChapters(new Set());
      if (selectedNovel) {
        await fetchChapters(selectedNovel.id);
        await fetchNovels();
      }
    } catch (e) {
      alert("Failed to delete chapters");
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleChapterSelection = (id: number) => {
    setSelectedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedChapters.size === chapters.length) {
      setSelectedChapters(new Set());
    } else {
      setSelectedChapters(new Set(chapters.map(c => c.id)));
    }
  };

  const handleEditChapter = (chapter: AdminChapter) => {
    setEditingChapter(chapter);
    // Convert ISO date to datetime-local format (YYYY-MM-DDTHH:MM)
    let releaseDate = "";
    if (chapter.scheduled_release_at) {
      const date = new Date(chapter.scheduled_release_at);
      if (!isNaN(date.getTime())) {
        releaseDate = date.toISOString().slice(0, 16);
      }
    }
    setChapterForm({
      title: chapter.title,
      content: chapter.content || "",
      is_premium: chapter.is_premium === 1,
      is_published: chapter.is_published === 1,
      scheduled_release_at: releaseDate,
      part_number: chapter.part_number || 1,
      chapter_number: chapter.chapter_number || 1,
      season_id: chapter.season_id || null,
    });
    setShowChapterForm(true);
  };

  // Parse bulk text into chapters using dividers
  // Regex patterns for chapter headings
  const chapterPatterns = [
    // "Chapter 1", "Chapter One", "CHAPTER 1", "Chapter 1:", "Chapter 1 -"
    /^(chapter|chap\.?)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)[\s:.\-–—]*/i,
    // "Episode 1", "Episode One"
    /^(episode|ep\.?)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)[\s:.\-–—]*/i,
    // "Part 1", "Part One"
    /^(part)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)[\s:.\-–—]*/i,
    // "Book 1", "Volume 1"
    /^(book|volume|vol\.?)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)[\s:.\-–—]*/i,
  ];

  const isChapterHeading = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 100) return false;
    return chapterPatterns.some(pattern => pattern.test(trimmed));
  };

  const parseBulkText = (text: string) => {
    // Clean up text first - remove hidden characters from PDF/Word copy-paste
    let cleanedText = text
      .replace(/\f/g, '') // Remove form feed (page breaks)
      .replace(/\r\n/g, '\n') // Normalize Windows line endings
      .replace(/\r/g, '\n') // Normalize old Mac line endings
      .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ') // Replace special spaces with regular space
      .replace(/[\u2028\u2029]/g, '\n') // Replace line/paragraph separators
      .replace(/\n{4,}/g, '\n\n\n') // Reduce excessive newlines
      .trim();
    
    const lines = cleanedText.split('\n');
    const chapters: Array<{ title: string; content: string }> = [];
    
    let currentTitle = '';
    let currentContent: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if this line is a chapter heading
      if (isChapterHeading(trimmedLine)) {
        // Save previous chapter if exists
        if (currentContent.length > 0) {
          const content = currentContent.join('\n').trim();
          if (content) {
            chapters.push({
              title: currentTitle || `Chapter ${chapters.length + 1}`,
              content
            });
          }
        }
        // Start new chapter with this heading as title
        currentTitle = trimmedLine;
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }
    
    // Don't forget the last chapter
    if (currentContent.length > 0) {
      const content = currentContent.join('\n').trim();
      if (content) {
        chapters.push({
          title: currentTitle || `Chapter ${chapters.length + 1}`,
          content
        });
      }
    }
    
    // If no chapter headings detected, treat entire text as one chapter
    if (chapters.length === 0 && cleanedText) {
      const lines = cleanedText.split('\n');
      let title = 'Chapter 1';
      let content = cleanedText;
      
      // Check if first line could be a title (short, not ending with period)
      if (lines[0] && lines[0].trim().length < 100 && !lines[0].trim().endsWith('.')) {
        title = lines[0].trim();
        content = lines.slice(1).join('\n').trim();
      }
      
      if (content) {
        chapters.push({ title, content });
      }
    }
    
    return chapters;
  };

  const handleBulkTextChange = (text: string) => {
    setBulkText(text);
    setParsedChapters(parseBulkText(text));
  };

  const [importMethod, setImportMethod] = useState<'paste' | 'word' | 'pdf'>('paste');
  const [fileProcessing, setFileProcessing] = useState(false);

  const handleWordUpload = async (file: File) => {
    setFileProcessing(true);
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.default.extractRawText({ arrayBuffer });
      const text = result.value;
      setBulkText(text);
      setParsedChapters(parseBulkText(text));
    } catch (error) {
      console.error('Error reading Word file:', error);
      alert('Failed to read Word document. Please try copy/paste instead.');
    } finally {
      setFileProcessing(false);
    }
  };

  const handlePdfUpload = async (file: File) => {
    setFileProcessing(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map(item => ('str' in item ? (item as { str: string }).str : ''))
          .join(' ');
        fullText += pageText + '\n\n';
      }
      
      setBulkText(fullText);
      setParsedChapters(parseBulkText(fullText));
    } catch (error) {
      console.error('Error reading PDF file:', error);
      alert('Failed to read PDF. Please try copy/paste instead.');
    } finally {
      setFileProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'docx' || extension === 'doc') {
      handleWordUpload(file);
    } else if (extension === 'pdf') {
      handlePdfUpload(file);
    } else {
      alert('Please upload a .docx or .pdf file');
    }
  };

  const handleBulkImport = async () => {
    if (!selectedNovel || parsedChapters.length === 0) return;
    
    setImporting(true);
    try {
      const res = await fetch(`/api/admin/novels/${selectedNovel.id}/chapters/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          chapters: parsedChapters,
          is_premium: bulkPremium,
          is_published: bulkPublished,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        alert(`Successfully imported ${data.imported} chapters!`);
        setShowBulkImport(false);
        setBulkText("");
        setParsedChapters([]);
        await fetchChapters(selectedNovel.id);
        await fetchNovels();
      } else {
        alert(data.error || "Import failed");
      }
    } catch (e) {
      alert("Failed to import chapters");
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  // Chapter management view
  if (selectedNovel) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedNovel(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Novels
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{selectedNovel.title}</h1>
            <p className="text-muted-foreground">Manage chapters for this novel</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {selectedNovel?.chapter_format === 'seasons_episodes' && (
              <Button variant="outline" onClick={() => { setShowSeasonsManager(!showSeasonsManager); setShowBulkImport(false); setShowChapterForm(false); }}>
                <Layers className="w-4 h-4 mr-2" />
                {showSeasonsManager ? 'Hide Seasons' : 'Manage Seasons'}
              </Button>
            )}
            <Button variant="outline" onClick={() => { setShowBulkImport(true); setShowChapterForm(false); setShowSeasonsManager(false); }}>
              <FileUp className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
            <Button onClick={() => { setShowChapterForm(true); setShowBulkImport(false); setShowSeasonsManager(false); setEditingChapter(null); setChapterForm({ title: "", content: "", is_premium: false, is_published: true, scheduled_release_at: "", part_number: 1, chapter_number: 1, season_id: null }); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Chapter
            </Button>
          </div>
        </div>

        {/* Bulk Import Form */}
        {showBulkImport && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Bulk Import Chapters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Import Method Tabs */}
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setImportMethod('paste')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    importMethod === 'paste' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Copy & Paste
                </button>
                <button
                  onClick={() => setImportMethod('word')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    importMethod === 'word' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Word Document
                </button>
                <button
                  onClick={() => setImportMethod('pdf')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    importMethod === 'pdf' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  PDF
                </button>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">Auto-detection:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Chapters are automatically detected by headings like "Chapter 1", "Episode 2", etc.</li>
                  <li>Supports Chapter, Episode, Part, Book, and Volume headings</li>
                  <li>Works with numbers (1, 2, 3) or words (One, Two, Three)</li>
                  <li>No manual separators needed</li>
                </ul>
              </div>

              {/* Copy & Paste Method */}
              {importMethod === 'paste' && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Paste your novel text</label>
                  <textarea
                    value={bulkText}
                    onChange={(e) => handleBulkTextChange(e.target.value)}
                    placeholder="Paste your full novel text here...

Chapter 1: The Beginning

The story starts here...

Chapter 2: The Journey

The adventure continues..."
                    className="w-full h-64 px-3 py-2 rounded-md bg-background border border-input text-sm resize-y"
                  />
                </div>
              )}

              {/* Word Document Upload */}
              {importMethod === 'word' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    {fileProcessing ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                        <p className="text-muted-foreground">Processing Word document...</p>
                      </div>
                    ) : (
                      <>
                        <FileUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="font-medium mb-2">Upload Word Document</p>
                        <p className="text-sm text-muted-foreground mb-4">Supports .docx files</p>
                        <input
                          type="file"
                          accept=".docx,.doc"
                          onChange={handleFileChange}
                          className="hidden"
                          id="word-upload"
                        />
                        <label htmlFor="word-upload">
                          <Button variant="outline" className="cursor-pointer" asChild>
                            <span>Choose File</span>
                          </Button>
                        </label>
                      </>
                    )}
                  </div>
                  {bulkText && (
                    <div>
                      <label className="text-sm font-medium mb-1 block">Extracted Text (you can edit)</label>
                      <textarea
                        value={bulkText}
                        onChange={(e) => handleBulkTextChange(e.target.value)}
                        className="w-full h-40 px-3 py-2 rounded-md bg-background border border-input text-sm resize-y"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* PDF Upload */}
              {importMethod === 'pdf' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    {fileProcessing ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                        <p className="text-muted-foreground">Processing PDF...</p>
                      </div>
                    ) : (
                      <>
                        <FileUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="font-medium mb-2">Upload PDF</p>
                        <p className="text-sm text-muted-foreground mb-4">Text will be extracted from the PDF</p>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="hidden"
                          id="pdf-upload"
                        />
                        <label htmlFor="pdf-upload">
                          <Button variant="outline" className="cursor-pointer" asChild>
                            <span>Choose File</span>
                          </Button>
                        </label>
                      </>
                    )}
                  </div>
                  {bulkText && (
                    <div>
                      <label className="text-sm font-medium mb-1 block">Extracted Text (you can edit)</label>
                      <textarea
                        value={bulkText}
                        onChange={(e) => handleBulkTextChange(e.target.value)}
                        className="w-full h-40 px-3 py-2 rounded-md bg-background border border-input text-sm resize-y"
                      />
                    </div>
                  )}
                </div>
              )}

              {parsedChapters.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="font-medium mb-2 text-green-500">
                    ✓ Detected {parsedChapters.length} chapter{parsedChapters.length !== 1 ? 's' : ''}:
                  </p>
                  <ul className="space-y-1 text-sm max-h-40 overflow-y-auto">
                    {parsedChapters.map((ch, i) => (
                      <li key={i} className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-primary font-mono">{i + 1}.</span>
                        <span className="truncate">{ch.title}</span>
                        <span className="text-xs">({countWords(ch.content)} words)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkPremium}
                    onChange={(e) => setBulkPremium(e.target.checked)}
                    className="rounded border-input"
                  />
                  <span className="text-sm">Premium chapters</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkPublished}
                    onChange={(e) => setBulkPublished(e.target.checked)}
                    className="rounded border-input"
                  />
                  <span className="text-sm">Publish immediately</span>
                </label>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleBulkImport} 
                  disabled={importing || parsedChapters.length === 0}
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import {parsedChapters.length} Chapter{parsedChapters.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => { setShowBulkImport(false); setBulkText(""); setParsedChapters([]); }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seasons Manager */}
        {showSeasonsManager && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Manage Seasons
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Season Form */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <h4 className="font-medium">{editingSeason ? 'Edit Season' : 'Add New Season'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Season Number *</label>
                    <select
                      value={seasonForm.season_number}
                      onChange={(e) => setSeasonForm({ ...seasonForm, season_number: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
                    >
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>Season {num}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Season Title *</label>
                    <input
                      type="text"
                      value={seasonForm.title}
                      onChange={(e) => setSeasonForm({ ...seasonForm, title: e.target.value })}
                      placeholder="e.g., The Beginning"
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Release Date</label>
                    <input
                      type="date"
                      value={seasonForm.release_date}
                      onChange={(e) => setSeasonForm({ ...seasonForm, release_date: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                      style={{ backgroundColor: '#ffffff', color: '#000000', colorScheme: 'light' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Synopsis</label>
                  <textarea
                    value={seasonForm.synopsis}
                    onChange={(e) => setSeasonForm({ ...seasonForm, synopsis: e.target.value })}
                    placeholder="Brief description of this season..."
                    rows={2}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Cover Image URL</label>
                  <input
                    type="url"
                    value={seasonForm.cover_image_url}
                    onChange={(e) => setSeasonForm({ ...seasonForm, cover_image_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveSeason} disabled={savingSeason || !seasonForm.title}>
                    {savingSeason ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {editingSeason ? 'Update Season' : 'Add Season'}
                      </>
                    )}
                  </Button>
                  {editingSeason && (
                    <Button variant="outline" onClick={() => { setEditingSeason(null); setSeasonForm({ season_number: 1, title: "", synopsis: "", cover_image_url: "", release_date: "" }); }}>
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </div>

              {/* Season Selector Dropdown */}
              {seasons.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Quick Select Season to Edit</label>
                  <select
                    value={editingSeason?.id || ""}
                    onChange={(e) => {
                      const seasonId = e.target.value;
                      if (seasonId) {
                        const season = seasons.find(s => s.id.toString() === seasonId);
                        if (season) {
                          setEditingSeason(season);
                          setSeasonForm({
                            season_number: season.season_number,
                            title: season.title,
                            synopsis: season.synopsis || "",
                            cover_image_url: season.cover_image_url || "",
                            release_date: season.release_date || ""
                          });
                        }
                      } else {
                        setEditingSeason(null);
                        setSeasonForm({ season_number: 1, title: "", synopsis: "", cover_image_url: "", release_date: "" });
                      }
                    }}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
                  >
                    <option value="">-- Add New Season --</option>
                    {seasons.map((season) => (
                      <option key={season.id} value={season.id}>
                        Season {season.season_number}: {season.title} ({season.episode_count} episodes)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Existing Seasons List */}
              <div className="space-y-2">
                <h4 className="font-medium">Existing Seasons ({seasons.length})</h4>
                {seasons.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">No seasons yet. Add your first season above.</p>
                ) : (
                  <div className="space-y-2">
                    {seasons.map((season) => (
                      <div key={season.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <span className="font-medium">Season {season.season_number}: {season.title}</span>
                          <span className="text-muted-foreground text-sm ml-2">({season.episode_count} episodes)</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingSeason(season); setSeasonForm({ season_number: season.season_number, title: season.title, synopsis: season.synopsis || "", cover_image_url: season.cover_image_url || "", release_date: season.release_date || "" }); }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteSeason(season.id)} className="text-red-500 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chapter Form Modal */}
        {showChapterForm && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>{editingChapter ? "Edit Chapter" : "Add New Chapter"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Season Assignment */}
              {seasons.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Assign to Season</label>
                  <select
                    value={chapterForm.season_id || ""}
                    onChange={(e) => setChapterForm({ ...chapterForm, season_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
                  >
                    <option value="">No season (standalone)</option>
                    {seasons.map((season) => (
                      <option key={season.id} value={season.id}>
                        Season {season.season_number}: {season.title} ({season.episode_count} episodes)
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {/* Part/Season and Chapter/Episode numbers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    {selectedNovel?.chapter_format === 'seasons_episodes' ? 'Season' : 
                     selectedNovel?.chapter_format === 'parts_chapters' ? 'Part' :
                     selectedNovel?.chapter_format === 'books_chapters' ? 'Book' :
                     selectedNovel?.chapter_format === 'volumes_chapters' ? 'Volume' : 'Part'}
                  </label>
                  <select
                    value={chapterForm.part_number}
                    onChange={(e) => setChapterForm({ ...chapterForm, part_number: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
                  >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {selectedNovel?.chapter_format === 'seasons_episodes' ? `Season ${num}` : 
                         selectedNovel?.chapter_format === 'parts_chapters' ? `Part ${num}` :
                         selectedNovel?.chapter_format === 'books_chapters' ? `Book ${num}` :
                         selectedNovel?.chapter_format === 'volumes_chapters' ? `Volume ${num}` : `Part ${num}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    {selectedNovel?.chapter_format === 'seasons_episodes' ? 'Episode' : 'Chapter'}
                  </label>
                  <select
                    value={chapterForm.chapter_number}
                    onChange={(e) => setChapterForm({ ...chapterForm, chapter_number: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
                  >
                    {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {selectedNovel?.chapter_format === 'seasons_episodes' ? `Episode ${num}` : `Chapter ${num}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Chapter Title *</label>
                <input
                  type="text"
                  value={chapterForm.title}
                  onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
                  placeholder="e.g., The Beginning"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Content</label>
                <RichTextEditor
                  content={chapterForm.content}
                  onChange={(html) => setChapterForm({ ...chapterForm, content: html })}
                  placeholder="Write your episode content here..."
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {countWords(chapterForm.content)} words • Use the toolbar for bold, italics, headings, and more
                </p>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chapterForm.is_premium}
                    onChange={(e) => setChapterForm({ ...chapterForm, is_premium: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Premium (subscribers only)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chapterForm.is_published}
                    onChange={(e) => setChapterForm({ ...chapterForm, is_published: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Published</span>
                </label>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Scheduled Release</label>
                <div className="flex items-center gap-3">
                  <input
                    type="datetime-local"
                    value={chapterForm.scheduled_release_at}
                    onChange={(e) => setChapterForm({ ...chapterForm, scheduled_release_at: e.target.value })}
                    className="flex-1 px-3 py-2 border border-border rounded-lg"
                    style={{ backgroundColor: '#ffffff', color: '#000000', colorScheme: 'light' }}
                  />
                  {chapterForm.scheduled_release_at && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setChapterForm({ ...chapterForm, scheduled_release_at: "" })}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                      Clear
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {chapterForm.scheduled_release_at 
                    ? `Episode will unlock on ${new Date(chapterForm.scheduled_release_at).toLocaleString()}`
                    : "Leave empty for immediate release when published"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveChapter} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Chapter"}
                </Button>
                <Button variant="outline" onClick={() => { setShowChapterForm(false); setEditingChapter(null); }}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seasons Management */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Seasons</CardTitle>
              <Button 
                size="sm" 
                onClick={() => { 
                  setShowSeasonForm(true); 
                  setEditingSeason(null); 
                  setSeasonForm({ season_number: 1, title: "", synopsis: "", cover_image_url: "", release_date: "" }); 
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Season
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Season Form */}
            {showSeasonForm && (
              <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border space-y-4">
                <h4 className="font-medium">{editingSeason ? "Edit Season" : "New Season"}</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Season Title *</label>
                    <input
                      type="text"
                      value={seasonForm.title}
                      onChange={(e) => setSeasonForm({ ...seasonForm, title: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                      placeholder="e.g., The Calm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Release Date</label>
                    <input
                      type="date"
                      value={seasonForm.release_date}
                      onChange={(e) => setSeasonForm({ ...seasonForm, release_date: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                      style={{ backgroundColor: '#ffffff', color: '#000000', colorScheme: 'light' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Synopsis</label>
                  <textarea
                    value={seasonForm.synopsis}
                    onChange={(e) => setSeasonForm({ ...seasonForm, synopsis: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg min-h-[80px]"
                    placeholder="Brief description of this season..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Cover Image URL</label>
                  <input
                    type="text"
                    value={seasonForm.cover_image_url}
                    onChange={(e) => setSeasonForm({ ...seasonForm, cover_image_url: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveSeason} disabled={savingSeason} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    {savingSeason ? "Saving..." : "Save Season"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setShowSeasonForm(false); setEditingSeason(null); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Seasons List */}
            {seasons.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No seasons yet. Add a season to organize episodes.</p>
            ) : (
              <div className="space-y-2">
                {seasons.map((season) => (
                  <div key={season.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">
                      S{season.season_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{season.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {season.episode_count} episode{season.episode_count !== 1 ? 's' : ''}
                        {season.release_date && ` • ${new Date(season.release_date).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditSeason(season)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteSeason(season.id)} 
                        className="text-red-400 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chapters List */}
        <Card className="bg-card/50 border-border/50">
          {chapters.length > 0 && (
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedChapters.size === chapters.length && chapters.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-border accent-primary"
                />
                <span className="text-sm text-muted-foreground">
                  {selectedChapters.size > 0 
                    ? `${selectedChapters.size} selected` 
                    : "Select All"}
                </span>
              </label>
              {selectedChapters.size > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {bulkDeleting ? "Deleting..." : `Delete ${selectedChapters.size} Chapter${selectedChapters.size > 1 ? 's' : ''}`}
                </Button>
              )}
            </div>
          )}
          <CardContent className="p-0">
            {chapters.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No chapters yet. Click "Add Chapter" to create one.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {chapters.map((chapter) => (
                  <div key={chapter.id} className="p-4 flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedChapters.has(chapter.id)}
                      onChange={() => toggleChapterSelection(chapter.id)}
                      className="w-4 h-4 rounded border-border accent-primary"
                    />
                    <div className="w-14 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {selectedNovel?.chapter_format === 'seasons_episodes' 
                        ? `S${chapter.part_number || 1}:E${chapter.chapter_number}`
                        : selectedNovel?.chapter_format === 'parts_chapters'
                        ? `P${chapter.part_number || 1}:C${chapter.chapter_number}`
                        : selectedNovel?.chapter_format === 'books_chapters'
                        ? `B${chapter.part_number || 1}:C${chapter.chapter_number}`
                        : selectedNovel?.chapter_format === 'volumes_chapters'
                        ? `V${chapter.part_number || 1}:C${chapter.chapter_number}`
                        : chapter.chapter_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{chapter.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{chapter.word_count} words</span>
                        {chapter.is_premium === 1 && <span className="text-primary">Premium</span>}
                        <span className={chapter.is_published === 1 ? "text-green-400" : "text-orange-400"}>
                          {chapter.is_published === 1 ? "Published" : "Draft"}
                        </span>
                        {chapter.scheduled_release_at && (
                          <span className="flex items-center gap-1 text-blue-400">
                            <Clock className="w-3 h-3" />
                            {new Date(chapter.scheduled_release_at) > new Date() 
                              ? `Releases ${new Date(chapter.scheduled_release_at).toLocaleDateString()} ${new Date(chapter.scheduled_release_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                              : "Released"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditChapter(chapter)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteChapter(chapter.id)} className="text-red-400 hover:text-red-400 hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Novels list view
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Novels</h1>
          <p className="text-muted-foreground">Add, edit, and manage your novel catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search novels..."
              value={novelSearchQuery}
              onChange={(e) => setNovelSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-muted/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-48 sm:w-64"
            />
          </div>
          <Button onClick={() => { setShowNovelForm(true); setEditingNovel(null); setNovelForm({ title: "", slug: "", author_name: "", cover_image_url: "", synopsis: "", genre: "Romance and First Love", status: "ongoing", is_featured: false, chapter_format: "chapter", tags: [] }); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Novel
          </Button>
        </div>
      </div>

      {/* Novel Form */}
      {showNovelForm && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>{editingNovel ? "Edit Novel" : "Add New Novel"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Title *</label>
                <input
                  type="text"
                  value={novelForm.title}
                  onChange={(e) => setNovelForm({ ...novelForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
                  placeholder="Novel title"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Slug *</label>
                <input
                  type="text"
                  value={novelForm.slug}
                  onChange={(e) => setNovelForm({ ...novelForm, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
                  placeholder="novel-url-slug"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Author Name</label>
                <input
                  type="text"
                  value={novelForm.author_name}
                  onChange={(e) => setNovelForm({ ...novelForm, author_name: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
                  placeholder="Pen name or author display name"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Cover Image</label>
              
              {/* Preview */}
              {novelForm.cover_image_url && (
                <div className="mb-3 flex items-start gap-4">
                  <img 
                    src={novelForm.cover_image_url} 
                    alt="Cover preview" 
                    className="w-20 h-28 object-cover rounded-lg border border-border"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setNovelForm({ ...novelForm, cover_image_url: "" })}
                    className="text-red-400 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              )}
              
              {/* Drag & Drop Zone */}
              <div
                onDrop={handleCoverDrop}
                onDragOver={handleCoverDragOver}
                onDragLeave={handleCoverDragLeave}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  coverDragging 
                    ? "border-primary bg-primary/10" 
                    : "border-border hover:border-primary/50"
                }`}
              >
                {coverUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium mb-1">
                      {coverDragging ? "Drop image here" : "Drag & drop cover image"}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">or</p>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCoverUpload(file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm" 
                      onClick={() => coverInputRef.current?.click()}
                    >
                      Choose File
                    </Button>
                  </>
                )}
              </div>
              
              {/* URL Input as alternative */}
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">Or paste image URL:</p>
                <input
                  type="text"
                  value={novelForm.cover_image_url}
                  onChange={(e) => setNovelForm({ ...novelForm, cover_image_url: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                  placeholder="https://example.com/cover.jpg"
                />
              </div>
              
              {/* Debug status */}
              {uploadStatus && (
                <div className={`mt-2 p-2 rounded text-xs ${
                  uploadStatus.startsWith('Error') || uploadStatus.startsWith('Network') || uploadStatus.includes('failed') 
                    ? 'bg-red-500/20 text-red-400' 
                    : uploadStatus.startsWith('Success') 
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {uploadStatus}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Synopsis</label>
              <textarea
                value={novelForm.synopsis}
                onChange={(e) => setNovelForm({ ...novelForm, synopsis: e.target.value })}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg min-h-[100px]"
                placeholder="Brief description of the novel..."
              />
            </div>
            <div className="grid sm:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Genre</label>
                <select
                  value={novelForm.genre}
                  onChange={(e) => setNovelForm({ ...novelForm, genre: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
                >
                  {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <select
                  value={novelForm.status}
                  onChange={(e) => setNovelForm({ ...novelForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
                >
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="hiatus">Hiatus</option>
                  <option value="coming_soon">Coming Soon</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Chapter Format</label>
                <select
                  value={novelForm.chapter_format}
                  onChange={(e) => setNovelForm({ ...novelForm, chapter_format: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
                >
                  <option value="chapter">Chapters (Chapter 1, Chapter 2...)</option>
                  <option value="parts_chapters">Parts & Chapters (Part 1: Chapter 1...)</option>
                  <option value="seasons_episodes">Seasons & Episodes (Season 1: Episode 1...)</option>
                  <option value="books_chapters">Books & Chapters (Book 1: Chapter 1...)</option>
                  <option value="volumes_chapters">Volumes & Chapters (Vol 1: Chapter 1...)</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={novelForm.is_featured}
                    onChange={(e) => setNovelForm({ ...novelForm, is_featured: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Featured</span>
                </label>
              </div>
            </div>
            
            {/* Story Tags */}
            <div className="mt-4">
              <label className="text-sm font-medium mb-2 block">Story Tags</label>
              <p className="text-xs text-muted-foreground mb-3">Select tags that describe your story (helps readers discover it)</p>
              <div className="space-y-4 max-h-64 overflow-y-auto p-3 bg-muted/30 rounded-lg border border-border/50">
                {Object.entries(storyTags).map(([category, tags]) => (
                  <div key={category}>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{tagCategoryLabels[category as TagCategory]}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            const newTags = novelForm.tags.includes(tag)
                              ? novelForm.tags.filter(t => t !== tag)
                              : [...novelForm.tags, tag];
                            setNovelForm({ ...novelForm, tags: newTags });
                          }}
                          className={`px-2 py-1 text-xs rounded-md transition-all ${
                            novelForm.tags.includes(tag)
                              ? "bg-primary text-primary-foreground"
                              : "bg-background border border-border hover:border-primary/50"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {novelForm.tags.length > 0 && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Selected:</span>
                  {novelForm.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                      {tag}
                      <button 
                        type="button"
                        onClick={() => setNovelForm({ ...novelForm, tags: novelForm.tags.filter(t => t !== tag) })}
                        className="hover:text-primary/70"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleSaveNovel} disabled={saving || coverUploading}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Novel"}
              </Button>
              <Button variant="outline" onClick={() => { setShowNovelForm(false); setEditingNovel(null); }}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Novels List */}
      <Card className="bg-card/50 border-border/50 overflow-hidden">
        {novels.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No novels yet. Click "Add Novel" to create your first one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Novel</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Genre</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Chapters</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {novels
                  .filter((novel) => {
                    if (!novelSearchQuery.trim()) return true;
                    const query = novelSearchQuery.toLowerCase();
                    return (
                      novel.title.toLowerCase().includes(query) ||
                      (novel.author_name && novel.author_name.toLowerCase().includes(query)) ||
                      novel.genre.toLowerCase().includes(query) ||
                      novel.slug.toLowerCase().includes(query)
                    );
                  })
                  .map((novel) => (
                  <tr key={novel.id} className="border-b border-border/30 hover:bg-muted/20">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {novel.cover_image_url ? (
                          <img src={novel.cover_image_url} alt={novel.title} className="w-10 h-14 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{novel.title}</p>
                          <p className="text-xs text-muted-foreground">/{novel.slug}</p>
                        </div>
                        {novel.is_featured === 1 && (
                          <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">Featured</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-sm">{novel.genre}</span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                        novel.status === "ongoing" ? "bg-green-500/20 text-green-400" :
                        novel.status === "completed" ? "bg-blue-500/20 text-blue-400" :
                        novel.status === "hiatus" ? "bg-orange-500/20 text-orange-400" :
                        novel.status === "coming_soon" ? "bg-amber-500/20 text-amber-400" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {novel.status === "coming_soon" ? "Coming Soon" : novel.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedNovel(novel)}>
                        {novel.total_chapters} chapters
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditNovel(novel)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteNovel(novel.id)} className="text-red-400 hover:text-red-400 hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// Component helpers

function StatCard({
  title,
  value,
  change,
  trend,
  icon,
}: {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ReactNode;
}) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <span
            className={`text-xs font-medium flex items-center gap-1 ${
              trend === "up" ? "text-green-400" : "text-red-400"
            }`}
          >
            <TrendingUp className={`w-3 h-3 ${trend === "down" ? "rotate-180" : ""}`} />
            {change}
          </span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  );
}

function PendingNovelCard({ novel }: { novel: PendingNovel }) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <img
            src={novel.authorAvatar}
            alt={novel.author}
            className="w-16 h-16 rounded-xl object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="font-semibold">{novel.title}</h3>
                <p className="text-sm text-muted-foreground">
                  by {novel.author} • {novel.genre}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {getTimeAgo(novel.submittedAt)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {novel.synopsis}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {novel.chapterCount} chapters
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {(novel.wordCount / 1000).toFixed(0)}K words
              </span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="gap-1">
                <CheckCircle className="w-4 h-4" />
                Approve
              </Button>
              <Button size="sm" variant="outline" className="gap-1">
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <Button size="sm" variant="ghost" className="gap-1 text-red-400 hover:text-red-400 hover:bg-red-500/10">
                <XCircle className="w-4 h-4" />
                Reject
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FlaggedCommentCard({ comment }: { comment: FlaggedComment }) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                {comment.reason}
              </span>
              <span className="text-xs text-muted-foreground">
                {comment.reportCount} reports • {getTimeAgo(comment.reportedAt)}
              </span>
            </div>
            <p className="text-sm mb-2 p-3 bg-muted/30 rounded-lg">
              "{comment.content}"
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Posted by <span className="font-medium">{comment.author}</span> on{" "}
              <span className="font-medium">{comment.novelTitle}</span>, Chapter{" "}
              {comment.chapterNumber}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1">
                <Eye className="w-4 h-4" />
                View Context
              </Button>
              <Button size="sm" variant="ghost" className="gap-1 text-red-400 hover:text-red-400 hover:bg-red-500/10">
                <XCircle className="w-4 h-4" />
                Remove Comment
              </Button>
              <Button size="sm" variant="ghost" className="gap-1">
                <CheckCircle className="w-4 h-4" />
                Dismiss Report
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  const tierColors = {
    free: "bg-muted text-muted-foreground",
    monthly: "bg-primary/20 text-primary",
    yearly: "bg-gradient-to-r from-primary to-orange-500 text-white",
  };

  return (
    <tr className="border-b border-border/30 hover:bg-muted/20">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-medium text-sm">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          {user.isWriter && (
            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">
              Writer
            </span>
          )}
        </div>
      </td>
      <td className="p-4">
        <span className={`px-2 py-1 text-xs rounded-full capitalize ${tierColors[user.subscriptionTier]}`}>
          {user.subscriptionTier}
        </span>
      </td>
      <td className="p-4 hidden md:table-cell">
        <span className="text-sm text-muted-foreground">
          {new Date(user.joinedAt).toLocaleDateString()}
        </span>
      </td>
      <td className="p-4 hidden lg:table-cell">
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {getTimeAgo(user.lastActive)}
        </span>
      </td>
      <td className="p-4 hidden lg:table-cell">
        {user.isWriter ? (
          <span className="text-sm text-muted-foreground">
            {user.novelsPublished} novels • {formatNumber(user.totalReads)} reads
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Reader only</span>
        )}
      </td>
      <td className="p-4 text-right">
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  );
}

// Early Access Emails Tab
function EmailsTab() {
  const [emails, setEmails] = useState<{ id: number; email: string; source: string; created_at: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const response = await fetch("/api/admin/early-access", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails || []);
      }
    } catch (error) {
      console.error("Failed to fetch emails:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this email?")) return;
    
    try {
      const response = await fetch(`/api/admin/early-access/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setEmails(emails.filter(e => e.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete email:", error);
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Email,Source,Signed Up At\n"
      + emails.map(e => `${e.email},${e.source},${e.created_at}`).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `early-access-emails-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Early Access Emails</h1>
          <p className="text-muted-foreground">
            {emails.length} {emails.length === 1 ? "person has" : "people have"} signed up for early access
          </p>
        </div>
        {emails.length > 0 && (
          <Button onClick={handleExport} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-0">
          {emails.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No early access signups yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Share your app to start collecting signups
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Email</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground hidden sm:table-cell">Source</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">Signed Up</th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map((email) => (
                    <tr key={email.id} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="p-4">
                        <span className="font-medium">{email.email}</span>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full capitalize">
                          {email.source}
                        </span>
                      </td>
                      <td className="p-4 hidden md:table-cell text-muted-foreground text-sm">
                        {new Date(email.created_at).toLocaleDateString()} at{" "}
                        {new Date(email.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(email.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Writer Waitlist Tab
interface WaitlistEntry {
  id: number;
  email: string;
  created_at: string;
}

function WriterWaitlistTab() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const fetchWaitlist = async () => {
    try {
      const response = await fetch("/api/admin/writer-waitlist", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error("Failed to fetch writer waitlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this email from the waitlist?")) return;
    try {
      const response = await fetch(`/api/admin/writer-waitlist/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setEntries(entries.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete entry:", error);
    }
  };

  const handleExport = () => {
    const csv = ["Email,Signed Up"];
    entries.forEach((entry) => {
      csv.push(`${entry.email},${new Date(entry.created_at).toISOString()}`);
    });
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `writer-waitlist-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Writer Waitlist</h2>
          <p className="text-muted-foreground text-sm">
            {entries.length} writer{entries.length !== 1 ? "s" : ""} waiting for submissions to open
          </p>
        </div>
        {entries.length > 0 && (
          <Button onClick={handleExport} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="p-8 text-center">
              <PenTool className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No writers on the waitlist yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Writers can sign up at the "Write for Inkseries" page
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Email</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">Signed Up</th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="p-4">
                        <span className="font-medium">{entry.email}</span>
                      </td>
                      <td className="p-4 hidden md:table-cell text-muted-foreground text-sm">
                        {new Date(entry.created_at).toLocaleDateString()} at{" "}
                        {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Competition Submissions Tab
interface Submission {
  id: number;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  school_name: string;
  class_year: string;
  age: number;
  story_title: string;
  genre: string;
  synopsis: string;
  story_content: string;
  word_count: number;
  is_original_work: number;
  referral_source: string | null;
  has_written_before: number;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface SubmissionScore {
  originality_score: number;
  plot_structure_score: number;
  character_development_score: number;
  writing_quality_score: number;
  voice_style_score: number;
  theme_impact_score: number;
  judge_notes: string;
}

const SCORE_CRITERIA = [
  { key: "originality_score", label: "Originality & Creativity", description: "Fresh ideas, unique perspectives, avoids clichés" },
  { key: "plot_structure_score", label: "Plot & Structure", description: "Clear progression, pacing, satisfying resolution" },
  { key: "character_development_score", label: "Character Development", description: "Believable characters, clear motivations, emotional depth" },
  { key: "writing_quality_score", label: "Writing Quality", description: "Grammar, vocabulary, sentence flow, show vs. tell" },
  { key: "voice_style_score", label: "Voice & Style", description: "Distinctive narrative voice, consistent tone" },
  { key: "theme_impact_score", label: "Theme & Impact", description: "Clear message, emotional resonance, memorable ending" },
] as const;

function SubmissionsTab() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [scores, setScores] = useState<SubmissionScore>({
    originality_score: 0,
    plot_structure_score: 0,
    character_development_score: 0,
    writing_quality_score: 0,
    voice_style_score: 0,
    theme_impact_score: 0,
    judge_notes: "",
  });
  const [scoreStats, setScoreStats] = useState<{ averageScore: number; judgeCount: number } | null>(null);
  const [savingScore, setSavingScore] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch("/api/admin/competition/submissions", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchScores = async (submissionId: number) => {
    try {
      const response = await fetch(`/api/admin/competition/submissions/${submissionId}/scores`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.myScore) {
          setScores({
            originality_score: data.myScore.originality_score || 0,
            plot_structure_score: data.myScore.plot_structure_score || 0,
            character_development_score: data.myScore.character_development_score || 0,
            writing_quality_score: data.myScore.writing_quality_score || 0,
            voice_style_score: data.myScore.voice_style_score || 0,
            theme_impact_score: data.myScore.theme_impact_score || 0,
            judge_notes: data.myScore.judge_notes || "",
          });
        } else {
          setScores({
            originality_score: 0, plot_structure_score: 0, character_development_score: 0,
            writing_quality_score: 0, voice_style_score: 0, theme_impact_score: 0, judge_notes: "",
          });
        }
        setScoreStats({ averageScore: data.averageScore, judgeCount: data.judgeCount });
      }
    } catch (error) {
      console.error("Failed to fetch scores:", error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch("/api/admin/competition/leaderboard", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    }
  };

  const handleSaveScore = async () => {
    if (!selectedSubmission) return;
    setSavingScore(true);
    try {
      const response = await fetch(`/api/admin/competition/submissions/${selectedSubmission.id}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(scores),
      });
      if (response.ok) {
        await fetchScores(selectedSubmission.id);
      }
    } catch (error) {
      console.error("Failed to save score:", error);
    } finally {
      setSavingScore(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/competition/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, admin_notes: adminNotes }),
      });
      if (response.ok) {
        await fetchSubmissions();
        if (selectedSubmission?.id === id) {
          setSelectedSubmission({ ...selectedSubmission, status, admin_notes: adminNotes });
        }
      }
    } catch (error) {
      console.error("Failed to update submission:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Email,Phone,School,Class,Age,Story Title,Genre,Word Count,Status,Submitted At\n"
      + submissions.map(s => 
        `"${s.full_name}","${s.email}","${s.phone}","${s.school_name}","${s.class_year}",${s.age},"${s.story_title}","${s.genre}",${s.word_count},"${s.status}","${s.created_at}"`
      ).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `competition-submissions-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSubmissions = statusFilter === "all" 
    ? submissions 
    : submissions.filter(s => s.status === statusFilter);

  const statusCounts = {
    all: submissions.length,
    pending: submissions.filter(s => s.status === "pending").length,
    reviewing: submissions.filter(s => s.status === "reviewing").length,
    shortlisted: submissions.filter(s => s.status === "shortlisted").length,
    winner: submissions.filter(s => s.status === "winner").length,
    rejected: submissions.filter(s => s.status === "rejected").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Detail view
  if (selectedSubmission) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedSubmission(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Submissions
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedSubmission.story_title}</CardTitle>
                    <p className="text-muted-foreground mt-1">
                      by {selectedSubmission.full_name} • {selectedSubmission.genre}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-sm rounded-full capitalize ${
                    selectedSubmission.status === "pending" ? "bg-orange-500/20 text-orange-400" :
                    selectedSubmission.status === "reviewing" ? "bg-blue-500/20 text-blue-400" :
                    selectedSubmission.status === "shortlisted" ? "bg-purple-500/20 text-purple-400" :
                    selectedSubmission.status === "winner" ? "bg-green-500/20 text-green-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                    {selectedSubmission.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Synopsis</h4>
                  <p className="text-muted-foreground">{selectedSubmission.synopsis}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Story Content ({selectedSubmission.word_count} words)</h4>
                  <div className="bg-muted/30 rounded-lg p-4 max-h-[500px] overflow-y-auto whitespace-pre-wrap text-sm">
                    {selectedSubmission.story_content}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Participant Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{selectedSubmission.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{selectedSubmission.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{selectedSubmission.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">School</span>
                  <span className="font-medium">{selectedSubmission.school_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Class</span>
                  <span className="font-medium">{selectedSubmission.class_year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age</span>
                  <span className="font-medium">{selectedSubmission.age} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span className="font-medium">
                    {new Date(selectedSubmission.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Written Before</span>
                  <span className="font-medium">{selectedSubmission.has_written_before ? "Yes" : "No"}</span>
                </div>
                {selectedSubmission.referral_source && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Referral</span>
                    <span className="font-medium">{selectedSubmission.referral_source}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Update Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {["pending", "reviewing", "shortlisted", "winner", "rejected"].map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={selectedSubmission.status === status ? "default" : "outline"}
                      onClick={() => handleUpdateStatus(selectedSubmission.id, status)}
                      disabled={saving}
                      className="capitalize"
                    >
                      {status}
                    </Button>
                  ))}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Admin Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Internal notes about this submission..."
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm min-h-[80px]"
                  />
                </div>
                <Button 
                  onClick={() => handleUpdateStatus(selectedSubmission.id, selectedSubmission.status)} 
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? "Saving..." : "Save Notes"}
                </Button>
              </CardContent>
            </Card>

            {/* Judging Scorecard */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Judging Scorecard
                </CardTitle>
                {scoreStats && scoreStats.judgeCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Avg: {scoreStats.averageScore}/60 ({scoreStats.judgeCount} judge{scoreStats.judgeCount > 1 ? "s" : ""})
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {SCORE_CRITERIA.map((criterion) => (
                  <div key={criterion.key}>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-medium">{criterion.label}</label>
                      <span className="text-sm font-bold text-primary">
                        {scores[criterion.key as keyof SubmissionScore] as number}/10
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{criterion.description}</p>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={scores[criterion.key as keyof SubmissionScore] as number}
                      onChange={(e) => setScores({
                        ...scores,
                        [criterion.key]: parseInt(e.target.value)
                      })}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                ))}
                
                <div className="pt-2 border-t border-border/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Total Score</span>
                    <span className="text-xl font-bold text-primary">
                      {Object.entries(scores)
                        .filter(([key]) => key !== "judge_notes")
                        .reduce((sum, [, val]) => sum + (typeof val === "number" ? val : 0), 0)}/60
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Judge Notes</label>
                  <textarea
                    value={scores.judge_notes}
                    onChange={(e) => setScores({ ...scores, judge_notes: e.target.value })}
                    placeholder="Your notes on this submission..."
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm min-h-[80px]"
                  />
                </div>

                <Button 
                  onClick={handleSaveScore} 
                  disabled={savingScore}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  {savingScore ? "Saving Score..." : "Save Score"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Competition Submissions
          </h1>
          <p className="text-muted-foreground">
            {submissions.length} {submissions.length === 1 ? "submission" : "submissions"} received
          </p>
        </div>
        {submissions.length > 0 && (
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                setShowLeaderboard(!showLeaderboard);
                if (!showLeaderboard) fetchLeaderboard();
              }} 
              variant={showLeaderboard ? "default" : "outline"}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </Button>
            <Button onClick={handleExport} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        )}
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "reviewing", "shortlisted", "winner", "rejected"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              statusFilter === status
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {status} ({statusCounts[status]})
          </button>
        ))}
      </div>

      {/* Leaderboard View */}
      {showLeaderboard && (
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Judging Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No scores submitted yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="p-3 text-left text-sm font-medium text-muted-foreground">Rank</th>
                      <th className="p-3 text-left text-sm font-medium text-muted-foreground">Story</th>
                      <th className="p-3 text-left text-sm font-medium text-muted-foreground">Author</th>
                      <th className="p-3 text-left text-sm font-medium text-muted-foreground">Genre</th>
                      <th className="p-3 text-left text-sm font-medium text-muted-foreground">School</th>
                      <th className="p-3 text-center text-sm font-medium text-muted-foreground">Judges</th>
                      <th className="p-3 text-center text-sm font-medium text-muted-foreground">Avg Score</th>
                      <th className="p-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => (
                      <tr key={entry.id} className="border-b border-border/30 hover:bg-muted/30">
                        <td className="p-3">
                          {index < 3 ? (
                            <span className={`text-lg font-bold ${
                              index === 0 ? "text-yellow-500" : 
                              index === 1 ? "text-gray-400" : "text-amber-700"
                            }`}>
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">#{index + 1}</span>
                          )}
                        </td>
                        <td className="p-3 font-medium">{entry.story_title}</td>
                        <td className="p-3 text-muted-foreground">{entry.full_name}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs">
                            {entry.genre}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{entry.school_name}</td>
                        <td className="p-3 text-center text-muted-foreground">{entry.judge_count || 0}</td>
                        <td className="p-3 text-center">
                          {entry.avg_score ? (
                            <span className="font-bold text-primary">
                              {Number(entry.avg_score).toFixed(1)}/60
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs capitalize ${
                            entry.status === "winner" ? "bg-yellow-500/20 text-yellow-500" :
                            entry.status === "shortlisted" ? "bg-green-500/20 text-green-500" :
                            entry.status === "rejected" ? "bg-red-500/20 text-red-500" :
                            entry.status === "reviewing" ? "bg-blue-500/20 text-blue-500" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {entry.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-0">
          {filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center">
              <Trophy className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {submissions.length === 0 
                  ? "No competition submissions yet" 
                  : `No ${statusFilter} submissions`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Participant</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Story</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">School</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground hidden lg:table-cell">Words</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{submission.full_name}</p>
                          <p className="text-xs text-muted-foreground">{submission.email}</p>
                          <p className="text-xs text-muted-foreground">{submission.class_year} • {submission.age} yrs</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{submission.story_title}</p>
                        <p className="text-xs text-muted-foreground">{submission.genre}</p>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">{submission.school_name}</span>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <span className="text-sm">{submission.word_count.toLocaleString()}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                          submission.status === "pending" ? "bg-orange-500/20 text-orange-400" :
                          submission.status === "reviewing" ? "bg-blue-500/20 text-blue-400" :
                          submission.status === "shortlisted" ? "bg-purple-500/20 text-purple-400" :
                          submission.status === "winner" ? "bg-green-500/20 text-green-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {submission.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setAdminNotes(submission.admin_notes || "");
                            fetchScores(submission.id);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PollsTab() {
  const [polls, setPolls] = useState<any[]>([]);
  const [novels, setNovels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingPoll, setEditingPoll] = useState<any>(null);
  
  const [form, setForm] = useState({
    novel_id: "",
    question: "",
    options: ["", ""],
    expires_at: ""
  });

  useEffect(() => {
    fetchPolls();
    fetchNovels();
  }, []);

  const fetchPolls = async () => {
    try {
      const res = await fetch("/api/admin/polls", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPolls(data.polls || []);
      }
    } catch (err) {
      console.error("Failed to fetch polls:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNovels = async () => {
    try {
      const res = await fetch("/api/novels", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNovels(data.novels || []);
      }
    } catch (err) {
      console.error("Failed to fetch novels:", err);
    }
  };

  const handleAddOption = () => {
    if (form.options.length < 6) {
      setForm({ ...form, options: [...form.options, ""] });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (form.options.length > 2) {
      setForm({ ...form, options: form.options.filter((_, i) => i !== index) });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...form.options];
    newOptions[index] = value;
    setForm({ ...form, options: newOptions });
  };

  const handleSubmit = async () => {
    if (!form.question.trim() || form.options.filter(o => o.trim()).length < 2) {
      alert("Please provide a question and at least 2 options");
      return;
    }

    setCreating(true);
    try {
      const url = editingPoll ? `/api/admin/polls/${editingPoll.id}` : "/api/admin/polls";
      const method = editingPoll ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          novel_id: form.novel_id || null,
          question: form.question.trim(),
          options: form.options.filter(o => o.trim()),
          expires_at: form.expires_at || null
        })
      });

      if (res.ok) {
        setShowCreate(false);
        setEditingPoll(null);
        setForm({ novel_id: "", question: "", options: ["", ""], expires_at: "" });
        fetchPolls();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save poll");
      }
    } catch (err) {
      console.error("Failed to save poll:", err);
      alert("Failed to save poll");
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (poll: any) => {
    setEditingPoll(poll);
    setForm({
      novel_id: poll.novel_id?.toString() || "",
      question: poll.question,
      options: poll.options?.map((o: any) => o.option_text) || ["", ""],
      expires_at: poll.expires_at ? poll.expires_at.slice(0, 16) : ""
    });
    setShowCreate(true);
  };

  const handleDelete = async (pollId: number) => {
    if (!confirm("Delete this poll? All votes will be lost.")) return;

    try {
      const res = await fetch(`/api/admin/polls/${pollId}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (res.ok) {
        fetchPolls();
      } else {
        alert("Failed to delete poll");
      }
    } catch (err) {
      console.error("Failed to delete poll:", err);
    }
  };

  const handleToggleActive = async (poll: any) => {
    try {
      const res = await fetch(`/api/admin/polls/${poll.id}/toggle`, {
        method: "POST",
        credentials: "include"
      });

      if (res.ok) {
        fetchPolls();
      }
    } catch (err) {
      console.error("Failed to toggle poll:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (showCreate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setShowCreate(false); setEditingPoll(null); }}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            {editingPoll ? "Edit Poll" : "Create New Poll"}
          </h1>
        </div>

        <Card className="border-border">
          <CardContent className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Link to Story (Optional)</label>
              <select
                value={form.novel_id}
                onChange={(e) => setForm({ ...form, novel_id: e.target.value })}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
              >
                <option value="">General Poll (no story)</option>
                {novels.map((novel) => (
                  <option key={novel.id} value={novel.id}>{novel.title}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Story-specific polls appear on the Polls page under that story
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Question *</label>
              <input
                type="text"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="e.g., Who should Amara end up with?"
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Options *</label>
              <div className="space-y-2">
                {form.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg"
                    />
                    {form.options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {form.options.length < 6 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </Button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Expires At (Optional)</label>
              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
                style={{ colorScheme: "dark" }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for no expiration
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={creating}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {creating ? "Saving..." : editingPoll ? "Update Poll" : "Create Poll"}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowCreate(false); setEditingPoll(null); }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Vote className="w-6 h-6 text-primary" />
            Story Polls
          </h1>
          <p className="text-muted-foreground">
            {polls.length} {polls.length === 1 ? "poll" : "polls"} created
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Poll
        </Button>
      </div>

      {polls.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-12 text-center">
            <Vote className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Polls Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first poll to engage readers with story decisions
            </p>
            <Button onClick={() => setShowCreate(true)} className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              Create First Poll
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {polls.map((poll) => {
            const totalVotes = poll.options?.reduce((sum: number, o: any) => sum + (o.vote_count || 0), 0) || 0;
            const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();
            
            return (
              <Card key={poll.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {poll.novel_title && (
                          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                            {poll.novel_title}
                          </span>
                        )}
                        {!poll.is_active && (
                          <span className="text-xs bg-zinc-500/20 text-zinc-400 px-2 py-0.5 rounded">
                            Inactive
                          </span>
                        )}
                        {isExpired && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                            Expired
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-3">{poll.question}</h3>
                      
                      <div className="space-y-2">
                        {poll.options?.map((option: any) => {
                          const percentage = totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0;
                          return (
                            <div key={option.id} className="relative">
                              <div 
                                className="absolute inset-0 bg-amber-500/20 rounded"
                                style={{ width: `${percentage}%` }}
                              />
                              <div className="relative flex justify-between px-3 py-2 text-sm">
                                <span>{option.option_text}</span>
                                <span className="text-muted-foreground">
                                  {option.vote_count || 0} ({percentage}%)
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-3">
                        {totalVotes} total {totalVotes === 1 ? "vote" : "votes"}
                        {poll.expires_at && (
                          <span className="ml-2">
                            • {isExpired ? "Ended" : "Ends"} {new Date(poll.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div className="flex lg:flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(poll)}
                        className={poll.is_active ? "text-amber-400" : "text-zinc-400"}
                      >
                        {poll.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(poll)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(poll.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Events Tab
function EventsTab() {
  const [events, setEvents] = useState<any[]>([]);
  const [novels, setNovels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const eventTypes = [
    { value: "ama", label: "Author AMA" },
    { value: "live_reading", label: "Live Reading" },
    { value: "watch_party", label: "Watch Party" },
    { value: "character_reveal", label: "Character Reveal" },
    { value: "premiere", label: "Episode Premiere" },
    { value: "workshop", label: "Writing Workshop" },
  ];

  const [form, setForm] = useState({
    title: "",
    description: "",
    event_type: "ama",
    cover_image_url: "",
    novel_id: "",
    starts_at: "",
    ends_at: "",
    external_link: "",
    is_published: true,
    is_live: false,
  });

  useEffect(() => {
    fetchEvents();
    fetchNovels();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/admin/events", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (e) {
      console.error("Failed to fetch events", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchNovels = async () => {
    try {
      const res = await fetch("/api/admin/novels", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNovels(data.novels || []);
      }
    } catch (e) {
      console.error("Failed to fetch novels", e);
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      event_type: "ama",
      cover_image_url: "",
      novel_id: "",
      starts_at: "",
      ends_at: "",
      external_link: "",
      is_published: true,
      is_live: false,
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  const handleEdit = (event: any) => {
    setForm({
      title: event.title || "",
      description: event.description || "",
      event_type: event.event_type || "ama",
      cover_image_url: event.cover_image_url || "",
      novel_id: event.novel_id?.toString() || "",
      starts_at: event.starts_at ? new Date(event.starts_at).toISOString().slice(0, 16) : "",
      ends_at: event.ends_at ? new Date(event.ends_at).toISOString().slice(0, 16) : "",
      external_link: event.external_link || "",
      is_published: !!event.is_published,
      is_live: !!event.is_live,
    });
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.event_type || !form.starts_at) {
      alert("Title, event type, and start time are required");
      return;
    }

    setSaving(true);
    try {
      const url = editingEvent 
        ? `/api/admin/events/${editingEvent.id}` 
        : "/api/admin/events";
      const method = editingEvent ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          novel_id: form.novel_id ? parseInt(form.novel_id) : null,
        }),
      });

      if (res.ok) {
        await fetchEvents();
        resetForm();
      } else {
        alert("Failed to save event");
      }
    } catch (e) {
      console.error("Error saving event", e);
      alert("Error saving event");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (eventId: number) => {
    if (!confirm("Delete this event? This will also remove all reminders.")) return;
    
    setDeleting(eventId);
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== eventId));
      }
    } catch (e) {
      console.error("Error deleting event", e);
    } finally {
      setDeleting(null);
    }
  };

  const toggleLive = async (event: any) => {
    try {
      await fetch(`/api/admin/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...event, is_live: !event.is_live }),
      });
      await fetchEvents();
    } catch (e) {
      console.error("Error toggling live status", e);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-NG", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getTypeLabel = (type: string) => {
    return eventTypes.find(t => t.value === type)?.label || type;
  };

  const upcomingCount = events.filter(e => new Date(e.starts_at) > new Date()).length;
  const liveCount = events.filter(e => e.is_live).length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{events.length}</div>
            <div className="text-sm text-muted-foreground">Total Events</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{upcomingCount}</div>
            <div className="text-sm text-muted-foreground">Upcoming</div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-400">{liveCount}</div>
            <div className="text-sm text-muted-foreground">Live Now</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Manage Events</h2>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Event
        </Button>
      </div>

      {/* Event Form */}
      {showForm && (
        <Card className="bg-card/50 border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingEvent ? "Edit Event" : "Create New Event"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border"
                  placeholder="Episode 20 Watch Party"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Event Type *</label>
                <select
                  value={form.event_type}
                  onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border"
                >
                  {eventTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border min-h-[80px]"
                placeholder="Join us for a live watch party..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Start Time *</label>
                <input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">End Time</label>
                <input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Related Story</label>
                <select
                  value={form.novel_id}
                  onChange={e => setForm(f => ({ ...f, novel_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border"
                >
                  <option value="">None</option>
                  {novels.map(n => (
                    <option key={n.id} value={n.id}>{n.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">External Link</label>
                <input
                  type="url"
                  value={form.external_link}
                  onChange={e => setForm(f => ({ ...f, external_link: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border"
                  placeholder="https://youtube.com/live/..."
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Cover Image URL</label>
              <input
                type="url"
                value={form.cover_image_url}
                onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border"
                placeholder="https://..."
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">Published (visible to users)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_live}
                  onChange={e => setForm(f => ({ ...f, is_live: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-red-400">Live Now</span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSubmit} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingEvent ? "Save Changes" : "Create Event"}
              </Button>
              <Button variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : events.length === 0 ? (
        <Card className="bg-card/30 border-border/50">
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No events created yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map(event => {
            const isPast = new Date(event.starts_at) < new Date();
            return (
              <Card 
                key={event.id} 
                className={`bg-card/50 border-border/50 ${event.is_live ? 'border-red-500/50 bg-red-500/5' : ''} ${isPast && !event.is_live ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                          {getTypeLabel(event.event_type)}
                        </span>
                        {event.is_live && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-500 text-white animate-pulse">
                            LIVE
                          </span>
                        )}
                        {!event.is_published && (
                          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                            Draft
                          </span>
                        )}
                        {event.reminder_count > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Bell className="w-3 h-3" />
                            {event.reminder_count} reminder{event.reminder_count !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg truncate">{event.title}</h3>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatDate(event.starts_at)}
                        {event.novel_title && (
                          <span className="ml-2">• {event.novel_title}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant={event.is_live ? "destructive" : "outline"}
                        onClick={() => toggleLive(event)}
                        className="gap-1"
                      >
                        {event.is_live ? (
                          <>
                            <Eye className="w-3 h-3" />
                            End Live
                          </>
                        ) : (
                          <>
                            <Radio className="w-3 h-3" />
                            Go Live
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(event)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(event.id)}
                        disabled={deleting === event.id}
                        className="text-red-400 hover:text-red-300"
                      >
                        {deleting === event.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CancellationsTab() {
  const [loading, setLoading] = useState(true);
  const [cancellations, setCancellations] = useState<{
    id: number;
    user_id: string;
    plan_type: string;
    amount: number;
    cancellation_reason: string | null;
    access_expires_at: string;
    save_offer_shown: number;
    save_offer_accepted: number;
    created_at: string;
    display_name: string | null;
    email: string | null;
  }[]>([]);
  const [stats, setStats] = useState({
    totalCancellations: 0,
    saveOffersAccepted: 0,
    totalLostRevenue: 0,
    saveRate: 0,
  });

  useEffect(() => {
    fetchCancellations();
  }, []);

  const fetchCancellations = async () => {
    try {
      const res = await fetch("/api/admin/cancellations", { credentials: "include" });
      const data = await res.json();
      setCancellations(data.cancellations || []);
      setStats(data.stats || { totalCancellations: 0, saveOffersAccepted: 0, totalLostRevenue: 0, saveRate: 0 });
    } catch (error) {
      console.error("Failed to fetch cancellations:", error);
    } finally {
      setLoading(false);
    }
  };

  const planLabels: Record<string, string> = {
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "3-Month",
    biannual: "6-Month",
    yearly: "Yearly",
    family_weekly: "Family Weekly",
    family_monthly: "Family Monthly",
    family_quarterly: "Family 3-Month",
    family_biannual: "Family 6-Month",
    family_annual: "Family Yearly",
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Subscription Cancellations</h2>
        <p className="text-muted-foreground">Track cancelled subscriptions and retention efforts (last 30 days)</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCancellations}</p>
                <p className="text-xs text-muted-foreground">Total Cancellations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.saveOffersAccepted}</p>
                <p className="text-xs text-muted-foreground">Save Offers Accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.saveRate}%</p>
                <p className="text-xs text-muted-foreground">Save Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <DollarSign className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">₦{stats.totalLostRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Lost Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancellations List */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Recent Cancellations</CardTitle>
        </CardHeader>
        <CardContent>
          {cancellations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No cancellations yet</p>
              <p className="text-sm">This is good news!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cancellations.map((cancellation) => (
                <div
                  key={cancellation.id}
                  className="p-4 rounded-xl bg-muted/30 border border-border/30"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                        <span className="text-sm font-medium text-red-400">
                          {(cancellation.display_name || "U")[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {cancellation.display_name || "Unknown User"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {cancellation.email || "No email"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                            {planLabels[cancellation.plan_type] || cancellation.plan_type}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ₦{cancellation.amount.toLocaleString()}
                          </span>
                          {cancellation.save_offer_accepted ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                              Accepted Save Offer
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col lg:items-end gap-1 text-sm">
                      <p className="text-muted-foreground">
                        Cancelled: {formatDateTime(cancellation.created_at)}
                      </p>
                      <p className={isExpired(cancellation.access_expires_at) ? "text-red-400" : "text-amber-400"}>
                        Access {isExpired(cancellation.access_expires_at) ? "expired" : "expires"}: {formatDate(cancellation.access_expires_at)}
                      </p>
                    </div>
                  </div>

                  {cancellation.cancellation_reason && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Reason:</span>{" "}
                        {cancellation.cancellation_reason}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RefundsTab() {
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState<{
    id: number;
    user_id: string;
    subscription_id: number | null;
    payment_reference: string | null;
    amount: number;
    currency: string;
    refund_type: string;
    refund_reason: string | null;
    status: string;
    flutterwave_refund_id: string | null;
    processed_at: string | null;
    created_at: string;
    display_name: string | null;
    email: string | null;
  }[]>([]);
  const [stats, setStats] = useState({
    totalRefunds: 0,
    pendingRefunds: 0,
    completedRefunds: 0,
    totalRefundedAmount: 0,
  });
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      const res = await fetch("/api/admin/refunds", { credentials: "include" });
      const data = await res.json();
      setRefunds(data.refunds || []);
      setStats(data.stats || { totalRefunds: 0, pendingRefunds: 0, completedRefunds: 0, totalRefundedAmount: 0 });
    } catch (error) {
      console.error("Failed to fetch refunds:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (refundId: number, newStatus: string) => {
    setProcessingId(refundId);
    try {
      const res = await fetch(`/api/admin/refunds/${refundId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchRefunds();
      }
    } catch (error) {
      console.error("Failed to update refund status:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const refundTypeLabels: Record<string, string> = {
    "48_hour_satisfaction": "48-Hour Guarantee",
    "duplicate_charge": "Duplicate Charge",
    "post_cancellation": "Post-Cancellation",
    "manual": "Manual Refund",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-400",
    processing: "bg-blue-500/20 text-blue-400",
    completed: "bg-green-500/20 text-green-400",
    failed: "bg-red-500/20 text-red-400",
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Refund Management</h2>
        <p className="text-muted-foreground">Track and manage refund requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <RotateCcw className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalRefunds}</p>
                <p className="text-xs text-muted-foreground">Total Refunds</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingRefunds}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedRefunds}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <DollarSign className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">₦{stats.totalRefundedAmount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Refunded</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refunds List */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">All Refund Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {refunds.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RotateCcw className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No refund requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {refunds.map((refund) => (
                <div
                  key={refund.id}
                  className="p-4 rounded-xl bg-muted/30 border border-border/30"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                        <span className="text-sm font-medium text-blue-400">
                          {(refund.display_name || "U")[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {refund.display_name || "Unknown User"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {refund.email || "No email"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                            {refundTypeLabels[refund.refund_type] || refund.refund_type}
                          </span>
                          <span className="text-sm font-medium">
                            ₦{refund.amount.toLocaleString()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[refund.status] || "bg-muted text-muted-foreground"}`}>
                            {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                          </span>
                        </div>
                        {refund.payment_reference && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Ref: {refund.payment_reference}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col lg:items-end gap-2">
                      <p className="text-sm text-muted-foreground">
                        Requested: {formatDateTime(refund.created_at)}
                      </p>
                      {refund.processed_at && (
                        <p className="text-sm text-green-400">
                          Processed: {formatDateTime(refund.processed_at)}
                        </p>
                      )}
                      
                      {refund.status === "pending" && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(refund.id, "completed")}
                            disabled={processingId === refund.id}
                            className="text-green-400 border-green-500/30 hover:bg-green-500/20"
                          >
                            {processingId === refund.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(refund.id, "failed")}
                            disabled={processingId === refund.id}
                            className="text-red-400 border-red-500/30 hover:bg-red-500/20"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {refund.refund_reason && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Reason:</span>{" "}
                        {refund.refund_reason}
                      </p>
                    </div>
                  )}

                  {refund.flutterwave_refund_id && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Flutterwave ID: {refund.flutterwave_refund_id}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PlanChangesTab() {
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState<{
    id: number;
    user_id: string;
    current_plan: string;
    new_plan: string;
    change_type: string;
    effective_date: string;
    is_processed: number;
    created_at: string;
    display_name: string | null;
    email: string | null;
  }[]>([]);
  const [stats, setStats] = useState({
    totalChanges: 0,
    pendingChanges: 0,
    processedChanges: 0,
    pendingUpgrades: 0,
    pendingDowngrades: 0,
    pendingCategorySwitches: 0,
  });
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    fetchChanges();
  }, []);

  const fetchChanges = async () => {
    try {
      const res = await fetch("/api/admin/plan-changes", { credentials: "include" });
      const data = await res.json();
      setChanges(data.changes || []);
      setStats(data.stats || {
        totalChanges: 0,
        pendingChanges: 0,
        processedChanges: 0,
        pendingUpgrades: 0,
        pendingDowngrades: 0,
        pendingCategorySwitches: 0,
      });
    } catch (error) {
      console.error("Failed to fetch plan changes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelChange = async (changeId: number) => {
    if (!confirm("Cancel this scheduled plan change?")) return;
    
    setCancellingId(changeId);
    try {
      const res = await fetch(`/api/admin/plan-changes/${changeId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        fetchChanges();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to cancel change");
      }
    } catch (error) {
      console.error("Failed to cancel change:", error);
    } finally {
      setCancellingId(null);
    }
  };

  const planLabels: Record<string, string> = {
    weekly: "Weekly ₦500",
    monthly: "Monthly ₦1,500",
    quarterly: "3-Month ₦4,000",
    biannual: "6-Month ₦7,000",
    yearly: "Yearly ₦14,400",
    family_weekly: "Family Weekly ₦1,500",
    family_monthly: "Family Monthly ₦4,500",
    family_quarterly: "Family 3-Month ₦11,000",
    family_biannual: "Family 6-Month ₦20,000",
    family_annual: "Family Yearly ₦40,000",
  };

  const changeTypeLabels: Record<string, { label: string; color: string }> = {
    upgrade: { label: "Upgrade", color: "text-green-400 bg-green-500/20" },
    downgrade: { label: "Downgrade", color: "text-amber-400 bg-amber-500/20" },
    category_switch: { label: "Category Switch", color: "text-blue-400 bg-blue-500/20" },
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Plan Changes</h2>
        <p className="text-muted-foreground">View and manage scheduled subscription plan changes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <ArrowUpDown className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingChanges}</p>
                <p className="text-xs text-muted-foreground">Pending Changes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingUpgrades}</p>
                <p className="text-xs text-muted-foreground">Pending Upgrades</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <TrendingDown className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingDowngrades}</p>
                <p className="text-xs text-muted-foreground">Pending Downgrades</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Changes List */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">All Plan Changes</CardTitle>
        </CardHeader>
        <CardContent>
          {changes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ArrowUpDown className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No plan changes yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {changes.map((change) => {
                const typeInfo = changeTypeLabels[change.change_type] || { label: change.change_type, color: "text-gray-400 bg-gray-500/20" };
                const isPending = !change.is_processed;
                const isPast = new Date(change.effective_date) < new Date();
                
                return (
                  <div
                    key={change.id}
                    className={`p-4 rounded-xl border ${
                      isPending 
                        ? "bg-zinc-900/50 border-border/50" 
                        : "bg-zinc-900/30 border-border/30 opacity-70"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{change.display_name || "Unknown User"}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          {isPending ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                              Pending
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                              Processed
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{change.email || "No email"}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <span className="text-muted-foreground">{planLabels[change.current_plan] || change.current_plan}</span>
                          <ArrowRight className="w-4 h-4 text-primary" />
                          <span className="text-foreground font-medium">{planLabels[change.new_plan] || change.new_plan}</span>
                        </div>
                      </div>

                      <div className="flex flex-col lg:items-end gap-2">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Effective: </span>
                          <span className={isPast && isPending ? "text-red-400" : "text-foreground"}>
                            {formatDate(change.effective_date)}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Scheduled: {formatDateTime(change.created_at)}
                        </p>
                        
                        {isPending && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelChange(change.id)}
                            disabled={cancellingId === change.id}
                            className="text-red-400 border-red-500/30 hover:bg-red-500/20 mt-2"
                          >
                            {cancellingId === change.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 mr-1" />
                                Cancel Change
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}