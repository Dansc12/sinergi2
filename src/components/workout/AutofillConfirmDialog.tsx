import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface AutofillConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReplace: () => void;
  onAdd: () => void;
  onCancel: () => void;
  itemName: string;
}

const AutofillConfirmDialog = ({
  open,
  onOpenChange,
  onReplace,
  onAdd,
  onCancel,
  itemName,
}: AutofillConfirmDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">
            Replace current workout?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            You already have exercises in your current workout. How would you like to add "{itemName}"?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="default"
            onClick={() => {
              onReplace();
              onOpenChange(false);
            }}
            className="w-full"
          >
            Replace
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onAdd();
              onOpenChange(false);
            }}
            className="w-full"
          >
            Add to current
          </Button>
          <AlertDialogCancel
            onClick={onCancel}
            className="w-full mt-0"
          >
            Cancel
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AutofillConfirmDialog;
