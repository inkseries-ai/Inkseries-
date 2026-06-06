import { useEffect } from "react";

const FAVICON_URL = "https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/favicon.png";

export default function CompetitionFlyer() {
  useEffect(() => {
    // Load Google Font for elegant typography
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Montserrat:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print Button - hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 z-50">
        <button
          onClick={handlePrint}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 py-3 rounded-lg shadow-lg transition-colors"
        >
          Download as PDF / Print
        </button>
      </div>

      {/* Flyer Content */}
      <div className="min-h-screen bg-white text-gray-900 print:bg-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="max-w-[210mm] mx-auto p-8 print:p-6">
          
          {/* Header with Logo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <img 
              src={FAVICON_URL} 
              alt="Inkseries" 
              className="w-14 h-14 print:w-12 print:h-12"
            />
            <span 
              className="text-3xl font-bold tracking-tight print:text-2xl"
              style={{ fontFamily: "'Playfair Display', serif", color: "#B8860B" }}
            >
              Inkseries
            </span>
          </div>

          {/* Main Title */}
          <div className="text-center mb-6">
            <h1 
              className="text-4xl font-black mb-2 print:text-3xl"
              style={{ fontFamily: "'Playfair Display', serif", color: "#1a1a1a" }}
            >
              THE INKSERIES
            </h1>
            <h2 
              className="text-3xl font-black mb-3 print:text-2xl"
              style={{ fontFamily: "'Playfair Display', serif", color: "#B8860B" }}
            >
              YOUNG WRITERS CHALLENGE 2026
            </h2>
            <p className="text-xl font-semibold text-gray-700 print:text-lg">
              Win Up To <span className="text-amber-600 font-bold">₦500,000</span> Writing Your Story
            </p>
          </div>

          {/* Hero Message */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg">
            <p className="text-lg italic text-gray-800 print:text-base">
              "Do you have a story inside you? A world only you can create? Characters only you can bring to life? 
              This is your chance to be discovered. Your story deserves to be told."
            </p>
          </div>

          {/* Prize Breakdown */}
          <div className="mb-6">
            <h3 
              className="text-xl font-bold mb-3 text-center print:text-lg"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              🏆 PRIZE BREAKDOWN
            </h3>
            <div className="grid grid-cols-2 gap-3 print:gap-2">
              <div className="bg-amber-500 text-white p-3 rounded-lg text-center">
                <div className="text-2xl mb-1">🥇</div>
                <div className="font-bold text-lg">1st Place</div>
                <div className="text-xl font-black">₦500,000</div>
                <div className="text-sm opacity-90">+ Featured Author Status</div>
              </div>
              <div className="bg-gray-400 text-white p-3 rounded-lg text-center">
                <div className="text-2xl mb-1">🥈</div>
                <div className="font-bold text-lg">2nd Place</div>
                <div className="text-xl font-black">₦300,000</div>
                <div className="text-sm opacity-90">+ Featured Author Status</div>
              </div>
              <div className="bg-amber-700 text-white p-3 rounded-lg text-center">
                <div className="text-2xl mb-1">🥉</div>
                <div className="font-bold text-lg">3rd Place</div>
                <div className="text-xl font-black">₦100,000</div>
                <div className="text-sm opacity-90">+ Publication on Inkseries</div>
              </div>
              <div className="bg-gray-600 text-white p-3 rounded-lg text-center">
                <div className="text-2xl mb-1">🏅</div>
                <div className="font-bold text-lg">4th Place</div>
                <div className="text-xl font-black">₦50,000</div>
                <div className="text-sm opacity-90">+ Publication on Inkseries</div>
              </div>
            </div>
            <div className="mt-3 bg-gray-100 p-3 rounded-lg text-center">
              <span className="text-lg">⭐</span>
              <span className="font-semibold ml-2">Top 20 Finalists:</span>
              <span className="ml-2">Published on Inkseries + Certificate of Achievement</span>
            </div>
          </div>

          {/* Step by Step Guide */}
          <div className="mb-6">
            <h3 
              className="text-xl font-bold mb-3 text-center print:text-lg"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              📝 HOW TO PARTICIPATE
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <div className="font-semibold">Visit the Inkseries Website</div>
                  <div className="text-gray-600 text-sm">Go to <span className="font-medium text-amber-700">inkseries.com</span> on your phone or computer</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <div className="font-semibold">Sign Up with Google</div>
                  <div className="text-gray-600 text-sm">Click "Sign In" and use your Google account to create your profile</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                <div>
                  <div className="font-semibold">Subscribe to the 3-Month Plan (₦4,000)</div>
                  <div className="text-gray-600 text-sm">Go to Settings → Subscription and select the 3-Month plan. This gives you competition entry + unlimited reading access</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">4</div>
                <div>
                  <div className="font-semibold">Write 3 Original Stories</div>
                  <div className="text-gray-600 text-sm">Create 3 fiction stories (minimum 2,000 words each). They must be your own original work</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">5</div>
                <div>
                  <div className="font-semibold">Read & Summarize 3 Novels</div>
                  <div className="text-gray-600 text-sm">Read 3 novels from Inkseries and write a summary for each (150-300 words per summary)</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">6</div>
                <div>
                  <div className="font-semibold">Submit Your Entry</div>
                  <div className="text-gray-600 text-sm">Use the submission form on the website <span className="font-medium text-amber-700">inkseries.com/competition</span></div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">7</div>
                <div>
                  <div className="font-semibold">Wait for Results</div>
                  <div className="text-gray-600 text-sm">Stories will be judged by industry professionals. Winners announced at the Grand Finale event!</div>
                </div>
              </div>
            </div>
          </div>

          {/* What You Get */}
          <div className="bg-gray-900 text-white p-4 rounded-xl mb-6">
            <h3 className="text-lg font-bold mb-2 text-amber-400 text-center">
              YOUR 3-MONTH MEMBERSHIP INCLUDES:
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-amber-400">✓</span>
                <span>Unlimited access to African novels</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400">✓</span>
                <span>Community of young writers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400">✓</span>
                <span>Automatic competition entry</span>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="border-2 border-amber-500 rounded-xl p-4 text-center">
            <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              📞 CONTACT US
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="font-semibold">Website:</span>
                <span className="text-amber-700 font-medium">inkseries.com/competition</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="font-semibold">Phone/WhatsApp:</span>
                <span className="text-amber-700 font-medium">+234 703 683 3240</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>© 2026 Inkseries. Serialized African Teenage fiction. New episodes every week.</p>
            <p className="mt-1 font-medium text-gray-700">Your story is waiting to be told. Start writing today!</p>
          </div>

        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
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
