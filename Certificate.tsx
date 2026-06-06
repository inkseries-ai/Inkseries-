import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { Loader2 } from "lucide-react";

const FAVICON_URL = "https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/favicon.png";

interface CertificateData {
  recipientName: string;
  storyTitle: string;
  achievement: "winner1" | "winner2" | "winner3" | "winner4" | "finalist" | "exceptional" | "participant";
  date: string;
}

const achievementLabels: Record<string, { title: string; subtitle: string; color: string }> = {
  winner1: { 
    title: "1ST PLACE WINNER", 
    subtitle: "Grand Prize Champion",
    color: "#FFD700"
  },
  winner2: { 
    title: "2ND PLACE WINNER", 
    subtitle: "Outstanding Achievement",
    color: "#C0C0C0"
  },
  winner3: { 
    title: "3RD PLACE WINNER", 
    subtitle: "Excellence in Writing",
    color: "#CD7F32"
  },
  winner4: { 
    title: "4TH PLACE WINNER", 
    subtitle: "Exceptional Talent",
    color: "#B8860B"
  },
  finalist: { 
    title: "TOP 20 FINALIST", 
    subtitle: "Distinguished Writer",
    color: "#9333EA"
  },
  exceptional: { 
    title: "EXCEPTIONAL YOUNG WRITER", 
    subtitle: "Rising Literary Star",
    color: "#10B981"
  },
  participant: { 
    title: "CERTIFICATE OF PARTICIPATION", 
    subtitle: "Young Writer",
    color: "#0EA5E9"
  },
};

