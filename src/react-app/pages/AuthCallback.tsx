import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { Loader as Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { exchangeCodeForSessionToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await exchangeCodeForSessionToken();
        
        // Check if user has completed onboarding
        const response = await fetch("/api/onboarding/status", {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.hasCompletedOnboarding) {
            navigate("/explore");
          } else {
            navigate("/onboarding");
          }
        } else {
          // New user, go to onboarding
          navigate("/onboarding");
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("Authentication failed. Please try again.");
        setTimeout(() => navigate("/"), 3000);
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        <img 
          src="https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/favicon.png" 
          alt="Inkseries" 
          className="w-16 h-16 mx-auto"
        />
        
        {error ? (
          <>
            <p className="text-red-400">{error}</p>
            <p className="text-sm text-muted-foreground">Redirecting you home...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Signing you in...</p>
          </>
        )}
      </div>
    </div>
  );
}
