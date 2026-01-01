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
  placeholder = "0 min",
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
        if (hoursRef.current) {
          const selectedElement = hoursRef.current.querySelector('[data-selected="true"]');
          if (selectedElement) {
            selectedElement.scrollIntoView({ block: "center", behavior: "instant" });
          }
        }
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
    onChange(selectedHours * 60 + selectedMinutes);
    setIsOpen(false);
  };

  const formatDisplayValue = () => {
    if (value === 0) return placeholder;
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
          value={value > 0 ? formatDisplayValue() : ""}
          placeholder={placeholder}
          className={cn("cursor-pointer", className)}
        />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 bg-popover border-border" align="start">
        <div className="p-3 border-b border-border">
          <p className="text-sm font-medium text-center">Select Time</p>
        </div>
        
        <div className="flex">
          {/* Hours Column */}
          <div className="flex-1 border-r border-border">
            <div className="text-xs text-muted-foreground text-center py-2 border-b border-border">Hours</div>
            <div 
              ref={hoursRef}
              className="h-48 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              {hours.map((h) => (
                <button
                  key={h}
                  type="button"
                  data-selected={selectedHours === h}
                  onClick={() => setSelectedHours(h)}
                  className={cn(
                    "w-full py-2 text-sm text-center transition-colors",
                    selectedHours === h
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
          
          {/* Minutes Column */}
          <div className="flex-1">
            <div className="text-xs text-muted-foreground text-center py-2 border-b border-border">Minutes</div>
            <div 
              ref={minutesRef}
              className="h-48 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              {minutes.map((m) => (
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
                  {m}
                </button>
              ))}
            </div>
          </div>
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
