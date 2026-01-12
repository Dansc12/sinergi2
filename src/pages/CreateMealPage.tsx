import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Utensils, X, Camera, ChevronRight, Clock, Loader2, ChefHat, Compass, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FoodSearchInput } from "@/components/FoodSearchInput";
import type { FoodItem, SavedMealFood } from "@/components/FoodSearchInput";
import { FoodDetailModal } from "@/components/FoodDetailModal";
import { SavedMealExpansionModal } from "@/components/SavedMealExpansionModal";
import { AddCustomFoodModal } from "@/components/AddCustomFoodModal";
import { CameraCapture, PhotoChoiceDialog } from "@/components/CameraCapture";
import { usePhotoPicker } from "@/hooks/useCamera";
import PhotoGallerySheet from "@/components/PhotoGallerySheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRecentFoods } from "@/hooks/useRecentFoods";
import { usePosts } from "@/hooks/usePosts";
import BarcodeScanner from "@/components/BarcodeScanner";

interface SelectedFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servings?: number;
  servingSize?: string;
  rawQuantity?: number;
  rawUnit?: string;
  savedMealGroupId?: string;
  savedMealName?: string;
  savedMealCoverPhoto?: string;
}

interface RestoredState {
  restored?: boolean;
  contentData?: { mealType?: string; foods?: SelectedFood[] };
  images?: string[];
  preselectedMealType?: string;
  logDate?: string;
  selectedRecipe?: {
    ingredients: {
      id: string;
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
      servings: number;
      servingSize: string;
    }[];
  };
}

