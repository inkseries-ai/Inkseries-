import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { Button } from "@/react-app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/react-app/components/ui/dropdown-menu";
import { Menu, X, User, LogOut, Library, Settings, Loader2, Sparkles } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [trialInfo, setTrialInfo] = useState<{ isTrial: boolean; trialExpiresAt?: string } | null>(null);
  const { user, isPending, redirectToLogin, logout } = useAuth();

  // Fetch trial status when user is logged in
  useEffect(() => {
    if (user) {
      fetch("/api/subscriptions/status", { credentials: "include" })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setTrialInfo({ isTrial: data.isTrial, trialExpiresAt: data.trialExpiresAt });
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleLogin = async () => {
    await redirectToLogin();
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src="https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/favicon.png" 
              alt="Inkseries Logo" 
              className="w-9 h-9"
            />
            <span className="text-xl font-bold tracking-tight">Inkseries</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/explore" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Explore
            </Link>
            <Link to="/community" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Community
            </Link>
            <Link to="/polls" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Polls
            </Link>
            <Link to="/events" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Live Events
            </Link>
            <Link to="/mentorship" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              For Writers
            </Link>
          </div>

          {/* Desktop CTA / User Menu */}
          <div className="hidden md:flex items-center gap-3">
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1.5 rounded-full hover:bg-muted transition-colors">
                    {user.google_user_data?.picture ? (
                      <img
                        src={user.google_user_data.picture}
                        alt={user.google_user_data.name || "User"}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-border"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2">
                    <p className="text-sm font-medium truncate">
                      {user.google_user_data?.name || "Reader"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    {trialInfo?.isTrial && trialInfo.trialExpiresAt && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-400">
                        <Sparkles className="w-3 h-3" />
                        <span>Trial ends {new Date(trialInfo.trialExpiresAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/library" className="flex items-center gap-2 cursor-pointer">
                      <Library className="w-4 h-4" />
                      My Library
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 cursor-pointer text-red-400 focus:text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={handleLogin}>
                  Sign In
                </Button>
                <Link to="/explore">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-primary to-orange-500 hover:opacity-90 transition-opacity"
                  >
                    Start Reading
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-background border-b border-border max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 py-4 space-y-3">
            {user && (
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                {user.google_user_data?.picture ? (
                  <img
                    src={user.google_user_data.picture}
                    alt={user.google_user_data.name || "User"}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-border"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{user.google_user_data?.name || "Reader"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            )}
            <Link
              to="/explore"
              className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Explore
            </Link>
            <Link
              to="/community"
              className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Community
            </Link>
            <Link
              to="/polls"
              className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Polls
            </Link>
            <Link
              to="/events"
              className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Live Events
            </Link>
            <Link
              to="/mentorship"
              className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              onClick={() => setIsOpen(false)}
            >
              For Writers
            </Link>
            {user && (
              <>
                <Link
                  to="/library"
                  className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  My Library
                </Link>
                <Link
                  to="/settings"
                  className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Settings
                </Link>
              </>
            )}
            <div className="pt-3 border-t border-border space-y-2">
              {user ? (
                <Button
                  variant="outline"
                  className="w-full text-red-400 border-red-400/30 hover:bg-red-400/10"
                  size="sm"
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="w-full" size="sm" onClick={handleLogin}>
                    Sign In
                  </Button>
                  <Link to="/explore" onClick={() => setIsOpen(false)}>
                    <Button
                      className="w-full bg-gradient-to-r from-primary to-orange-500"
                      size="sm"
                    >
                      Start Reading
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
