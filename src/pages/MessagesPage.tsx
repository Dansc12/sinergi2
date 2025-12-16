import { useState } from "react";
import { Search, MessageCircle, Users, ChevronLeft, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useGroupChats, useGroupChatMessages } from "@/hooks/useGroupChats";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface ConversationProps {
  id: string;
  name: string;
  avatar?: string | null;
  lastMessage?: string;
  lastMessageSender?: string;
  lastMessageType?: string;
  time?: string;
  unread: number;
  isGroup?: boolean;
  onClick: () => void;
}

const Conversation = ({ name, avatar, lastMessage, lastMessageSender, lastMessageType, time, unread, isGroup, onClick }: ConversationProps) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors rounded-xl",
      unread > 0 && "bg-primary/5"
    )}
  >
    <div className="relative">
      <Avatar className="w-12 h-12">
        <AvatarImage src={avatar || undefined} />
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
        <h4 className={cn("font-semibold truncate", unread > 0 && "text-foreground")}>{name}</h4>
        {time && <span className="text-xs text-muted-foreground">{time}</span>}
      </div>
      {lastMessage && (
        <p className={cn(
          "text-sm truncate",
          unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"
        )}>
          {lastMessageType === 'system' ? lastMessage : `${lastMessageSender}: ${lastMessage}`}
        </p>
      )}
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
        Join a group to start chatting with the community about your fitness journey.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-[200px]">
        <Button onClick={() => navigate("/discover")} className="w-full gap-2">
          <Users size={18} />
          Find Groups
        </Button>
      </div>
    </div>
  );
};

interface ChatViewProps {
  groupId: string;
  onBack: () => void;
}

const ChatView = ({ groupId, onBack }: ChatViewProps) => {
  const { messages, members, groupInfo, isLoading, sendMessage } = useGroupChatMessages(groupId);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);

  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  });

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    await sendMessage(newMessage);
    setNewMessage("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Chat Header */}
      <header className="sticky top-0 z-40 glass-elevated px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-muted rounded-lg">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold truncate">{groupInfo?.name}</h1>
            <button 
              onClick={() => setShowMembers(!showMembers)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {members.length} members · tap to view
            </button>
          </div>
        </div>
        
        {/* Members dropdown */}
        {showMembers && (
          <div className="mt-3 p-3 bg-muted rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-2">Members</p>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center gap-2 bg-background rounded-full px-3 py-1">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {member.profile?.first_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{member.profile?.first_name || 'Member'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages yet. Be the first to say hi!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            const isSystem = msg.message_type === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center">
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div key={msg.id} className={cn("flex gap-2", isOwn && "flex-row-reverse")}>
                {!isOwn && (
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={msg.sender?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {msg.sender?.first_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2",
                  isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {!isOwn && (
                    <p className="text-xs font-medium mb-1 opacity-70">
                      {msg.sender?.first_name || 'Member'}
                    </p>
                  )}
                  <p className="text-sm">{msg.content}</p>
                  <p className={cn(
                    "text-[10px] mt-1",
                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 glass-elevated p-4 safe-area-bottom">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-muted border-0 rounded-full py-3 px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button 
            size="icon" 
            className="rounded-full w-12 h-12 shrink-0"
            onClick={handleSend}
            disabled={!newMessage.trim()}
          >
            <Send size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

const MessagesPage = () => {
  const { groupChats, isLoading } = useGroupChats();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = groupChats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedGroupId) {
    return <ChatView groupId={selectedGroupId} onBack={() => setSelectedGroupId(null)} />;
  }

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-muted border-0 rounded-xl py-3 pl-12 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </header>

      {/* Conversations List or Empty State */}
      <div className="px-2 py-2 animate-fade-in">
        {isLoading ? (
          <div className="space-y-2 px-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredChats.length === 0 && !searchQuery ? (
          <EmptyMessagesState />
        ) : filteredChats.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No conversations found</p>
        ) : (
          filteredChats.map((chat) => (
            <Conversation
              key={chat.id}
              id={chat.id}
              name={chat.name}
              avatar={chat.avatar_url}
              lastMessage={chat.lastMessage?.content}
              lastMessageSender={chat.lastMessage?.sender_name}
              lastMessageType={chat.lastMessage?.message_type}
              time={chat.lastMessage ? formatDistanceToNow(new Date(chat.lastMessage.created_at), { addSuffix: true }) : undefined}
              unread={chat.unreadCount}
              isGroup
              onClick={() => setSelectedGroupId(chat.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
