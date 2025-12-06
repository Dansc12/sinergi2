import { Clock, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AgendaItem {
  id: string;
  title: string;
  time: string;
  type: "workout" | "event" | "class";
  attendees?: { name: string; avatar?: string }[];
}

const agendaItems: AgendaItem[] = [
  {
    id: "1",
    title: "Morning Workout",
    time: "8:00 AM",
    type: "workout",
    attendees: [
      { name: "Mike", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" },
      { name: "Sarah", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" },
    ]
  },
  {
    id: "2",
    title: "Yoga with Coach Emma",
    time: "12:00 PM",
    type: "class",
    attendees: [
      { name: "Alex" },
      { name: "Jordan", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100" },
      { name: "Taylor" },
    ]
  },
  {
    id: "3",
    title: "Pickleball Exhibition",
    time: "5:00 PM",
    type: "event",
    attendees: [
      { name: "Chris", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100" },
    ]
  },
];

const typeStyles = {
  workout: "bg-primary/20 text-primary",
  event: "bg-accent/20 text-accent",
  class: "bg-success/20 text-success",
};

export const AgendaSection = () => {
  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Today's Agenda</h2>
        <button className="text-sm text-primary font-medium">View All</button>
      </div>
      
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
    </section>
  );
};
