import { useState } from "react";
import { Link } from "react-router";
import { ChevronDown, BookOpen, CreditCard, Users, Headphones, Shield, CircleHelp as HelpCircle } from "lucide-react";
import Navbar from "@/react-app/components/Navbar";
import Footer from "@/react-app/components/Footer";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    title: "Getting Started",
    icon: <BookOpen className="w-5 h-5" />,
    items: [
      {
        question: "What is Inkseries?",
        answer: "Inkseries is a serialized fiction platform dedicated to African teenage stories. We publish new episodes weekly from talented African writers across genres like school life, romance, family drama, and more. Think of it as your weekly dose of captivating African storytelling."
      },
      {
        question: "How do I start reading?",
        answer: "Simply browse our Explore page to discover stories. Many novels have free opening episodes so you can try before subscribing. Click on any novel to see its synopsis, then start reading from Episode 1."
      },
      {
        question: "Do I need an account to read?",
        answer: "You can read free episodes without an account. However, creating an account lets you save your reading progress, bookmark favorites, join discussions, and access premium content with a subscription."
      },
      {
        question: "What genres are available?",
        answer: "We feature School Life and Friendships, Romance and First Love, Family and Identity, Street and Hustle, Thriller and Mystery, and African Fantasy and Mythology. All stories are rooted in African settings, characters, and perspectives, bringing authentic African narratives to readers worldwide."
      }
    ]
  },
  {
    title: "Subscriptions & Pricing",
    icon: <CreditCard className="w-5 h-5" />,
    items: [
      {
        question: "How much does a subscription cost?",
        answer: "We offer flexible plans: Monthly at ₦1,500, 3-Month at ₦4,000 (save 11%), 6-Month at ₦7,500 (save 17%), and Yearly at ₦14,400 (save 20%). All plans include unlimited access to premium episodes."
      },
      {
        question: "What do I get with a subscription?",
        answer: "Subscribers get unlimited access to all premium episodes, early access to new releases, ad-free reading, offline downloads, exclusive author Q&As, and priority access to live events."
      },
      {
        question: "Can I cancel my subscription?",
        answer: "Yes, you can cancel anytime from your Settings page. You'll continue to have access until the end of your current billing period. We don't offer refunds for partial periods."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept payments through Paystack, which supports Nigerian bank cards, bank transfers, and USSD. International cards (Visa, Mastercard) are also accepted."
      },
      {
        question: "Is there a free trial?",
        answer: "Yes! All new users get a FREE 3-day trial with full access to every episode — no payment required to start. Plus, the first 3 episodes of every story are always free, even without an account."
      }
    ]
  },
  {
    title: "Reading Experience",
    icon: <Headphones className="w-5 h-5" />,
    items: [
      {
        question: "Can I read offline?",
        answer: "Yes! Subscribers can download episodes for offline reading. Just tap the download icon on any episode. Downloaded episodes are available in your Library even without internet."
      },
      {
        question: "How do I customize my reading experience?",
        answer: "Our reader offers multiple customization options: adjust font size, choose between light and dark themes, change font style, and set your preferred line spacing. Find these in the reader settings menu."
      },
      {
        question: "Will audio versions be available?",
        answer: "Audio narration is coming soon as a future feature! We're working on bringing professional voice narration to popular novels. Stay tuned for updates."
      },
      {
        question: "How do bookmarks work?",
        answer: "While reading, tap the bookmark icon to save your spot. All bookmarks are synced to your account and accessible from your Library. You can have multiple bookmarks per novel."
      },
      {
        question: "When are new episodes released?",
        answer: "Most novels release new episodes weekly on specific days. Check each novel's page for its release schedule. Enable notifications to get alerts when your favorite stories update."
      }
    ]
  },
  {
    title: "Community & Events",
    icon: <Users className="w-5 h-5" />,
    items: [
      {
        question: "How do I join discussions?",
        answer: "Visit our Community page to join conversations about your favorite stories. You can comment on specific episodes, participate in theory discussions, and connect with fellow readers. An account is required to post."
      },
      {
        question: "What are Story Polls?",
        answer: "Story Polls let readers vote on story directions, character decisions, and upcoming plot points. Some authors incorporate reader votes into their stories, making you part of the creative process!"
      },
      {
        question: "How do Live Events work?",
        answer: "We host regular live events including author Q&As, reading sessions, writing workshops, and launch parties. Check the Events page for upcoming sessions. Subscribers get priority access and early RSVP."
      },
      {
        question: "Can I interact with authors?",
        answer: "Absolutely! Authors often respond to episode comments, participate in community discussions, and host live Q&A sessions. Many also share behind-the-scenes content and writing updates."
      }
    ]
  },
  {
    title: "For Writers",
    icon: <HelpCircle className="w-5 h-5" />,
    items: [
      {
        question: "How do I submit my story?",
        answer: "Visit our Writers page to learn about submission guidelines. We accept original African fiction across all genres. Submit a sample of your work and our editorial team will review it within 2-4 weeks."
      },
      {
        question: "How do writers earn money?",
        answer: "Writers earn through our revenue-sharing model based on episode reads. Top-performing authors can earn competitive rates, with bonuses for exclusive content and high engagement."
      },
      {
        question: "Do you offer writing support?",
        answer: "Yes! We have a Writer Mentorship program pairing emerging writers with established authors. We also offer editorial feedback, cover design support, and marketing assistance for published works."
      },
      {
        question: "Can I publish my existing web novel?",
        answer: "We primarily feature exclusive content, but we do consider previously published work on a case-by-case basis. Reach out to our team with details about your existing novel's publication history."
      }
    ]
  },
  {
    title: "Account & Privacy",
    icon: <Shield className="w-5 h-5" />,
    items: [
      {
        question: "How do I create an account?",
        answer: "Click 'Sign In' and choose to sign in with Google. It's quick, secure, and you don't need to remember another password. Your Google account email becomes your Inkseries login."
      },
      {
        question: "How is my data protected?",
        answer: "We take privacy seriously. Your reading history and personal data are encrypted and never sold to third parties. Read our full Privacy Policy for detailed information on data handling."
      },
      {
        question: "Can I delete my account?",
        answer: "Yes, you can request account deletion from your Settings page. This will permanently remove your account, reading history, and any saved data. Active subscriptions should be cancelled first."
      },
      {
        question: "How do I update my profile?",
        answer: "Go to Settings to update your display name, bio, notification preferences, and privacy settings. Your profile picture is pulled from your Google account."
      }
    ]
  }
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:text-primary transition-colors"
      >
        <span className="font-medium pr-4">{item.question}</span>
        <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="pb-4 text-muted-foreground leading-relaxed">
          {item.answer}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        {/* Header */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">
              Questions
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about Inkseries. Can't find what you're looking for?{" "}
            <Link to="/contact" className="text-primary hover:underline">Contact us</Link>.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {faqData.map((category, index) => (
              <button
                key={category.title}
                onClick={() => setActiveCategory(index)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === index
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                }`}
              >
                {category.icon}
                <span className="hidden sm:inline">{category.title}</span>
              </button>
            ))}
          </div>

          {/* Active Category Content */}
          <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {faqData[activeCategory].icon}
              </div>
              <h2 className="text-2xl font-bold">{faqData[activeCategory].title}</h2>
            </div>
            
            <div className="divide-y divide-border">
              {faqData[activeCategory].items.map((item, index) => (
                <FAQAccordion key={index} item={item} />
              ))}
            </div>
          </div>

          {/* Still Have Questions */}
          <div className="mt-12 text-center bg-gradient-to-br from-primary/10 to-orange-500/10 rounded-2xl p-8 border border-primary/20">
            <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-4">
              We're here to help. Reach out and we'll get back to you as soon as possible.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