export default function Certificate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isPending } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  const [data, setData] = useState<CertificateData>({
    recipientName: searchParams.get("name") || "Participant Name",
    storyTitle: searchParams.get("story") || "Story Title",
    achievement: (searchParams.get("achievement") as CertificateData["achievement"]) || "participant",
    date: searchParams.get("date") || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
  });

  const [isEditing, setIsEditing] = useState(!searchParams.get("name"));

  // Check admin status
  useEffect(() => {
    if (isPending) return;
    
    if (!user) {
      navigate("/");
      return;
    }

    fetch("/api/admin/check", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.isAdmin) {
          setIsAdmin(true);
        } else {
          navigate("/");
        }
      })
      .catch(() => navigate("/"));
  }, [user, isPending, navigate]);

  useEffect(() => {
    // Load elegant fonts
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;900&family=Great+Vibes&family=Cormorant+Garamond:wght@400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const handlePrint = () => {
    setIsEditing(false);
    setTimeout(() => window.print(), 100);
  };

  // Show loading while checking admin status
  if (isPending || isAdmin === null) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  const achievement = achievementLabels[data.achievement];

  return (
    <>
      {/* Controls - hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-3">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-4 py-2 rounded-lg shadow-lg transition-colors"
        >
          {isEditing ? "Preview" : "Edit"}
        </button>
        <button
          onClick={handlePrint}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 py-2 rounded-lg shadow-lg transition-colors"
        >
          Download as PDF / Print
        </button>
      </div>

      {/* Edit Panel */}
      {isEditing && (
        <div className="print:hidden fixed top-20 right-4 z-50 bg-zinc-800 border border-zinc-700 rounded-xl p-4 w-80 shadow-xl">
          <h3 className="text-white font-semibold mb-4">Certificate Details</h3>
          <div className="space-y-3">
            <div>
              <label className="text-zinc-400 text-sm">Recipient Name</label>
              <input
                type="text"
                value={data.recipientName}
                onChange={(e) => setData({ ...data, recipientName: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-sm">Story Title</label>
              <input
                type="text"
                value={data.storyTitle}
                onChange={(e) => setData({ ...data, storyTitle: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-sm">Achievement</label>
              <select
                value={data.achievement}
                onChange={(e) => setData({ ...data, achievement: e.target.value as CertificateData["achievement"] })}
                className="w-full mt-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              >
                <option value="winner1">1st Place Winner</option>
                <option value="winner2">2nd Place Winner</option>
                <option value="winner3">3rd Place Winner</option>
                <option value="winner4">4th Place Winner</option>
                <option value="finalist">Top 20 Finalist</option>
                <option value="exceptional">Exceptional Young Writer</option>
                <option value="participant">Participant</option>
              </select>
            </div>
            <div>
              <label className="text-zinc-400 text-sm">Date</label>
              <input
                type="text"
                value={data.date}
                onChange={(e) => setData({ ...data, date: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Certificate */}
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-8 print:p-0 print:bg-white">
        <div 
          className="relative bg-[#FFFEF5] w-[297mm] h-[210mm] print:w-full print:h-full shadow-2xl print:shadow-none"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {/* Ornate Border */}
          <div className="absolute inset-4 border-2 border-amber-600/30" />
          <div className="absolute inset-6 border border-amber-600/20" />
          <div className="absolute inset-8 border border-amber-600/10" />
          
          {/* Corner Decorations */}
          <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-amber-600/50" />
          <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-amber-600/50" />
          <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-amber-600/50" />
          <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-amber-600/50" />
          
          {/* Inner Corner Accents */}
          <div className="absolute top-12 left-12 w-4 h-4 bg-amber-600/20 rotate-45" />
          <div className="absolute top-12 right-12 w-4 h-4 bg-amber-600/20 rotate-45" />
          <div className="absolute bottom-12 left-12 w-4 h-4 bg-amber-600/20 rotate-45" />
          <div className="absolute bottom-12 right-12 w-4 h-4 bg-amber-600/20 rotate-45" />

          {/* Content */}
          <div className="relative h-full flex flex-col items-center justify-center px-16 py-12 text-center">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3 mb-2">
              <img src={FAVICON_URL} alt="Inkseries" className="w-12 h-12" />
              <span 
                className="text-3xl font-bold tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif", color: "#B8860B" }}
              >
                Inkseries
              </span>
            </div>
            
            {/* Competition Title */}
            <p className="text-gray-600 text-sm tracking-[0.3em] uppercase mb-6">
              Young Writers Challenge 2026
            </p>

            {/* Achievement Badge */}
            <div 
              className="px-8 py-2 rounded-full mb-6"
              style={{ backgroundColor: `${achievement.color}20`, border: `2px solid ${achievement.color}` }}
            >
              <span 
                className="text-lg font-bold tracking-wider"
                style={{ color: achievement.color, fontFamily: "'Playfair Display', serif" }}
              >
                {achievement.title}
              </span>
            </div>

            {/* Certificate Text */}
            <p className="text-gray-600 text-lg mb-2">This certificate is proudly presented to</p>

            {/* Recipient Name */}
            <h1 
              className="text-5xl mb-2"
              style={{ fontFamily: "'Great Vibes', cursive", color: "#1a1a1a" }}
            >
              {data.recipientName}
            </h1>
            
            {/* Achievement Subtitle */}
            <p className="text-gray-500 text-sm tracking-wider uppercase mb-6">{achievement.subtitle}</p>

            {/* Story Title */}
            <p className="text-gray-600 mb-1">For the outstanding creative work</p>
            <p 
              className="text-2xl italic mb-6"
              style={{ fontFamily: "'Playfair Display', serif", color: "#B8860B" }}
            >
              "{data.storyTitle}"
            </p>

            {/* Description */}
            <p className="text-gray-600 max-w-lg text-sm leading-relaxed mb-8">
              In recognition of exceptional creativity, storytelling excellence, and dedication to the craft of writing 
              in the Inkseries Young Writers Challenge 2026.
            </p>

            {/* Signatures Section */}
            <div className="flex items-end justify-center gap-24 mt-auto">
              <div className="text-center">
                <div className="w-40 border-b border-gray-400 mb-2" />
                <p className="text-gray-600 text-sm">Competition Director</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500 text-sm">{data.date}</p>
                <p className="text-gray-600 text-sm">Date of Issue</p>
              </div>
              <div className="text-center">
                <div className="w-40 border-b border-gray-400 mb-2" />
                <p className="text-gray-600 text-sm">Head Judge</p>
              </div>
            </div>

            {/* Footer */}
            <p className="absolute bottom-6 text-gray-400 text-xs tracking-wider">
              inkseries.com • Serialized African Teenage fiction. New episodes every week
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </>
  );
}
