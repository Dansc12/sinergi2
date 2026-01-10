import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ensureProfile } from "@/lib/ensureProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, Sparkles, Zap, Users, Utensils } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const benefitCards = [
  {
    icon: Zap,
    title: "Make fitness fun",
    body: "Turn logging into a feed you actually want to open.",
  },
  {
    icon: Users,
    title: "Find your people",
    body: "Friends, groups, and creators for daily motivation and accountability.",
  },
  {
    icon: Utensils,
    title: "Meal + workout inspo",
    body: "Save ideas, discover, and share your own.",
  },
];

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await ensureProfile(session.user);
        navigate(profile.onboarding_completed ? "/" : "/onboarding", { replace: true });
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "INITIAL_SESSION" && event !== "SIGNED_IN") return;
      if (!session?.user) return;

      setTimeout(() => {
        ensureProfile(session.user)
          .then((profile) => {
            navigate(profile.onboarding_completed ? "/" : "/onboarding", { replace: true });
          })
          .catch((err) => {
            console.error("ensureProfile failed:", err);
            navigate("/onboarding", { replace: true });
          });
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateForm = () => {
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const formattedErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") formattedErrors.email = err.message;
        if (err.path[0] === "password") formattedErrors.password = err.message;
      });
      setErrors(formattedErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "https://sinergi.lovable.app/auth/callback",
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error: any) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success("Welcome back!");

        // Navigate after successful login
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const profile = await ensureProfile(session.user);
          navigate(profile.onboarding_completed ? "/" : "/onboarding", { replace: true });
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please log in instead.");
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success("Account created! Let's set up your profile.");

        // Navigate after successful signup
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const profile = await ensureProfile(session.user);
          navigate(profile.onboarding_completed ? "/" : "/onboarding", { replace: true });
        }
      }
    } catch (error: any) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Primary glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/8 rounded-full blur-[150px]" />
        {/* Secondary accent glow */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
        {/* Subtle noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Left Column - Marketing/Value Content (Desktop only) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full lg:w-1/2 px-6 pt-8 pb-0 lg:py-0 lg:px-16 xl:px-24 flex flex-col items-center lg:items-start"
      >
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center glow-primary"
          >
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </motion.div>
          <h1 className="text-4xl font-bold gradient-text">Sinergi</h1>
        </div>

        {/* Headline */}
        <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground text-center lg:text-left mb-4 leading-tight">
          Fitness + nutrition logging, <span className="gradient-text">made social.</span>
        </h2>

        {/* Subhead */}
        <p className="text-lg text-muted-foreground text-center lg:text-left max-w-md mb-4 lg:mb-8">
          Share workouts and meals, follow friends, and save inspo that keeps you consistent.
        </p>

        {/* Desktop: stacked benefit cards */}
        <div className="hidden lg:flex lg:max-w-lg flex-col gap-4">
          {benefitCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <BenefitCard {...card} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Right Column - Auth Card + Mobile Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative z-10 w-full lg:w-1/2 px-6 pt-0 pb-8 lg:py-0 lg:px-16 xl:px-24 flex flex-col items-center justify-center"
      >
        <div className="w-full max-w-md">
          {/* Auth Card */}
          <div className="rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(139,92,246,0.15)] ring-1 ring-primary/10">
            {/* Toggle button - top right corner */}
            <div className="flex justify-end -mt-2 -mr-2 mb-2">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-[10px] text-primary/70 hover:text-primary hover:underline"
              >
                {isLogin ? "Create Account" : "Log In"}
              </button>
            </div>

            {/* Card Header - centered */}
            <h3 className="text-xl font-semibold text-foreground text-center">
              {isLogin ? "Welcome back" : "Create your account"}
            </h3>

            {/* Trust line - reduced padding */}
            <p className="text-sm text-muted-foreground/70 text-center mt-1 mb-6">
              Free to start • Share only what you want
            </p>

            {/* Primary CTA - Google */}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 text-base font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl mb-4"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            {/* Email Option - Clickable text */}
            {!showEmailForm && (
              <button
                type="button"
                onClick={() => setShowEmailForm(true)}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                or continue with email
              </button>
            )}

            {/* Email Form - Shows after click, no minimize */}
            {showEmailForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <form onSubmit={handleSubmit} className="pt-4 space-y-4">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-14 bg-input/50 border-border/50 rounded-xl text-base placeholder:text-muted-foreground/40 focus:border-primary focus:ring-primary/20"
                      />
                    </div>
                    {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                        Password
                      </Label>
                      {isLogin && (
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline"
                          onClick={() => toast.info("Password reset coming soon!")}
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 pr-12 h-14 bg-input/50 border-border/50 rounded-xl text-base placeholder:text-muted-foreground/40 focus:border-primary focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 text-base font-semibold bg-secondary hover:bg-secondary/80 text-foreground rounded-xl"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full"
                      />
                    ) : isLogin ? (
                      "Log In"
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </motion.div>
            )}
          </div>

          {/* Mobile: Benefit Cards below auth card with pagination */}
          <div className="lg:hidden mt-4">
            <div 
              ref={carouselRef}
              className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory hide-scrollbar"
              style={{ scrollSnapType: 'x mandatory' }}
              onScroll={(e) => {
                const container = e.currentTarget;
                const cardWidth = 260 + 12; // card width + gap
                const scrollLeft = container.scrollLeft;
                const index = Math.round(scrollLeft / cardWidth);
                setActiveCardIndex(Math.max(0, Math.min(index, benefitCards.length - 1)));
              }}
            >
              {benefitCards.map((card, index) => (
                <div
                  key={card.title}
                  className="flex-shrink-0 w-[260px] snap-center first:ml-[calc(50vw-130px)] last:mr-[calc(50vw-130px)]"
                >
                  <BenefitCard {...card} />
                </div>
              ))}
            </div>
            {/* Pagination dots */}
            <div className="flex justify-center gap-1.5 pt-2">
              {benefitCards.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index === activeCardIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Benefit Card Component
const BenefitCard = ({ icon: Icon, title, body }: { icon: any; title: string; body: string }) => (
  <div className="rounded-xl border border-white/10 bg-card/40 backdrop-blur-lg p-4 shadow-card h-full min-h-[88px] flex items-center">
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h4 className="font-semibold text-foreground text-sm mb-0.5">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
      </div>
    </div>
  </div>
);

export default AuthPage;
