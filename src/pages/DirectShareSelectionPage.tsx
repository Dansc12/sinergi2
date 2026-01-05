import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface GroupItem {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface FriendItem {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  username: string | null;
}

interface LocationState {
  shareState: Record<string, unknown>;
  selectedGroups?: string[];
  selectedUsers?: string[];
}

const DirectShareSelectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>(state?.selectedGroups || []);
  const [selectedUsers, setSelectedUsers] = useState<string[]>(state?.selectedUsers || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch groups user is a member of
        const { data: memberships } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", user.id);

        if (memberships && memberships.length > 0) {
          const groupIds = memberships.map(m => m.group_id);
          const { data: groupsData } = await supabase
            .from("groups")
            .select("id, name, avatar_url")
            .in("id", groupIds);
          setGroups(groupsData || []);
        }

        // Fetch friends (accepted friendships)
        const { data: friendships } = await supabase
          .from("friendships")
          .select("requester_id, addressee_id")
          .eq("status", "accepted")
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

        if (friendships && friendships.length > 0) {
          const friendIds = friendships.map(f => 
            f.requester_id === user.id ? f.addressee_id : f.requester_id
          );

          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, first_name, last_name, avatar_url, username")
            .in("user_id", friendIds);

          setFriends(profiles || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleFinish = () => {
    navigate("/share", {
      state: {
        ...state?.shareState,
        directShareGroups: selectedGroups,
        directShareUsers: selectedUsers,
        directShareGroupNames: groups.filter(g => selectedGroups.includes(g.id)).map(g => g.name),
        directShareUserNames: friends.filter(f => selectedUsers.includes(f.user_id)).map(f => f.first_name || "User"),
      },
    });
  };

  const handleBack = () => {
    // Discard changes and go back with original selections
    navigate("/share", {
      state: {
        ...state?.shareState,
        directShareGroups: state?.selectedGroups || [],
        directShareUsers: state?.selectedUsers || [],
        directShareGroupNames: groups.filter(g => (state?.selectedGroups || []).includes(g.id)).map(g => g.name),
        directShareUserNames: friends.filter(f => (state?.selectedUsers || []).includes(f.user_id)).map(f => f.first_name || "User"),
      },
    });
  };

  const totalSelected = selectedGroups.length + selectedUsers.length;

  // Filter based on search - strip @ from username searches
  const searchTerm = searchQuery.toLowerCase();
  const usernameSearch = searchTerm.startsWith("@") ? searchTerm.slice(1) : searchTerm;
  
  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm)
  );
  const filteredFriends = friends.filter(f => 
    (f.first_name?.toLowerCase().includes(searchTerm)) ||
    (f.username?.toLowerCase().includes(usernameSearch))
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background">
        {/* Title Row */}
        <div className="flex items-center justify-between p-4 pb-2">
          <button onClick={handleBack} className="p-2 -ml-2">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold">Share With</h1>
          <Button 
            onClick={handleFinish}
            size="sm"
            className="glow-primary"
          >
            Done {totalSelected > 0 && `(${totalSelected})`}
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <Input
            placeholder="Search groups and friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-card"
          />
        </div>
        <div className="h-px bg-border/30" />
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ScrollArea className="flex-1">
          {/* Groups Section */}
          {filteredGroups.length > 0 && (
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Groups</span>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {filteredGroups.map((group) => {
                  const isSelected = selectedGroups.includes(group.id);
                  return (
                    <motion.button
                      key={group.id}
                      onClick={() => toggleGroup(group.id)}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center gap-2 flex-shrink-0"
                    >
                      <div className="relative">
                        <div className={`w-40 h-40 rounded-xl overflow-hidden border-2 transition-colors ${isSelected ? "border-primary" : "border-border"}`}>
                          {group.avatar_url ? (
                            <img 
                              src={group.avatar_url} 
                              alt={group.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                              <span className="text-lg font-semibold text-primary">
                                {group.name.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                          >
                            <Check size={14} className="text-primary-foreground" />
                          </motion.div>
                        )}
                      </div>
                      <span className="text-xs text-center max-w-40 truncate font-medium">
                        {group.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Divider */}
          {filteredGroups.length > 0 && filteredFriends.length > 0 && (
            <div className="h-px bg-border/30 mx-4 my-2" />
          )}

          {/* Friends Section */}
          {filteredFriends.length > 0 && (
            <div className="px-4 pb-24">
              <div className="flex items-center gap-2 mb-3">
                <User size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Friends</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {filteredFriends.map((friend) => {
                  const isSelected = selectedUsers.includes(friend.user_id);
                  return (
                    <motion.button
                      key={friend.user_id}
                      onClick={() => toggleUser(friend.user_id)}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="relative w-full flex justify-center">
                        <Avatar className={`w-full aspect-square h-auto border-2 transition-colors ${isSelected ? "border-primary" : "border-transparent"}`}>
                          <AvatarImage src={friend.avatar_url || undefined} />
                          <AvatarFallback className="bg-muted text-2xl">
                            {(friend.first_name || "U").slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                          >
                            <Check size={14} className="text-primary-foreground" />
                          </motion.div>
                        )}
                      </div>
                      <div className="w-full overflow-hidden">
                        <p className="text-xs text-center whitespace-nowrap overflow-hidden" style={{ maskImage: 'linear-gradient(to right, black 80%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black 80%, transparent 100%)' }}>
                          <span className="font-medium">{friend.first_name || "User"}</span>
                          {friend.username && (
                            <span className="text-muted-foreground"> • @{friend.username}</span>
                          )}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredGroups.length === 0 && filteredFriends.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <Users size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No groups or friends yet</h3>
              <p className="text-sm text-muted-foreground">
                Join groups and add friends to share directly with them
              </p>
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
};

export default DirectShareSelectionPage;
