import { useState, useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TimePickerPopoverProps {
  value: number; // value in minutes
  onChange: (minutes: number) => void;
  placeholder?: string;
  className?: string;
}

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);

export const TimePickerPopover = ({
  value,
  onChange,
  placeholder = "Select Time",
  className,
}: TimePickerPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHours, setSelectedHours] = useState(Math.floor(value / 60));
  const [selectedMinutes, setSelectedMinutes] = useState(value % 60);
  
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);

  // Sync internal state when value prop changes
  useEffect(() => {
    setSelectedHours(Math.floor(value / 60));
    setSelectedMinutes(value % 60);
  }, [value]);

  // Scroll to selected values when popover opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToSelected(hoursRef, selectedHours);
        scrollToSelected(minutesRef, selectedMinutes);
      }, 50);
    }
  }, [isOpen, selectedHours, selectedMinutes]);

  const scrollToSelected = (ref: React.RefObject<HTMLDivElement>, value: number) => {
    if (ref.current) {
      const itemHeight = 44; // Height of each item
      const scrollTop = value * itemHeight;
      ref.current.scrollTo({ top: scrollTop, behavior: "instant" });
    }
  };

  const handleScroll = (ref: React.RefObject<HTMLDivElement>, setter: (val: number) => void, items: number[]) => {
    if (ref.current) {
      const itemHeight = 44;
      const scrollTop = ref.current.scrollTop;
      const selectedIndex = Math.round(scrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(selectedIndex, items.length - 1));
      setter(items[clampedIndex]);
    }
  };

  const handleConfirm = () => {
    onChange(selectedHours * 60 + selectedMinutes);
    setIsOpen(false);
  };

  const formatDisplayValue = () => {
    if (value === 0) return "";
    const h = Math.floor(value / 60);
    const m = value % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} hr`;
    return `${h} hr ${m} min`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Input
          readOnly
          value={formatDisplayValue()}
          placeholder={placeholder}
          className={cn("cursor-pointer", className)}
        />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 bg-card border-border overflow-hidden" align="start">
        {/* Samsung-style wheel picker */}
        <div className="relative flex justify-center py-4">
          {/* Selection highlight bar */}
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-11 bg-primary/10 rounded-lg border border-primary/20 pointer-events-none z-0" />
          
          {/* Hours wheel */}
          <div className="relative flex flex-col items-center">
            <div 
              ref={hoursRef}
              onScroll={() => handleScroll(hoursRef, setSelectedHours, hours)}
              className="h-[132px] overflow-y-auto snap-y snap-mandatory scrollbar-hide relative z-10"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {/* Top padding for centering */}
              <div className="h-11" />
              {hours.map((h) => {
                const isSelected = selectedHours === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      setSelectedHours(h);
                      scrollToSelected(hoursRef, h);
                    }}
                    className={cn(
                      "w-16 h-11 flex items-center justify-center snap-center transition-all duration-150",
                      isSelected
                        ? "text-foreground text-2xl font-semibold"
                        : "text-muted-foreground/50 text-lg"
                    )}
                  >
                    {String(h).padStart(2, '0')}
                  </button>
                );
              })}
              {/* Bottom padding for centering */}
              <div className="h-11" />
            </div>
            <span className="text-xs text-muted-foreground mt-1">hours</span>
          </div>

          {/* Separator */}
          <div className="flex items-center justify-center text-2xl font-bold text-foreground px-2 relative z-10">
            :
          </div>

          {/* Minutes wheel */}
          <div className="relative flex flex-col items-center">
            <div 
              ref={minutesRef}
              onScroll={() => handleScroll(minutesRef, setSelectedMinutes, minutes)}
              className="h-[132px] overflow-y-auto snap-y snap-mandatory scrollbar-hide relative z-10"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {/* Top padding for centering */}
              <div className="h-11" />
              {minutes.map((m) => {
                const isSelected = selectedMinutes === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setSelectedMinutes(m);
                      scrollToSelected(minutesRef, m);
                    }}
                    className={cn(
                      "w-16 h-11 flex items-center justify-center snap-center transition-all duration-150",
                      isSelected
                        ? "text-foreground text-2xl font-semibold"
                        : "text-muted-foreground/50 text-lg"
                    )}
                  >
                    {String(m).padStart(2, '0')}
                  </button>
                );
              })}
              {/* Bottom padding for centering */}
              <div className="h-11" />
            </div>
            <span className="text-xs text-muted-foreground mt-1">min</span>
          </div>
        </div>

        {/* Top/bottom fade gradients */}
        <div className="absolute top-4 left-4 right-4 h-10 bg-gradient-to-b from-card to-transparent pointer-events-none z-20" />
        <div className="absolute bottom-16 left-4 right-4 h-10 bg-gradient-to-t from-card to-transparent pointer-events-none z-20" />
        
        {/* Action buttons */}
        <div className="p-3 border-t border-border flex gap-2 relative z-30 bg-card">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={handleConfirm}
          >
            Confirm
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
