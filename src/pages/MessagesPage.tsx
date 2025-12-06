import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ConversationProps {
  name: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  unread: number;
  isGroup?: boolean;
}

const Conversation = ({ name, avatar, lastMessage, time, unread, isGroup }: ConversationProps) => (
  <button className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors rounded-xl">
    <div className="relative">
      <Avatar className="w-12 h-12">
        <AvatarImage src={avatar} />
        <AvatarFallback className={isGroup ? "bg-primary/20 text-primary" : "bg-muted"}>
          {name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      {isGroup && (
        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
          <span className="text-[10px] text-primary-foreground font-bold">G</span>
        </span>
      )}
    </div>
    
    <div className="flex-1 min-w-0 text-left">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold truncate">{name}</h4>
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>
      <p className="text-sm text-muted-foreground truncate">{lastMessage}</p>
    </div>

    {unread > 0 && (
      <span className="min-w-[20px] h-5 px-1.5 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
        {unread}
      </span>
    )}
  </button>
);

const MessagesPage = () => {
  const conversations = [
    {
      name: "Powerlifting Squad",
      avatar: undefined,
      lastMessage: "Mike: Just hit a new PR! 💪",
      time: "2m",
      unread: 3,
      isGroup: true
    },
    {
      name: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
      lastMessage: "Great workout today! See you tomorrow?",
      time: "15m",
      unread: 1,
      isGroup: false
    },
    {
      name: "Coach Emma",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
      lastMessage: "Your form is looking much better!",
      time: "1h",
      unread: 0,
      isGroup: false
    },
    {
      name: "Morning Yoga Group",
      avatar: undefined,
      lastMessage: "Tomorrow's session starts at 6 AM",
      time: "3h",
      unread: 0,
      isGroup: true
    },
    {
      name: "Alex Rivera",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100",
      lastMessage: "Thanks for the deadlift tips!",
      time: "1d",
      unread: 0,
      isGroup: false
    },
    {
      name: "Running Club",
      avatar: undefined,
      lastMessage: "5K run this Saturday at Central Park",
      time: "2d",
      unread: 0,
      isGroup: true
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-elevated px-4 py-4">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full bg-muted border-0 rounded-xl py-3 pl-12 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </header>

      {/* Conversations List */}
      <div className="px-2 py-2 animate-fade-in">
        {conversations.map((conv, index) => (
          <Conversation key={index} {...conv} />
        ))}
      </div>
    </div>
  );
};

export default MessagesPage;
