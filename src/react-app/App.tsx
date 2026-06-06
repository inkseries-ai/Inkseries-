import { lazy, Suspense, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";
import { preloadNovels } from "@/react-app/hooks/useNovelsCache";

// Preload novels data immediately for faster Explore page
preloadNovels();

// Critical pages loaded immediately
import HomePage from "@/react-app/pages/Home";
import MaintenancePage from "@/react-app/pages/Maintenance";

// Lazy load all other pages for faster initial load
const ExplorePage = lazy(() => import("@/react-app/pages/Explore"));
const NovelDetailPage = lazy(() => import("@/react-app/pages/NovelDetail"));
const ReaderPage = lazy(() => import("@/react-app/pages/Reader"));
const AuthCallbackPage = lazy(() => import("@/react-app/pages/AuthCallback"));
const PaymentCallbackPage = lazy(() => import("@/react-app/pages/PaymentCallback"));
const CommunityPage = lazy(() => import("@/react-app/pages/Community"));
const PollsPage = lazy(() => import("@/react-app/pages/Polls"));
const EventsPage = lazy(() => import("@/react-app/pages/Events"));
const AdminPage = lazy(() => import("@/react-app/pages/Admin"));
const SettingsPage = lazy(() => import("@/react-app/pages/Settings"));
const LibraryPage = lazy(() => import("@/react-app/pages/Library"));
const TermsPage = lazy(() => import("@/react-app/pages/Terms"));
const PrivacyPage = lazy(() => import("@/react-app/pages/Privacy"));
const FAQPage = lazy(() => import("@/react-app/pages/FAQ"));
const MentorshipPage = lazy(() => import("@/react-app/pages/Mentorship"));
const OnboardingPage = lazy(() => import("@/react-app/pages/Onboarding"));
const ContactPage = lazy(() => import("@/react-app/pages/Contact"));
const CompetitionFlyerPage = lazy(() => import("@/react-app/pages/CompetitionFlyer"));
const CompetitionSubmitPage = lazy(() => import("@/react-app/pages/CompetitionSubmit"));
const CertificatePage = lazy(() => import("@/react-app/pages/Certificate"));
const BadgesPage = lazy(() => import("@/react-app/pages/Badges"));
const LetterheadPage = lazy(() => import("@/react-app/pages/Letterhead"));
const ComingSoonPage = lazy(() => import("@/react-app/pages/ComingSoon"));
const InstallPrompt = lazy(() => import("@/react-app/components/InstallPrompt"));
import { PWAInstallButton } from "@/react-app/components/PWAInstallButton";
const AdminRoute = lazy(() => import("@/react-app/components/AdminRoute"));

// Minimal loading fallback
function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Coming Soon page (loaded directly for wrapper)
import ComingSoon from "@/react-app/pages/ComingSoon";

// Maintenance and Coming Soon mode wrapper
function MaintenanceWrapper({ children }: { children: React.ReactNode }) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isComingSoonMode, setIsComingSoonMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check both maintenance and coming soon status in parallel
    Promise.all([
      fetch("/api/maintenance/status").then(res => res.json()).catch(() => ({ enabled: false })),
      fetch("/api/coming-soon/status").then(res => res.json()).catch(() => ({ enabled: false })),
      fetch("/api/users/me", { credentials: "include" }).then(res => res.ok ? res.json() : null).catch(() => null)
    ]).then(([maintenanceData, comingSoonData, userData]) => {
      setIsMaintenanceMode(maintenanceData.enabled === true);
      setIsComingSoonMode(comingSoonData.enabled === true);
      setIsLoggedIn(!!userData?.user);

      // If either mode is enabled, check admin status
      if (maintenanceData.enabled || comingSoonData.enabled) {
        fetch("/api/admin/check", { credentials: "include" })
          .then(res => res.json())
          .then(adminData => {
            setIsAdmin(adminData.isAdmin === true);
            setLoading(false);
          })
          .catch(() => {
            setIsAdmin(false);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  // Maintenance mode takes priority - show to everyone except admins
  if (isMaintenanceMode && !isAdmin) {
    return <MaintenancePage />;
  }

  // Coming Soon mode - show to non-logged-in users only (logged in users bypass)
  if (isComingSoonMode && !isLoggedIn && !isAdmin) {
    return <ComingSoon />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <MaintenanceWrapper>
        <Router>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/novel/:id" element={<NovelDetailPage />} />
            <Route path="/read/:novelId/:chapterNum" element={<ReaderPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/payment-callback" element={<PaymentCallbackPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/polls" element={<PollsPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/mentorship" element={<MentorshipPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/competition-flyer" element={<AdminRoute><CompetitionFlyerPage /></AdminRoute>} />
            <Route path="/competition" element={<AdminRoute><CompetitionSubmitPage /></AdminRoute>} />
            <Route path="/certificate" element={<AdminRoute><CertificatePage /></AdminRoute>} />
            <Route path="/badges" element={<BadgesPage />} />
            <Route path="/letterhead" element={<AdminRoute><LetterheadPage /></AdminRoute>} />
            <Route path="/coming-soon" element={<ComingSoonPage />} />
          </Routes>
          <InstallPrompt />
          <PWAInstallButton variant="floating" />
        </Suspense>
      </Router>
      </MaintenanceWrapper>
    </AuthProvider>
  );
}