const CreateMealPage = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [barcodeResult, setBarcodeResult] = useState<string | null>(null);
  const [foodFromBarcode, setFoodFromBarcode] = useState<any>(null);
  const [mealType, setMealType] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isChoiceDialogOpen, setIsChoiceDialogOpen] = useState(false);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);
  const [showFoodsList, setShowFoodsList] = useState(false);
  const [pendingFood, setPendingFood] = useState<FoodItem | null>(null);
  const [isFoodDetailOpen, setIsFoodDetailOpen] = useState(false);
  const [isCustomFoodModalOpen, setIsCustomFoodModalOpen] = useState(false);
  const [customFoodInitialName, setCustomFoodInitialName] = useState("");
  const [pendingFoodInitialQuantity, setPendingFoodInitialQuantity] = useState<number | undefined>();
  const [pendingFoodInitialUnit, setPendingFoodInitialUnit] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [showSaveAsMealDialog, setShowSaveAsMealDialog] = useState(false);
  const [showMacrosHint, setShowMacrosHint] = useState(false);
  const [isSavedMealExpansionOpen, setIsSavedMealExpansionOpen] = useState(false);
  const [savedMealFoods, setSavedMealFoods] = useState<SavedMealFood[]>([]);
  const [savedMealName, setSavedMealName] = useState("");
  const [savedMealCoverPhoto, setSavedMealCoverPhoto] = useState<string | undefined>();
  const navigate = useNavigate();
  const location = useLocation();
  const restoredState = location.state as RestoredState | null;
  const { createPost } = usePosts();
  const { recentFoods, isLoading: isLoadingRecentFoods } = useRecentFoods(10);
  const { inputRef, openPicker, handleFileChange } = usePhotoPicker((urls) => {
    setPhotos([...photos, ...urls]);
    toast({ title: "Photos added!", description: `${urls.length} photo(s) added.` });
  });
  const [logDate] = useState<string | undefined>(restoredState?.logDate);

  // fetch food by barcode
  const fetchFoodByBarcode = async (barcode: string) => {
    setFoodFromBarcode(null);
    setBarcodeResult(barcode);
    try {
      const resp = await fetch(
        `https://tfpknxjrefqnkcxsyvhl.supabase.co/functions/v1/search-foods?barcode=${barcode}`,
        {
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcGtueGpyZWZxbmtjeHN5dmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODg1NDAsImV4cCI6MjA4MzU2NDU0MH0.9MVhZ5xEmA4HrXdX38m6wlGd89Z2YFfsypdQEWgmy98",
          },
        },
      );
      const data = await resp.json();
      setFoodFromBarcode(data);
    } catch (e) {
      setFoodFromBarcode({ error: "Lookup failed" });
    }
  };

  // Other effects and handlers are the same...
  // --(keep all your effect/setup and handler logic unchanged)--

  // Add barcode, meal, etc. handlers as before, no change.

  // (skipping unchanged functions for brevity...)

  // Main render:
  return (
    <div className="min-h-screen bg-background pb-40">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4">
        {/* Header */}
        {/* ...header and macros code untouched... */}

        {/* Food Search and Barcode button in a row */}
        <div className="mb-4 flex gap-2 items-center">
          <FoodSearchInput
            value={searchValue}
            onChange={setSearchValue}
            onSelect={handleFoodSelect}
            onAddCustom={handleAddCustomFood}
            placeholder="Search for a food..."
          />
          <Button onClick={() => setShowScanner(true)}>
            <Camera size={18} style={{ marginRight: 6 }} />
            Scan Barcode
          </Button>
        </div>

        {/* Barcode result display (optional and can be styled/hidden) */}
        {barcodeResult && (
          <div className="mb-3 p-3 rounded-xl border bg-card">
            <div className="text-xs text-muted-foreground mb-1">
              Scanned barcode: <span className="font-mono">{barcodeResult}</span>
            </div>
            {foodFromBarcode === null && <div className="text-sm">Loading food...</div>}
            {foodFromBarcode && foodFromBarcode.not_found && (
              <div className="text-destructive">No food found for this barcode.</div>
            )}
            {foodFromBarcode && foodFromBarcode.name && (
              <div>
                <div className="font-bold text-lg mb-1">
                  {foodFromBarcode.name} {foodFromBarcode.brand && <span>({foodFromBarcode.brand})</span>}
                </div>
                {foodFromBarcode.image_url && (
                  <img src={foodFromBarcode.image_url} alt={foodFromBarcode.name} width={100} className="mb-2" />
                )}
                <div>
                  <span>Calories: {foodFromBarcode.nutrients_per_100g?.calories ?? "?"} cal / 100g</span>
                  <br />
                  <span>Protein: {foodFromBarcode.nutrients_per_100g?.protein ?? "?"}g</span>
                  <br />
                  <span>Carbs: {foodFromBarcode.nutrients_per_100g?.carbs ?? "?"}g</span>
                  <br />
                  <span>Fat: {foodFromBarcode.nutrients_per_100g?.fat ?? "?"}g</span>
                  <br />
                  {foodFromBarcode.serving_suggestion && <span>Serving: {foodFromBarcode.serving_suggestion}</span>}
                </div>
              </div>
            )}
            {foodFromBarcode && foodFromBarcode.error && (
              <div className="text-destructive">Something went wrong fetching food details.</div>
            )}
          </div>
        )}

        {/* ... all your other UI (recent foods, macros bar, etc) ... */}
      </motion.div>

      {/* Barcode Scanner Modal at the very bottom of the main div so it's always "above all" */}
      {showScanner && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              maxWidth: 420,
              width: "90%",
              background: "#222",
              borderRadius: 12,
              boxShadow: "0 2px 22px #0008",
              position: "relative",
            }}
          >
            <BarcodeScanner
              onDetected={(barcode) => {
                setShowScanner(false);
                fetchFoodByBarcode(barcode);
              }}
              onClose={() => setShowScanner(false)}
            />
            <Button
              variant="outline"
              style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}
              onClick={() => setShowScanner(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* ...All your modals and overlays remain unchanged, immediately after here ... */}

      {/* Hidden file input for gallery */}
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />

      {/* Photo Choice Dialog */}
      <PhotoChoiceDialog
        isOpen={isChoiceDialogOpen}
        onClose={() => setIsChoiceDialogOpen(false)}
        onChooseCamera={() => {
          setIsChoiceDialogOpen(false);
          setIsCameraOpen(true);
        }}
        onChooseGallery={() => {
          setIsChoiceDialogOpen(false);
          openPicker();
        }}
      />
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapturePhoto}
        onSelectFromGallery={handleSelectFromGallery}
      />
      <FoodDetailModal
        isOpen={isFoodDetailOpen}
        food={pendingFood}
        onClose={handleFoodDetailClose}
        onConfirm={handleFoodConfirm}
        initialQuantity={pendingFoodInitialQuantity}
        initialUnit={pendingFoodInitialUnit}
      />
      <PhotoGallerySheet
        isOpen={isPhotoGalleryOpen}
        onClose={() => setIsPhotoGalleryOpen(false)}
        photos={photos}
        onDeletePhoto={removePhoto}
      />
      <AddCustomFoodModal
        isOpen={isCustomFoodModalOpen}
        onClose={() => setIsCustomFoodModalOpen(false)}
        onSuccess={handleCustomFoodCreated}
        initialName={customFoodInitialName}
      />
      <SavedMealExpansionModal
        isOpen={isSavedMealExpansionOpen}
        mealName={savedMealName}
        foods={savedMealFoods}
        onClose={() => {
          setIsSavedMealExpansionOpen(false);
          setSavedMealFoods([]);
          setSavedMealName("");
        }}
        onConfirm={handleSavedMealConfirm}
      />
      <AlertDialog open={showBackConfirm} onOpenChange={setShowBackConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your added foods will be deleted if you go back. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBack}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={showSaveAsMealDialog} onOpenChange={setShowSaveAsMealDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save as a Meal to Share</DialogTitle>
            <DialogDescription>
              To share your meal with friends, you need to save it as a Meal first. Would you like to create a Saved
              Meal with these foods?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSaveAsMealDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsMeal}>Save as Meal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateMealPage;
