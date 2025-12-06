import { Footprints, Flame, Clock, Dumbbell, Check } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}

const StatCard = ({ icon, value, label, color }: StatCardProps) => (
  <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <p className="font-bold text-lg">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </div>
);

interface WorkoutItemProps {
  title: string;
  time: string;
  duration: string;
  exercises: number;
  completed: boolean;
}

const WorkoutItem = ({ title, time, duration, exercises, completed }: WorkoutItemProps) => (
  <div className={`bg-card border rounded-xl p-4 ${completed ? 'border-success/50' : 'border-border'}`}>
    <div className="flex items-start justify-between mb-2">
      <div>
        <h4 className="font-semibold flex items-center gap-2">
          {title}
          {completed && (
            <span className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
              <Check size={12} className="text-primary-foreground" />
            </span>
          )}
        </h4>
        <p className="text-sm text-muted-foreground">{time}</p>
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

export const FitnessView = () => {
  const steps = 7842;
  const stepsGoal = 10000;
  const stepsLeft = stepsGoal - steps;

  return (
    <div className="space-y-6">
      {/* Steps Progress */}
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
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

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          icon={<Flame className="text-streak" size={20} />}
          value="486"
          label="Calories burned"
          color="bg-streak/20"
        />
        <StatCard 
          icon={<Clock className="text-primary" size={20} />}
          value="45 min"
          label="Active time"
          color="bg-primary/20"
        />
      </div>

      {/* Today's Workouts */}
      <div>
        <h3 className="font-semibold mb-3">Today's Workouts</h3>
        <div className="space-y-3">
          <WorkoutItem 
            title="Morning HIIT"
            time="8:00 AM"
            duration="30 min"
            exercises={8}
            completed={true}
          />
          <WorkoutItem 
            title="Upper Body Strength"
            time="5:00 PM"
            duration="45 min"
            exercises={6}
            completed={false}
          />
        </div>
      </div>
    </div>
  );
};
