import { useEffect } from "react";

export default function Letterhead() {
  useEffect(() => {
    // Set page title for printing
    document.title = "Inkseries Digital - Letterhead";
  }, []);

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Print button */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-gradient-to-r from-primary to-orange-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg"
        >
          Print / Save PDF
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors shadow-lg"
        >
          Back
        </button>
      </div>

      {/* A4 Letterhead */}
      <div 
        className="bg-white mx-auto shadow-2xl"
        style={{ 
          width: "210mm", 
          minHeight: "297mm",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <div 
          className="relative"
          style={{
            background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)",
            padding: "24mm 20mm 20mm 20mm",
          }}
        >
          {/* Gold accent line at top */}
          <div 
            className="absolute top-0 left-0 right-0"
            style={{
              height: "4mm",
              background: "linear-gradient(90deg, #D97706, #F59E0B, #D97706)",
            }}
          />

          <div className="flex items-center justify-between">
            {/* Logo and Company Name */}
            <div className="flex items-center gap-4">
              <img 
                src="https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/favicon.png" 
                alt="Inkseries Logo"
                className="w-16 h-16 object-contain"
                style={{ filter: "drop-shadow(0 2px 4px rgba(217, 119, 6, 0.3))" }}
              />
              <div>
                <h1 
                  className="font-bold tracking-wide"
                  style={{ 
                    fontSize: "28px",
                    color: "#D97706",
                    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                    letterSpacing: "2px"
                  }}
                >
                  INKSERIES DIGITAL
                </h1>
                <p 
                  className="mt-1 tracking-widest uppercase"
                  style={{ 
                    fontSize: "10px", 
                    color: "#9CA3AF",
                    letterSpacing: "3px"
                  }}
                >
                  Where Stories Come Alive
                </p>
              </div>
            </div>

            {/* Contact Info */}
            <div 
              className="text-right"
              style={{ fontSize: "11px", color: "#D1D5DB", lineHeight: "1.8" }}
            >
              <p className="flex items-center justify-end gap-2">
                <span>No. 27 Works Layout, Owerri, Imo State</span>
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#D97706" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </p>
              <p className="flex items-center justify-end gap-2">
                <span>+234 703 683 3240</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#D97706" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </p>
              <p className="flex items-center justify-end gap-2">
                <span>info@inkseries.com</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#D97706" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </p>
            </div>
          </div>

          {/* Bottom gold accent */}
          <div 
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: "1mm",
              background: "linear-gradient(90deg, transparent, #D97706, transparent)",
            }}
          />
        </div>

        {/* Content Area - Letter content */}
        <div 
          className="relative"
          style={{ 
            padding: "15mm 20mm",
            minHeight: "180mm",
          }}
        >
          {/* Watermark */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]"
          >
            <img 
              src="https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/favicon.png" 
              alt=""
              style={{ width: "120mm", height: "120mm", objectFit: "contain" }}
            />
          </div>

          {/* Date line */}
          <div className="mb-8" style={{ color: "#374151", fontSize: "12px" }}>
            <p>Date: __________</p>
          </div>

          {/* Recipient */}
          <div className="mb-6" style={{ color: "#374151", fontSize: "12px", lineHeight: "1.8" }}>
            <p>The Manager,</p>
            <p>UBA Plc,</p>
            <p>Ahiara Mbaise.</p>
          </div>

          {/* Subject line */}
          <div className="mb-6" style={{ color: "#374151", fontSize: "12px" }}>
            <p><strong>Subject: RESOLUTION TO OPEN AN ACCOUNT</strong></p>
          </div>

          {/* Salutation */}
          <div className="mb-4" style={{ color: "#374151", fontSize: "12px" }}>
            <p>Dear Sir,</p>
          </div>

          {/* Body */}
          <div className="mb-4" style={{ color: "#374151", fontSize: "12px", lineHeight: "1.8" }}>
            <p className="mb-4">
              I, IBEABUCHI KENNETH EKENE, wish to notify you of my desire to open and maintain a business account with UBA.
            </p>
            <p className="mb-4">
              I will be the sole signatory to the account, but changes could be made in the near future.
            </p>
            <p>
              I anticipate your positive response.
            </p>
          </div>

          {/* Signature */}
          <div className="mt-12" style={{ color: "#374151", fontSize: "12px", lineHeight: "1.8" }}>
            <p className="mb-8">Yours faithfully,</p>
            <p className="font-semibold">IBEABUCHI KENNETH EKENE</p>
            <p>CEO</p>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="absolute bottom-0 left-0 right-0"
          style={{
            background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
            padding: "8mm 20mm",
          }}
        >
          {/* Top gold accent */}
          <div 
            className="absolute top-0 left-0 right-0"
            style={{
              height: "1mm",
              background: "linear-gradient(90deg, transparent, #D97706, transparent)",
            }}
          />

          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-6"
              style={{ fontSize: "10px", color: "#9CA3AF" }}
            >
              <span>www.inkseries.com</span>
              <span>•</span>
              <span>@inkseries</span>
            </div>
            <div 
              style={{ fontSize: "9px", color: "#6B7280" }}
            >
              Building Africa's Reading Culture, One Story at a Time
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
