import { Search, MessageCircle, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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

const EmptyMessagesState = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <MessageCircle size={40} className="text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No Messages Yet</h3>
      <p className="text-muted-foreground mb-6 max-w-[280px]">
        Connect with friends and groups to start conversations about your fitness journey.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-[200px]">
        <Button onClick={() => navigate("/discover")} className="w-full gap-2">
          <Users size={18} />
          Find Friends
        </Button>
        <Button variant="outline" onClick={() => navigate("/create/group")} className="w-full">
          Create a Group
        </Button>
      </div>
    </div>
  );
};

const MessagesPage = () => {
  // Empty array - no dummy conversations
  const conversations: ConversationProps[] = [];

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

      {/* Conversations List or Empty State */}
      <div className="px-2 py-2 animate-fade-in">
        {conversations.length === 0 ? (
          <EmptyMessagesState />
        ) : (
          conversations.map((conv, index) => (
            <Conversation key={index} {...conv} />
          ))
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
