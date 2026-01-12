import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Utensils, X, Camera, ChevronRight, Clock, Loader2, ChefHat, Compass, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
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

// ... keep all your interfaces and custom hooks as is

const CreateMealPage = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [barcodeResult, setBarcodeResult] = useState<string | null>(null);
  const [foodFromBarcode, setFoodFromBarcode] = useState<any>(null);

  // Function to fetch food using barcode
  const fetchFoodByBarcode = async (barcode: string) => {
    setFoodFromBarcode(null);
    setBarcodeResult(barcode);
    try {
      const resp = await fetch(
        `https://tfpknxjrefqnkcxsyvhl.supabase.co/functions/v1/search-foods?barcode=${barcode}`,
        {
          headers: {
            Authorization: "Bearer YOUR_SUPABASE_ANON_KEY",
          },
        },
      );
      const data = await resp.json();
      setFoodFromBarcode(data);
      // Optionally auto-select/add food if data is valid here
    } catch (e) {
      setFoodFromBarcode({ error: "Lookup failed" });
    }
  };

  // ... all your normal state, effects, and handlers as before

  return (
    <div className="min-h-screen bg-background pb-40">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4">
        {/* Header and other top-of-page code unchanged */}

        {/* --- Food Search and Barcode Scanner UI --- */}
        <div className="mb-4 flex gap-2 items-start">
          <FoodSearchInput
            value={searchValue}
            onChange={setSearchValue}
            onSelect={handleFoodSelect}
            onAddCustom={handleAddCustomFood}
            placeholder="Search for a food..."
          />
          <Button onClick={() => setShowScanner(true)} type="button" className="h-12">
            <Camera size={18} style={{ marginRight: 6 }} />
            Scan Barcode
          </Button>
        </div>

        {/* Barcode result display */}
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

        {/* Barcode Scanner Modal */}
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

        {/* --- Rest of your component --- */}
        {/* Existing Meal creation, Food list, Modals, etc., all remain below unchanged */}
        {/* ... */}
      </motion.div>
      {/* ...any other components, modals, dialogs... */}
    </div>
  );
};

export default CreateMealPage;
export { FoodSearchInput };
export type { FoodItem, SavedMealFood };
