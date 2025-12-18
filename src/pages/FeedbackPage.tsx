import { useState } from "react";
import { ArrowLeft, ChevronUp, Send, Trash2, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFeedback } from "@/hooks/useFeedback";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FeedbackPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, isLoading, addMessage, toggleUpvote, deleteMessage } = useFeedback();
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newMessage.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addMessage(newMessage.trim());
      setNewMessage("");
      toast.success("Feedback submitted!");
    } catch (error) {
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (feedbackId: string) => {
    try {
      await toggleUpvote(feedbackId);
    } catch (error) {
      toast.error("Failed to update vote");
    }
  };

  const handleDelete = async (feedbackId: string) => {
    try {
      await deleteMessage(feedbackId);
      toast.success("Feedback deleted");
    } catch (error) {
      toast.error("Failed to delete feedback");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-elevated px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Community Feedback</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* New Message Input */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground">Share your feedback</h2>
          <Textarea
            placeholder="What would you like to see improved? Share your ideas, suggestions, or feedback..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="min-h-[100px] resize-none"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{newMessage.length}/500</span>
            <Button 
              onClick={handleSubmit} 
              disabled={!newMessage.trim() || isSubmitting}
              size="sm"
              className="gap-2"
            >
              <Send size={16} />
              Submit
            </Button>
          </div>
        </div>

        {/* Messages List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground text-sm">Loading feedback...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare size={32} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No feedback yet</h3>
              <p className="text-muted-foreground text-sm">
                Be the first to share your thoughts and suggestions!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className="bg-card border border-border rounded-xl p-4 space-y-3"
              >
                {/* Author info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {message.profile?.first_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {message.profile?.first_name || "Anonymous"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Delete button (only for own messages) */}
                  {user?.id === message.user_id && (
                    <button
                      onClick={() => handleDelete(message.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Message content */}
                <p className="text-sm leading-relaxed">{message.content}</p>

                {/* Upvote button */}
                <div className="flex items-center pt-2 border-t border-border">
                  <button
                    onClick={() => handleUpvote(message.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      message.has_upvoted
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <ChevronUp size={18} />
                    <span>{message.upvote_count}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
