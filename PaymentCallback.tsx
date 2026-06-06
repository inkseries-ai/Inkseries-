import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import { CheckCircle, XCircle, Loader2, ArrowRight, Home } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";

type PaymentStatus = "verifying" | "success" | "failed";

export default function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<PaymentStatus>("verifying");
  const [message, setMessage] = useState("");
  const [planName, setPlanName] = useState("");

  const reference = searchParams.get("reference");
  const returnTo = searchParams.get("return_to");

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      setMessage("No payment reference found.");
      return;
    }

    verifyPayment(reference);
  }, [reference]);

  const verifyPayment = async (ref: string) => {
    try {
      const res = await fetch(`/api/payments/verify/${ref}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (data.verified) {
        setStatus("success");
        setPlanName(data.plan || "Premium");
        setMessage("Your subscription is now active!");
        
        // Auto-redirect after 3 seconds if returnTo exists
        if (returnTo) {
          setTimeout(() => {
            navigate(decodeURIComponent(returnTo));
          }, 3000);
        }
      } else {
        setStatus("failed");
        setMessage(data.error || "Payment could not be verified. Please contact support if you were charged.");
      }
    } catch {
      setStatus("failed");
      setMessage("Unable to verify payment. Please check your subscription status in Settings or contact support.");
    }
  };

  const handleContinue = () => {
    if (returnTo) {
      navigate(decodeURIComponent(returnTo));
    } else {
      navigate("/explore");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center">
        {status === "verifying" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Verifying Payment</h1>
            <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-green-500">Payment Successful!</h1>
            <p className="text-muted-foreground mb-2">{message}</p>
            <p className="text-sm text-primary font-medium mb-6">
              Welcome to Inkseries {planName}!
            </p>
            
            {returnTo && (
              <p className="text-xs text-muted-foreground mb-4">
                Redirecting you back to your chapter in 3 seconds...
              </p>
            )}
            
            <div className="space-y-3">
              <Button onClick={handleContinue} className="w-full gap-2">
                {returnTo ? "Continue Reading" : "Explore Stories"}
                <ArrowRight className="w-4 h-4" />
              </Button>
              
              <Link to="/settings">
                <Button variant="ghost" className="w-full text-muted-foreground">
                  Go to Settings
                </Button>
              </Link>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-red-500">Payment Issue</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            
            <div className="space-y-3">
              {returnTo && (
                <Button onClick={handleContinue} variant="outline" className="w-full gap-2">
                  Try Again
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              
              <Link to="/settings">
                <Button variant="default" className="w-full">
                  Check Subscription Status
                </Button>
              </Link>
              
              <Link to="/">
                <Button variant="ghost" className="w-full gap-2 text-muted-foreground">
                  <Home className="w-4 h-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
            
            <p className="text-xs text-muted-foreground mt-6">
              If you were charged but see this error, please contact{" "}
              <a href="mailto:support@inkseries.com" className="text-primary hover:underline">
                support@inkseries.com
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
