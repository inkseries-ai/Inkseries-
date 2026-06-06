// Data for polls feature

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  novelId: string;
  novelTitle: string;
  novelCover: string;
  authorName: string;
  authorAvatar: string;
  question: string;
  context: string;
  options: PollOption[];
  totalVotes: number;
  endsAt: string;
  isActive: boolean;
  chapterReference?: string;
  isSpoiler: boolean;
}

export const polls: Poll[] = [
  {
    id: "1",
    novelId: "1",
    novelTitle: "Daughters of the Delta",
    novelCover: "https://images.unsplash.com/photo-1516914589923-f105f1535f88?w=400&h=600&fit=crop",
    authorName: "Amara Okonkwo",
    authorAvatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop",
    question: "Should Chidinma reveal the family secret to her sisters?",
    context: "After discovering the hidden documents in Episode 47, Chidinma faces a crucial decision. The truth could unite them... or tear the family apart forever.",
    options: [
      { id: "1a", text: "Yes - The sisters deserve to know the truth", votes: 3421 },
      { id: "1b", text: "No - Some secrets should stay buried", votes: 1876 },
      { id: "1c", text: "Reveal it to only Adaeze (the eldest)", votes: 2103 },
    ],
    totalVotes: 7400,
    endsAt: "2024-02-15T23:59:59Z",
    isActive: true,
    chapterReference: "Episode 47",
    isSpoiler: true,
  },
  {
    id: "2",
    novelId: "8",
    novelTitle: "Love & Jollof",
    novelCover: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=600&fit=crop",
    authorName: "Temi Adebayo",
    authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    question: "Which cuisine should win the Season 1 finale challenge?",
    context: "The ultimate showdown approaches! Nigerian jollof vs Ghanaian jollof in the grand finale. Your vote will influence the story's direction!",
    options: [
      { id: "2a", text: "Nigerian Jollof wins 🇳🇬", votes: 8923 },
      { id: "2b", text: "Ghanaian Jollof wins 🇬🇭", votes: 8456 },
      { id: "2c", text: "Plot twist: It's a tie!", votes: 2341 },
    ],
    totalVotes: 19720,
    endsAt: "2024-02-12T23:59:59Z",
    isActive: true,
    chapterReference: "Episode 20 Preview",
    isSpoiler: false,
  },
  {
    id: "3",
    novelId: "4",
    novelTitle: "Second Chance in Accra",
    novelCover: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=600&fit=crop",
    authorName: "Kwame Asante",
    authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    question: "Where should Ama and Kofi have their first date?",
    context: "After the emotional airport reunion, our couple is finally ready to reconnect. Help choose the perfect Accra location for their fresh start.",
    options: [
      { id: "3a", text: "Labadi Beach at sunset", votes: 4521 },
      { id: "3b", text: "Rooftop restaurant in Osu", votes: 3234 },
      { id: "3c", text: "A nostalgic walk at Legon campus", votes: 5678 },
      { id: "3d", text: "Traditional chop bar in Jamestown", votes: 2109 },
    ],
    totalVotes: 15542,
    endsAt: "2024-02-10T23:59:59Z",
    isActive: true,
    chapterReference: "Episode 29 Preview",
    isSpoiler: false,
  },
  {
    id: "4",
    novelId: "2",
    novelTitle: "The Lagos Hustle",
    novelCover: "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=400&h=600&fit=crop",
    authorName: "Chidi Mensah",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    question: "Should Emeka trust the mysterious investor?",
    context: "A shadowy billionaire offers to fund Emeka's fintech dreams, but something feels off. In Lagos, every deal has a price...",
    options: [
      { id: "4a", text: "Take the deal - Risk it for the biscuit", votes: 2890 },
      { id: "4b", text: "Decline - Trust your instincts", votes: 4567 },
      { id: "4c", text: "Investigate the investor first", votes: 6234 },
    ],
    totalVotes: 13691,
    endsAt: "2024-02-08T23:59:59Z",
    isActive: true,
    chapterReference: "Episode 33 Preview",
    isSpoiler: true,
  },
  {
    id: "5",
    novelId: "10",
    novelTitle: "Bound by Blood",
    novelCover: "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=400&h=600&fit=crop",
    authorName: "Adaeze Eze",
    authorAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop",
    question: "Which twin should claim the throne?",
    context: "The prophecy speaks of one ruler, but both twins have proven worthy. The kingdom holds its breath as fate hangs in the balance.",
    options: [
      { id: "5a", text: "Adanna (raised in royalty)", votes: 5678 },
      { id: "5b", text: "Chiamaka (raised in poverty)", votes: 7234 },
      { id: "5c", text: "They should rule together", votes: 8901 },
    ],
    totalVotes: 21813,
    endsAt: "2024-02-20T23:59:59Z",
    isActive: true,
    chapterReference: "Episode 56 Preview",
    isSpoiler: true,
  },
  {
    id: "6",
    novelId: "5",
    novelTitle: "The Night Market",
    novelCover: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    authorName: "Folake Balogun",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    question: "What should Morenike trade for her lost memories?",
    context: "The spirits have named their price, but each option carries a terrible cost. What would you sacrifice to remember who you truly are?",
    options: [
      { id: "6a", text: "Her ability to dream", votes: 1234 },
      { id: "6b", text: "Five years of her future", votes: 2345 },
      { id: "6c", text: "Her mother's memories of her", votes: 3456 },
      { id: "6d", text: "Refuse the deal entirely", votes: 1890 },
    ],
    totalVotes: 8925,
    endsAt: "2024-02-18T23:59:59Z",
    isActive: true,
    chapterReference: "Episode 9 Preview",
    isSpoiler: false,
  },
];

export const completedPolls: Poll[] = [
  {
    id: "c1",
    novelId: "3",
    novelTitle: "Kingdom of Whispers",
    novelCover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=600&fit=crop",
    authorName: "Zainab Adeyemi",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    question: "How should Amina defeat the Shadow King?",
    context: "The final battle approaches. Readers chose and the author delivered an epic conclusion!",
    options: [
      { id: "c1a", text: "Unite the ancestral spirits", votes: 12453 },
      { id: "c1b", text: "Sacrifice her powers", votes: 8234 },
      { id: "c1c", text: "Forge an alliance with the spirits of the dead", votes: 15678 },
    ],
    totalVotes: 36365,
    endsAt: "2024-01-15T23:59:59Z",
    isActive: false,
    chapterReference: "Episode 75",
    isSpoiler: true,
  },
  {
    id: "c2",
    novelId: "11",
    novelTitle: "The Pretender's Wife",
    novelCover: "https://images.unsplash.com/photo-1529232356377-57971f020a94?w=400&h=600&fit=crop",
    authorName: "Ngozi Obi",
    authorAvatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
    question: "Should Adaora forgive Chukwuemeka's deception?",
    context: "After the truth came out, readers voted and shaped the story's emotional climax.",
    options: [
      { id: "c2a", text: "Yes - Love conquers all", votes: 23456 },
      { id: "c2b", text: "No - Some betrayals are unforgivable", votes: 12345 },
    ],
    totalVotes: 35801,
    endsAt: "2024-01-20T23:59:59Z",
    isActive: false,
    chapterReference: "Episode 60",
    isSpoiler: true,
  },
];

export function getTimeRemaining(endsAt: string): string {
  const end = new Date(endsAt);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;

  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes}m left`;
}

export function getWinningOption(poll: Poll): PollOption | null {
  if (poll.options.length === 0) return null;
  return poll.options.reduce((a, b) => (a.votes > b.votes ? a : b));
}

export function getVotePercentage(votes: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((votes / total) * 100);
}
