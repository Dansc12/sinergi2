import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ChefHat, Plus, Trash2, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const CreateRecipePage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [instructions, setInstructions] = useState<string[]>([""]);

  const addIngredient = () => setIngredients([...ingredients, ""]);
  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };
  const updateIngredient = (index: number, value: string) => {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  };

  const addInstruction = () => setInstructions([...instructions, ""]);
  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };
  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({ title: "Please enter a recipe title", variant: "destructive" });
      return;
    }
    toast({ title: "Recipe shared!", description: "Your recipe is now live." });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-400 flex items-center justify-center">
              <ChefHat size={20} className="text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Share Recipe</h1>
          </div>
        </div>

        {/* Cover Photo */}
        <div className="mb-6">
          <div className="h-40 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-400/20 border-2 border-dashed border-border flex items-center justify-center">
            <Button variant="ghost">
              <Image size={20} className="mr-2" /> Add Photo
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Recipe Title</Label>
            <Input
              id="title"
              placeholder="e.g., High Protein Overnight Oats"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What makes this recipe special?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Prep Time</Label>
              <Input placeholder="10 min" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Cook Time</Label>
              <Input placeholder="20 min" value={cookTime} onChange={(e) => setCookTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Servings</Label>
              <Input placeholder="4" value={servings} onChange={(e) => setServings(e.target.value)} />
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-3">
            <Label>Ingredients</Label>
            {ingredients.map((ingredient, index) => (
              <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                <Input
                  placeholder={`Ingredient ${index + 1}`}
                  value={ingredient}
                  onChange={(e) => updateIngredient(index, e.target.value)}
                />
                {ingredients.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeIngredient(index)}>
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                )}
              </motion.div>
            ))}
            <Button variant="outline" size="sm" onClick={addIngredient}>
              <Plus size={16} /> Add Ingredient
            </Button>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <Label>Instructions</Label>
            {instructions.map((instruction, index) => (
              <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                <div className="flex items-start gap-2 flex-1">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mt-2">
                    {index + 1}
                  </span>
                  <Textarea
                    placeholder={`Step ${index + 1}`}
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                </div>
                {instructions.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeInstruction(index)}>
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                )}
              </motion.div>
            ))}
            <Button variant="outline" size="sm" onClick={addInstruction}>
              <Plus size={16} /> Add Step
            </Button>
          </div>

          <Button className="w-full" size="lg" onClick={handleSubmit}>
            Share Recipe
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateRecipePage;
