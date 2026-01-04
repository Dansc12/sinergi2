import { useState } from "react";
import { NutritionView } from "@/components/daily-log/NutritionView";
import { FitnessView } from "@/components/daily-log/FitnessView";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, isToday, isYesterday, isTomorrow } from "date-fns";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useCalendarActivityDots } from "@/hooks/useCalendarActivityDots";

type TabType = "nutrition" | "fitness";

const DailyLogPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>("nutrition");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [direction, setDirection] = useState(0);
  const [tabDirection, setTabDirection] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [displayedMonth, setDisplayedMonth] = useState<Date>(new Date());
  
  const { activityData } = useCalendarActivityDots(displayedMonth);

  const goToPreviousDay = () => {
    setDirection(-1);
    setSelectedDate(prev => subDays(prev, 1));
  };

  const goToNextDay = () => {
    setDirection(1);
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleTabSwipe = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold && activeTab === "fitness") {
      setTabDirection(-1);
      setActiveTab("nutrition");
    } else if (info.offset.x < -swipeThreshold && activeTab === "nutrition") {
      setTabDirection(1);
      setActiveTab("fitness");
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setDirection(date > selectedDate ? 1 : -1);
      setSelectedDate(date);
      setCalendarOpen(false);
    }
  };

  const getDateLabel = (date: Date): string => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border/30 px-4 py-2">
        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={goToPreviousDay}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button className="hover:bg-muted/50 px-3 py-1 rounded-lg transition-colors">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.span
                    key={selectedDate.toISOString()}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium"
                  >
                    {getDateLabel(selectedDate)}
                  </motion.span>
                </AnimatePresence>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                month={displayedMonth}
                onMonthChange={setDisplayedMonth}
                initialFocus
                className="p-3 pointer-events-auto"
                classNames={{
                  day_today: "text-primary font-bold",
                  day_selected: "bg-primary text-primary-foreground rounded-full hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                }}
                components={{
                  DayContent: ({ date }) => {
                    const dateStr = format(date, "yyyy-MM-dd");
                    const activity = activityData[dateStr];
                    const isCurrentDay = isToday(date);
                    const isSelected = selectedDate.toDateString() === date.toDateString();
                    return (
                      <div className="flex flex-col items-center">
                        <span className={isCurrentDay && !isSelected ? "text-[#B46BFF] font-bold" : ""}>{date.getDate()}</span>
                        <div className="flex gap-0.5 h-1.5 mt-0.5">
                          {activity?.hasWorkout && (
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#B46BFF" }} />
                          )}
                          {activity?.hasMeal && (
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#3DD6C6" }} />
                          )}
                        </div>
                      </div>
                    );
                  },
                }}
              />
            </PopoverContent>
          </Popover>
          
          <button
            onClick={goToNextDay}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Segmented Control */}
        <div className="flex -mt-1">
          <button
            onClick={() => {
              if (activeTab !== "nutrition") {
                setTabDirection(-1);
                setActiveTab("nutrition");
              }
            }}
            className={cn(
              "relative flex-1 py-2 px-4 text-sm font-medium transition-all duration-200",
              activeTab === "nutrition"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="relative z-10">
              Nutrition
            </span>
            {activeTab === "nutrition" && (
              <>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-20 h-5 bg-primary/50 blur-lg rounded-full" />
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-14 h-2 bg-primary/60 blur-sm rounded-full" />
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-px bg-border/60 rounded-full" />
              </>
            )}
          </button>
          <button
            onClick={() => {
              if (activeTab !== "fitness") {
                setTabDirection(1);
                setActiveTab("fitness");
              }
            }}
            className={cn(
              "relative flex-1 py-2 px-4 text-sm font-medium transition-all duration-200",
              activeTab === "fitness"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="relative z-10">
              Fitness
            </span>
            {activeTab === "fitness" && (
              <>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-20 h-5 bg-primary/50 blur-lg rounded-full" />
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-14 h-2 bg-primary/60 blur-sm rounded-full" />
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-px bg-border/60 rounded-full" />
              </>
            )}
          </button>
        </div>
      </header>

      {/* Content with swipe between tabs */}
      <motion.div
        className="px-4 py-4"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleTabSwipe}
      >
        <AnimatePresence mode="wait" custom={tabDirection}>
          <motion.div
            key={`${selectedDate.toISOString()}-${activeTab}`}
            custom={tabDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25 }}
          >
            {activeTab === "nutrition" ? (
              <NutritionView selectedDate={selectedDate} />
            ) : (
              <FitnessView selectedDate={selectedDate} />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default DailyLogPage;
