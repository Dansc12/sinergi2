import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Scale, X } from "lucide-react";
import { toast } from "sonner";

interface WeighInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (weight: number, notes?: string) => Promise<boolean>;
  currentWeight?: number | null;
}

export const WeighInModal = ({ open, onOpenChange, onSave, currentWeight }: WeighInModalProps) => {
  const [weight, setWeight] = useState(currentWeight?.toString() || "");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      toast.error("Please enter a valid weight");
      return;
    }

    setIsSaving(true);
    const success = await onSave(weightNum, notes || undefined);
    setIsSaving(false);

    if (success) {
      toast.success("Weight logged successfully!");
      setWeight("");
      setNotes("");
      onOpenChange(false);
    } else {
      toast.error("Failed to log weight");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale size={20} className="text-primary" />
            Log Weigh-In
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">
              Weight (lbs)
            </label>
            <Input
              type="number"
              step="0.1"
              placeholder="Enter weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="text-lg"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">
              Notes (optional)
            </label>
            <Textarea
              placeholder="How are you feeling?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !weight}
              className="flex-1"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
