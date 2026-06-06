import Navbar from "@/react-app/components/Navbar";
import Footer from "@/react-app/components/Footer";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-orange-500/20 border border-primary/30 mb-6">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-8">
          <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Inkseries ("the Platform"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our services. We reserve the right to 
              modify these terms at any time, and your continued use of the Platform constitutes acceptance 
              of any changes.
            </p>
          </section>

          <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Inkseries is a digital platform for serialized African fiction, providing:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Access to serialized novels and stories</li>
              <li>Community features including discussions and polls</li>
              <li>Live events and author interactions</li>
              <li>Tools for writers to publish and share their work</li>
            </ul>
          </section>

          <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To access certain features, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You must be at least 13 years old to create an account. Users under 18 should have 
              parental consent.
            </p>
          </section>

          <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">4. Subscription & Payments</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Inkseries offers free and premium subscription tiers:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Free tier: Access to selected free episodes and community features</li>
              <li>Premium subscription: Full access to all content, including premium episodes</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Subscriptions auto-renew unless cancelled before the renewal date. Prices are displayed 
              in Nigerian Naira (₦) and may be subject to change.
            </p>
          </section>

          <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">5. Refund Policy</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We want you to love Inkseries. If you're not satisfied, here's how refunds work:
            </p>
            
            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Recurring Plans (Weekly & Monthly)</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Weekly and monthly subscriptions can be cancelled at any time. However, <strong className="text-foreground">no refunds are issued for recurring plan payments already processed</strong>. When you cancel, you retain access until the end of your current billing period.
            </p>
            
            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">One-Time Plans (3-Month, 6-Month, Yearly)</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              One-time payment plans include a <strong className="text-foreground">7-day refund guarantee</strong>. You are eligible for a full refund if:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
              <li>Your request is made within 7 days of payment</li>
              <li>You have read fewer than 10 episodes</li>
              <li>You have not received a refund from Inkseries before</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-4">
              After 7 days, the refund option is no longer available and your subscription continues until the expiry date.
            </p>
            
            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">How to Request a Refund</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To request a refund (one-time plans only):
            </p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 ml-4 mb-4">
              <li>Go to Settings → Manage Subscription</li>
              <li>Look for the "7-Day Refund Available" section</li>
              <li>Click "Request Refund" and confirm your request</li>
            </ol>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Refunds are typically processed within 3-5 business days and will be credited to your original payment method.
            </p>
            
            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">After a Refund</h3>
            <p className="text-muted-foreground leading-relaxed">
              Once a refund is processed, your subscription will be cancelled immediately. You will lose access to 
              premium episodes but can continue using free features. Downloaded episodes will become inaccessible. 
              You may subscribe again at any time, but future subscriptions are not eligible for refunds.
            </p>
          </section>

          <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">6. Content & Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              All content on Inkseries, including stories, artwork, and audio, is protected by copyright:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Stories remain the intellectual property of their respective authors</li>
              <li>You may not copy, distribute, or reproduce content without permission</li>
              <li>Screenshots and quotes for personal, non-commercial use are permitted with attribution</li>
              <li>Writers retain rights to their work but grant Inkseries a license to display and distribute it</li>
            </ul>
          </section>

          <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">7. User Conduct</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Post harmful, abusive, or discriminatory content</li>
              <li>Harass other users or authors</li>
              <li>Share spoilers without proper warnings</li>
              <li>Attempt to access premium content without a valid subscription</li>
              <li>Use automated systems to scrape or download content</li>
              <li>Impersonate others or misrepresent your identity</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Violations may result in account suspension or termination.
            </p>
          </section>

          <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">8. Writer Terms</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Writers who publish on Inkseries agree to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Only submit original work or work they have rights to publish</li>
              <li>Not plagiarize or infringe on others' intellectual property</li>
              <li>Follow content guidelines regarding mature themes</li>
              <li>Revenue sharing terms as outlined in the Writer Agreement</li>
            </ul>
          </section>

          <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">9. Disclaimers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Inkseries is provided "as is" without warranties of any kind. We do not guarantee 
              uninterrupted service or that the platform will be error-free. Story content reflects 
              the views of individual authors, not Inkseries. We are not responsible for user-generated 
              content in community discussions.
            </p>
          </section>

          <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:legal@inkseries.com" className="text-primary hover:underline">
                legal@inkseries.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
