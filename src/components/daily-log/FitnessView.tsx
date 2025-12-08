import { useState } from "react";
import { Footprints, Clock, Dumbbell, Check, ChevronRight } from "lucide-react";

interface WorkoutItemProps {
  title: string;
  time: string;
  duration: string;
  exercises: number;
  completed: boolean;
}

const WorkoutItem = ({ title, time, duration, exercises, completed }: WorkoutItemProps) => (
  <div className={`bg-card border rounded-xl p-4 ${completed ? 'border-success/50' : 'border-border'}`}>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold flex items-center gap-2">
          {title}
          {completed && (
            <span className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
              <Check size={12} className="text-primary-foreground" />
            </span>
          )}
        </h4>
        <span className="text-sm text-muted-foreground">{time}</span>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full ${completed ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
        {completed ? 'Completed' : 'Scheduled'}
      </span>
    </div>
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <span className="flex items-center gap-1">
        <Clock size={14} />
        {duration}
      </span>
      <span className="flex items-center gap-1">
        <Dumbbell size={14} />
        {exercises} exercises
      </span>
    </div>
  </div>
);

interface FitnessViewProps {
  selectedDate?: Date;
}

export const FitnessView = ({ selectedDate }: FitnessViewProps) => {
  const [showAllWorkouts, setShowAllWorkouts] = useState(false);
  
  const steps = 7842;
  const stepsGoal = 10000;
  const stepsLeft = stepsGoal - steps;

  // Sample workouts - in real app, this would come from database
  const workouts = [
    { title: "Morning HIIT", time: "8:00 AM", duration: "30 min", exercises: 8, completed: true },
    { title: "Upper Body Strength", time: "5:00 PM", duration: "45 min", exercises: 6, completed: false },
    { title: "Evening Cardio", time: "7:00 PM", duration: "20 min", exercises: 4, completed: false },
    { title: "Core Workout", time: "8:30 PM", duration: "15 min", exercises: 5, completed: false },
  ];

  const displayedWorkouts = showAllWorkouts ? workouts : workouts.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Steps Progress - No Frame */}
      <div className="text-center">
        <div className="relative w-40 h-40 mx-auto mb-4">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              strokeWidth="14"
              stroke="hsl(var(--muted))"
              fill="none"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              strokeWidth="14"
              stroke="url(#stepsGradient)"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${(steps / stepsGoal) * 440} 440`}
            />
            <defs>
              <linearGradient id="stepsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(270, 91%, 65%)" />
                <stop offset="100%" stopColor="hsl(320, 100%, 60%)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Footprints className="text-primary mb-1" size={24} />
            <span className="text-3xl font-bold">{steps.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">{stepsLeft.toLocaleString()} to go</span>
          </div>
        </div>
      </div>

      {/* Scheduled Workouts */}
      <div>
        <h3 className="font-semibold mb-3">Scheduled Workouts</h3>
        <div className="space-y-3">
          {displayedWorkouts.map((workout, index) => (
            <WorkoutItem 
              key={index}
              title={workout.title}
              time={workout.time}
              duration={workout.duration}
              exercises={workout.exercises}
              completed={workout.completed}
            />
          ))}
        </div>
        
        {workouts.length > 3 && (
          <button
            onClick={() => setShowAllWorkouts(!showAllWorkouts)}
            className="w-full mt-3 py-2 text-sm text-primary flex items-center justify-center gap-1 hover:opacity-80 transition-opacity"
          >
            {showAllWorkouts ? 'Show Less' : `View All ${workouts.length} Workouts`}
            <ChevronRight size={16} className={`transition-transform ${showAllWorkouts ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
};
