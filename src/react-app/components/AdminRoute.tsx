import { useEffect, useState, ReactNode } from "react";
import { Navigate } from "react-router";

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/check", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(data.isAdmin === true);
      })
      .catch(() => {
        setIsAdmin(false);
      });
  }, []);

  // Still checking - show loading
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not an admin - redirect to homepage
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Is admin - show the page
  return <>{children}</>;
}
