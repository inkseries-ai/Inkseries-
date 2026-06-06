import { useState, useEffect } from "react";
import { Sparkles, Mail, Check, Loader as Loader2 } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";

interface LaunchInfo {
  launchDate: string | null;
}

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-900/80 backdrop-blur border border-amber-500/30 rounded-xl flex items-center justify-center">
        <span className="text-2xl sm:text-3xl font-display font-bold text-white">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs sm:text-sm text-zinc-500 mt-2 uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      <TimeBlock value={timeLeft.days} label="Days" />
      <span className="text-2xl text-amber-500/50 font-light mt-[-1.5rem]">:</span>
      <TimeBlock value={timeLeft.hours} label="Hours" />
      <span className="text-2xl text-amber-500/50 font-light mt-[-1.5rem]">:</span>
      <TimeBlock value={timeLeft.minutes} label="Mins" />
      <span className="text-2xl text-amber-500/50 font-light mt-[-1.5rem]">:</span>
      <TimeBlock value={timeLeft.seconds} label="Secs" />
    </div>
  );
}

export default function ComingSoon() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [launchInfo, setLaunchInfo] = useState<LaunchInfo | null>(null);

  useEffect(() => {
    fetch("/api/coming-soon/status")
      .then(res => res.json())
      .then(data => {
        setLaunchInfo({ launchDate: data.launchDate });
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/coming-soon/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  };

  const launchDate = launchInfo?.launchDate 
    ? new Date(launchInfo.launchDate) 
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days from now

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-amber-950/30 via-zinc-950 to-purple-950/20" />
      
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="relative z-10 max-w-lg w-full text-center space-y-8 py-12">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <img
            src="https://sitmr2etn6sue.mochausercontent.com/favicon.png"
            alt="Inkseries"
            className="w-12 h-12"
          />
          <span className="text-3xl font-display font-bold text-white tracking-wide">
            Inkseries
          </span>
        </div>
        
        {/* Icon burst */}
        <div className="relative mx-auto w-28 h-28">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-full blur-2xl animate-pulse" />
          <div className="absolute inset-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="relative w-full h-full bg-zinc-900/90 rounded-full flex items-center justify-center border border-amber-500/40">
            <Sparkles className="w-12 h-12 text-amber-400" />
          </div>
        </div>
        
        {/* Main heading */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-white leading-tight">
            Something big is coming<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              for African teenagers
            </span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-md mx-auto">
            Serialized stories that sound and feel like home. New episodes every week.
          </p>
        </div>
        
        {/* Countdown */}
        <div className="py-6">
          <CountdownTimer targetDate={launchDate} />
        </div>
        
        {/* Email capture */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4">
          {status === "success" ? (
            <div className="py-4 space-y-3">
              <div className="w-14 h-14 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                <Check className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">You're on the list!</h3>
              <p className="text-zinc-400">
                Get ready — something special is coming. We'll email you when we launch.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">Join the waitlist</h3>
                <p className="text-sm text-zinc-400">
                  Get <span className="text-amber-400 font-medium">7 days free</span> when we launch
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-3 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                    required
                    disabled={status === "loading"}
                  />
                </div>
                
                {status === "error" && (
                  <p className="text-sm text-red-400">{errorMessage}</p>
                )}
                
                <Button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold py-3 rounded-xl transition-all"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Joining...
                    </>
                  ) : (
                    "Notify Me"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
        
        {/* Social links */}
        <div className="space-y-3">
          <p className="text-sm text-zinc-500">Follow us for updates</p>
          <div className="flex items-center justify-center gap-4">
            <a 
              href="https://www.facebook.com/share/18fxZPL6ED/"
              target="_blank" 
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-amber-500 hover:border-amber-500/50 transition-colors"
              aria-label="Facebook"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a 
              href="https://www.instagram.com/inkseriesofficial" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-amber-500 hover:border-amber-500/50 transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a 
              href="https://www.tiktok.com/@inkseriesofficial" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-amber-500 hover:border-amber-500/50 transition-colors"
              aria-label="TikTok"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
            <a 
              href="https://whatsapp.com/channel/0029VbCh1Us0AgW21Kf7rC3v" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-amber-500 hover:border-amber-500/50 transition-colors"
              aria-label="WhatsApp"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
