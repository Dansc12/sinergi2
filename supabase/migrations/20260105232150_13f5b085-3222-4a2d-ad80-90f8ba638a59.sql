-- Add new columns for the updated onboarding flow
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS units_system text DEFAULT 'imperial',
ADD COLUMN IF NOT EXISTS birth_month integer,
ADD COLUMN IF NOT EXISTS birth_year integer,
ADD COLUMN IF NOT EXISTS bring_you_here text[],
ADD COLUMN IF NOT EXISTS goals_setup_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tdee_targets_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS height_value numeric,
ADD COLUMN IF NOT EXISTS pace text,
ADD COLUMN IF NOT EXISTS macro_targets jsonb;

-- Add display_name column (can default to first_name for existing users)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name text;

-- Update existing profiles to have display_name from first_name if not set
UPDATE public.profiles 
SET display_name = first_name 
WHERE display_name IS NULL AND first_name IS NOT NULL;