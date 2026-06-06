import Navbar from "@/react-app/components/Navbar";
import Footer from "@/react-app/components/Footer";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-orange-500/20 border border-primary/30 mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-8">
          <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              At Inkseries, we are committed to protecting your privacy and ensuring the security of your 
              personal information. This Privacy Policy explains how we collect, use, disclose, and 
              safeguard your data when you use our platform. By using Inkseries, you consent to the 
              practices described in this policy.
            </p>
          </section>

          <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">Information We Collect</h2>
            
            <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Account Information</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Name and email address (via Google authentication)</li>
              <li>Profile picture (if provided through Google)</li>
              <li>Display name and bio (if you choose to add them)</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">Usage Data</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Reading history and progress</li>
              <li>Bookmarked chapters and saved novels</li>
              <li>Community interactions (comments, poll votes)</li>
              <li>Event RSVPs and participation</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">Technical Data</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Device type and browser information</li>
              <li>IP address and general location</li>
              <li>Session duration and pages visited</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">Payment Information</h3>
            <p className="text-muted-foreground leading-relaxed">
              Payment processing is handled by third-party providers (such as Stripe). We do not 
              store your full credit card details. We only receive confirmation of successful 
              transactions and subscription status.
            </p>
          </section>

          <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">How We Use Your Information</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>To provide and improve our services</li>
              <li>To personalize your reading experience and recommendations</li>
              <li>To process subscriptions and payments</li>
              <li>To send important updates about your account or new features</li>
              <li>To notify you about new chapters from stories you follow</li>
              <li>To moderate community content and ensure platform safety</li>
              <li>To analyze usage patterns and improve our platform</li>
              <li>To respond to your inquiries and support requests</li>
            </ul>
          </section>

          <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">Information Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We do not sell your personal information. We may share data with:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong className="text-foreground">Service providers:</strong> Companies that help us operate (hosting, analytics, payment processing)</li>
              <li><strong className="text-foreground">Authors:</strong> Aggregated, anonymous reading statistics for their stories</li>
              <li><strong className="text-foreground">Legal requirements:</strong> When required by law or to protect our rights</li>
              <li><strong className="text-foreground">Business transfers:</strong> In the event of a merger or acquisition</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Your public profile (display name, bio) and community posts are visible to other users.
            </p>
          </section>

          <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your data, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-4">
              <li>Encrypted data transmission (HTTPS/TLS)</li>
              <li>Secure authentication through Google OAuth</li>
              <li>Regular security audits and monitoring</li>
              <li>Limited employee access to personal data</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              While we strive to protect your information, no method of transmission over the Internet 
              is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">Your Rights & Choices</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong className="text-foreground">Access:</strong> Request a copy of your personal data</li>
              <li><strong className="text-foreground">Correct:</strong> Update inaccurate information in your profile</li>
              <li><strong className="text-foreground">Delete:</strong> Request deletion of your account and associated data</li>
              <li><strong className="text-foreground">Opt-out:</strong> Unsubscribe from marketing emails</li>
              <li><strong className="text-foreground">Export:</strong> Download your reading history and bookmarks</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To exercise these rights, visit your Settings page or contact us directly.
            </p>
          </section>

          <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">Cookies & Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-4">
              <li>Keep you logged in</li>
              <li>Remember your reading preferences (font size, theme)</li>
              <li>Analyze platform usage</li>
              <li>Provide personalized recommendations</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You can control cookies through your browser settings, though this may affect 
              platform functionality.
            </p>
          </section>

          <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Inkseries is not intended for children under 13. We do not knowingly collect personal 
              information from children under 13. If you believe we have collected such information, 
              please contact us immediately so we can delete it.
            </p>
          </section>

          <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data for as long as your account is active or as needed to provide 
              services. After account deletion, we may retain certain information for legal 
              compliance, dispute resolution, or to enforce our agreements. Anonymous, aggregated 
              data may be retained indefinitely.
            </p>
          </section>

          <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant 
              changes via email or a notice on our platform. Your continued use of Inkseries after 
              changes indicates acceptance of the updated policy.
            </p>
          </section>

          <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions or concerns about this Privacy Policy or your data, please contact us at:
            </p>
            <div className="mt-4 space-y-2 text-muted-foreground">
              <p>Email: <a href="mailto:info@inkseries.com" className="text-primary hover:underline">info@inkseries.com</a></p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
