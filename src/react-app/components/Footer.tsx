import { Link } from "react-router";
import { Instagram, Facebook, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { PWAInstallButton } from "./PWAInstallButton";

// Custom icons for brands not in lucide
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function Footer() {
  const [contactEmail, setContactEmail] = useState("hello@inkseries.com");

  useEffect(() => {
    fetch("/api/config")
      .then(res => res.json())
      .then((data: { contactEmail?: string }) => {
        if (data.contactEmail) setContactEmail(data.contactEmail);
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img 
                src="https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/favicon.png" 
                alt="Inkseries" 
                className="w-8 h-8"
              />
              <span className="text-lg font-bold">Inkseries</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Serialized African Teenage fiction. New episodes every week
            </p>
            <div className="flex gap-3 flex-wrap">
              <a href="https://www.facebook.com/share/18fxZPL6ED/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://www.instagram.com/inkseriesofficial" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://www.tiktok.com/@inkseriesofficial" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <TikTokIcon className="w-4 h-4" />
              </a>
              <a href="https://whatsapp.com/channel/0029VbCh1Us0AgW21Kf7rC3v" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <WhatsAppIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-semibold mb-4">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/explore" className="hover:text-foreground transition-colors">All Stories</Link></li>
              <li><Link to="/explore?genre=school-life" className="hover:text-foreground transition-colors">School Life</Link></li>
              <li><Link to="/explore?genre=romance" className="hover:text-foreground transition-colors">Romance</Link></li>
              <li><Link to="/explore?genre=thriller" className="hover:text-foreground transition-colors">Thriller</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/community" className="hover:text-foreground transition-colors">Discussions</Link></li>
              <li><Link to="/events" className="hover:text-foreground transition-colors">Live Events</Link></li>
              <li><Link to="/leaderboard" className="hover:text-foreground transition-colors">Leaderboard</Link></li>
              <li><Link to="/polls" className="hover:text-foreground transition-colors">Story Polls</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/mentorship" className="hover:text-foreground transition-colors">For Writers</Link></li>
              <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
              <li>
                <a href={`mailto:${contactEmail}`} className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {contactEmail}
                </a>
              </li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Inkseries. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <PWAInstallButton variant="footer" />
            <p className="text-sm text-muted-foreground">
              Made with love for African storytelling
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
