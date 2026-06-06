import { useState, useEffect } from "react";
import Navbar from "@/react-app/components/Navbar";
import Footer from "@/react-app/components/Footer";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent } from "@/react-app/components/ui/card";
import { Link } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { Calendar, Video, Mic, Play, Sparkles, Radio, Bell, BellOff, Clock, MapPin, ExternalLink, Loader as Loader2 } from "lucide-react";

interface Event {
  id: number;
  title: string;
  description: string;
  event_type: string;
  cover_image_url: string | null;
  novel_id: number | null;
  novel_title: string | null;
  novel_slug: string | null;
  starts_at: string;
  ends_at: string | null;
  is_live: boolean;
  external_link: string | null;
}

const EVENT_TYPE_CONFIG: Record<string, { icon: React.ReactNode; gradient: string; label: string }> = {
  ama: { icon: <Mic className="w-5 h-5" />, gradient: "from-purple-500 to-pink-500", label: "Author AMA" },
  live_reading: { icon: <Play className="w-5 h-5" />, gradient: "from-amber-500 to-orange-500", label: "Live Reading" },
  watch_party: { icon: <Video className="w-5 h-5" />, gradient: "from-blue-500 to-cyan-500", label: "Watch Party" },
  character_reveal: { icon: <Sparkles className="w-5 h-5" />, gradient: "from-green-500 to-emerald-500", label: "Character Reveal" },
  premiere: { icon: <Radio className="w-5 h-5" />, gradient: "from-red-500 to-rose-500", label: "Episode Premiere" },
  workshop: { icon: <Calendar className="w-5 h-5" />, gradient: "from-indigo-500 to-violet-500", label: "Writing Workshop" },
};

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [reminders, setReminders] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingReminder, setTogglingReminder] = useState<number | null>(null);

  useEffect(() => {
    fetchEvents();
    if (user) fetchReminders();
  }, [user]);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (e) {
      console.error("Failed to fetch events", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchReminders = async () => {
    try {
      const res = await fetch("/api/events/reminders", { credentials: "include" });
      const data = await res.json();
      setReminders(data.reminders || []);
    } catch (e) {
      console.error("Failed to fetch reminders", e);
    }
  };

  const toggleReminder = async (eventId: number) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    
    setTogglingReminder(eventId);
    const hasReminder = reminders.includes(eventId);
    
    try {
      const res = await fetch(`/api/events/${eventId}/remind`, {
        method: hasReminder ? "DELETE" : "POST",
        credentials: "include",
      });
      
      if (res.ok) {
        setReminders(prev => 
          hasReminder ? prev.filter(id => id !== eventId) : [...prev, eventId]
        );
      }
    } catch (e) {
      console.error("Failed to toggle reminder", e);
    } finally {
      setTogglingReminder(null);
    }
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-NG", { 
      weekday: "short", 
      month: "short", 
      day: "numeric",
      year: "numeric"
    });
  };

  const formatEventTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-NG", { 
      hour: "numeric", 
      minute: "2-digit",
      hour12: true 
    });
  };

  const getTimeUntil = (dateStr: string) => {
    const now = new Date();
    const eventDate = new Date(dateStr);
    const diff = eventDate.getTime() - now.getTime();
    
    if (diff < 0) return "Started";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}m`;
  };

  const upcomingEvents = events.filter(e => new Date(e.starts_at) > new Date());
  const liveEvents = events.filter(e => e.is_live);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-orange-500/5" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight font-display">
              Live Events
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Author AMAs, live readings, watch parties, and exclusive episode premieres
            </p>
          </div>
        </div>
      </section>

      {/* Live Now Section */}
      {liveEvents.length > 0 && (
        <section className="py-8 bg-red-500/10 border-y border-red-500/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-6">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <h2 className="text-xl font-bold text-red-400">Live Now</h2>
            </div>
            <div className="grid gap-4">
              {liveEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  hasReminder={reminders.includes(event.id)}
                  onToggleReminder={() => toggleReminder(event.id)}
                  isToggling={togglingReminder === event.id}
                  formatDate={formatEventDate}
                  formatTime={formatEventTime}
                  getTimeUntil={getTimeUntil}
                  isLive
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Upcoming Events</h2>
          
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid gap-4 md:gap-6">
              {upcomingEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  hasReminder={reminders.includes(event.id)}
                  onToggleReminder={() => toggleReminder(event.id)}
                  isToggling={togglingReminder === event.id}
                  formatDate={formatEventDate}
                  formatTime={formatEventTime}
                  getTimeUntil={getTimeUntil}
                />
              ))}
            </div>
          ) : (
            <NoEventsPlaceholder />
          )}
        </div>
      </section>

      {/* Event Types Info */}
      <section className="py-16 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-display">
              What to Expect
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From intimate author readings to massive watch parties
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
              <Card key={key} className="bg-card/50 border-border/50">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white mb-4`}>
                    {config.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{config.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {getEventTypeDescription(key)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function EventCard({ 
  event, 
  hasReminder, 
  onToggleReminder, 
  isToggling,
  formatDate,
  formatTime,
  getTimeUntil,
  isLive = false
}: { 
  event: Event;
  hasReminder: boolean;
  onToggleReminder: () => void;
  isToggling: boolean;
  formatDate: (d: string) => string;
  formatTime: (d: string) => string;
  getTimeUntil: (d: string) => string;
  isLive?: boolean;
}) {
  const config = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.ama;
  const timeUntil = getTimeUntil(event.starts_at);
  
  return (
    <Card className={`overflow-hidden transition-all ${isLive ? 'border-red-500/50 bg-red-500/5' : 'bg-card/50 border-border/50 hover:border-primary/30'}`}>
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Cover Image */}
          {event.cover_image_url && (
            <div className="md:w-48 h-32 md:h-auto flex-shrink-0">
              <img 
                src={event.cover_image_url} 
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 p-4 md:p-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${config.gradient} text-white`}>
                {config.icon}
                {config.label}
              </span>
              {isLive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500 text-white animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  LIVE
                </span>
              )}
              {!isLive && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeUntil}
                </span>
              )}
            </div>
            
            <h3 className="text-lg md:text-xl font-bold mb-2">{event.title}</h3>
            
            {event.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(event.starts_at)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {formatTime(event.starts_at)}
              </span>
              {event.novel_title && (
                <Link 
                  to={`/novel/${event.novel_slug}`}
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <MapPin className="w-4 h-4" />
                  {event.novel_title}
                </Link>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3">
              {isLive && event.external_link ? (
                <Button asChild className="gap-2">
                  <a href={event.external_link} target="_blank" rel="noopener noreferrer">
                    <Play className="w-4 h-4" />
                    Join Now
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              ) : (
                <Button
                  variant={hasReminder ? "outline" : "default"}
                  onClick={onToggleReminder}
                  disabled={isToggling}
                  className="gap-2"
                >
                  {isToggling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : hasReminder ? (
                    <BellOff className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                  {hasReminder ? "Cancel Reminder" : "Set Reminder"}
                </Button>
              )}
              {event.external_link && !isLive && (
                <Button variant="ghost" asChild className="gap-2">
                  <a href={event.external_link} target="_blank" rel="noopener noreferrer">
                    Event Link
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NoEventsPlaceholder() {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
        <Calendar className="w-10 h-10 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No Upcoming Events</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        We're cooking up something exciting! Check back soon for author AMAs, live readings, and more.
      </p>
      <Button variant="outline" asChild>
        <Link to="/explore">Explore Stories</Link>
      </Button>
    </div>
  );
}

function getEventTypeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    ama: "Direct Q&A sessions with your favorite authors. Ask about characters, plot decisions, and writing process.",
    live_reading: "Authors read episodes aloud with atmospheric sound design. Experience stories in a whole new way.",
    watch_party: "Read new episodes together with the community. Live reactions, commentary, and shared excitement.",
    character_reveal: "Be the first to meet new characters, learn backstories, and discover plot twists live.",
    premiere: "Special live releases of highly anticipated episodes with author commentary.",
    workshop: "Learn craft techniques from published Inkseries authors. Interactive exercises included.",
  };
  return descriptions[type] || "";
}
