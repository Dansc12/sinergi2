import { Clock, Calendar, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AgendaItem {
  id: string;
  title: string;
  time: string;
  type: "workout" | "event" | "class";
  attendees?: { name: string; avatar?: string }[];
}

const typeStyles = {
  workout: "bg-primary/20 text-primary",
  event: "bg-accent/20 text-accent",
  class: "bg-success/20 text-success",
};

const EmptyAgendaState = () => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-card border border-border rounded-2xl p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
        <Calendar size={24} className="text-primary" />
      </div>
      <h3 className="font-semibold mb-1">No Scheduled Activities</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Create a routine to schedule your workouts
      </p>
      <Button size="sm" variant="outline" onClick={() => navigate("/create/routine")}>
        <Plus size={16} className="mr-1" />
        Create Routine
      </Button>
    </div>
  );
};

export const AgendaSection = () => {
  // Empty array - will be populated from real user routines/events
  const agendaItems: AgendaItem[] = [];

  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Today's Agenda</h2>
        {agendaItems.length > 0 && (
          <button className="text-sm text-primary font-medium">View All</button>
        )}
      </div>
      
      {agendaItems.length === 0 ? (
        <EmptyAgendaState />
      ) : (
        <div className="space-y-3">
          {agendaItems.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-border rounded-2xl p-4 shadow-card flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${typeStyles[item.type]}`}>
                <Clock size={20} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.time}</p>
              </div>

              {item.attendees && item.attendees.length > 0 && (
                <div className="flex items-center">
                  <div className="flex -space-x-2">
                    {item.attendees.slice(0, 3).map((attendee, i) => (
                      <Avatar key={i} className="w-7 h-7 border-2 border-card">
                        <AvatarImage src={attendee.avatar} />
                        <AvatarFallback className="text-xs bg-muted">
                          {attendee.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  {item.attendees.length > 3 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      +{item.attendees.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
