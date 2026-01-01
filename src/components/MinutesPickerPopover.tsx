import { useState, useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MinutesPickerPopoverProps {
  value: number; // value in minutes
  onChange: (minutes: number) => void;
  className?: string;
  defaultWhenOpened?: number; // default value when popover opens with 0 value
}

const minuteOptions = Array.from({ length: 181 }, (_, i) => i); // 0-180 minutes

export const MinutesPickerPopover = ({
  value,
  onChange,
  className,
  defaultWhenOpened = 60,
}: MinutesPickerPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState(value);
  
  const minutesRef = useRef<HTMLDivElement>(null);

  // Sync internal state when value prop changes
  useEffect(() => {
    setSelectedMinutes(value);
  }, [value]);

  // Handle open - auto-set to default if value is 0
  const handleOpenChange = (open: boolean) => {
    if (open && value === 0) {
      setSelectedMinutes(defaultWhenOpened);
    }
    setIsOpen(open);
  };

  // Scroll to selected value when popover opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (minutesRef.current) {
          const selectedElement = minutesRef.current.querySelector('[data-selected="true"]');
          if (selectedElement) {
            selectedElement.scrollIntoView({ block: "center", behavior: "instant" });
          }
        }
      }, 0);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onChange(selectedMinutes);
    setIsOpen(false);
  };

  // Format display: show as timer-style (H:MM or M:SS format)
  const formatDisplayValue = (mins: number): string => {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0) {
      return `${hours}:${remainingMins.toString().padStart(2, '0')}:00`;
    }
    return `${mins}:00`;
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className={cn("text-2xl font-bold font-mono cursor-pointer hover:text-primary transition-colors", className)}>
          {formatDisplayValue(value)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0 bg-popover border-border" align="center">
        <div className="p-3 border-b border-border">
          <p className="text-sm font-medium text-center">Select Minutes</p>
        </div>
        
        <div 
          ref={minutesRef}
          className="h-48 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {minuteOptions.map((m) => (
            <button
              key={m}
              type="button"
              data-selected={selectedMinutes === m}
              onClick={() => setSelectedMinutes(m)}
              className={cn(
                "w-full py-2 text-sm text-center transition-colors",
                selectedMinutes === m
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              {m} min
            </button>
          ))}
        </div>
        
        <div className="p-3 border-t border-border flex gap-2">
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
