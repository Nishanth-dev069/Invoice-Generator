"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      loginSchema.parse({ email, password });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError((err as any).errors[0].message);
        setLoading(false);
        return;
      }
    }

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid credentials. Please try again.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-brand-cream font-sans">
      
      {/* LEFT PANEL - BRANDING (60%) */}
      <div className="relative w-full md:w-[60%] bg-brand-forest flex flex-col justify-center items-center overflow-hidden p-8 md:p-12 min-h-[40vh] md:min-h-screen">
        {/* Subtle Background Texture */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(242,239,230,1) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />
        
        {/* Brand Container */}
        <div className="z-10 flex flex-col items-center justify-center text-center max-w-lg mt-8 md:mt-0">
          <svg viewBox="0 0 120 120" fill="none" className="w-24 h-24 md:w-32 md:h-32 mb-6 drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
            <path d="M95 95 C 95 30, 45 5, 20 5 C 20 60, 60 95, 95 95 Z" fill="#717f65" opacity="0.85"/>
            <path d="M95 95 C 80 25, 25 10, 5 30 C 25 75, 70 95, 95 95 Z" fill="#5e7150" opacity="0.9"/>
            <path d="M95 95 C 75 45, 15 35, 5 60 C 35 90, 80 95, 95 95 Z" fill="#48663e"/>
            <path d="M95 95 C 70 65, 10 70, 5 85 C 40 100, 85 95, 95 95 Z" fill="#32612d"/>
          </svg>
          
          <div className="flex flex-col items-center">
            {/* Wordmark */}
            <h1 className="text-5xl md:text-7xl text-brand-cream font-serif tracking-tight mb-1" style={{ fontFamily: 'var(--font-quincy), serif' }}>
              Ink &amp; Print
            </h1>
            <p className="text-lg md:text-xl text-brand-cream/70 font-sans tracking-[0.3em] font-medium" style={{ fontFamily: 'var(--font-quicksand)' }}>
              STUDIO
            </p>
          </div>

          <div className="w-16 h-[1px] bg-brand-sage my-8 opacity-50"></div>

          <p className="text-brand-cream/60 font-sans text-lg md:text-xl font-light" style={{ fontFamily: 'var(--font-quicksand)' }}>
            Your complete production management system
          </p>
        </div>

        {/* Footer Text */}
        <div className="absolute bottom-6 left-6 md:left-8 z-10">
          <p className="text-brand-cream/40 font-sans text-sm tracking-wide" style={{ fontFamily: 'var(--font-quicksand)' }}>
            Crafted for Ink & Print Studio
          </p>
        </div>
      </div>

      {/* RIGHT PANEL - LOGIN FORM (40%) */}
      <div className="w-full md:w-[40%] bg-brand-cream flex flex-col justify-center items-center p-6 md:p-12">
        <div 
          className="w-full max-w-md bg-brand-white rounded-2xl p-8 md:p-10"
          style={{ boxShadow: '0 4px 24px rgba(50,97,45,0.10)' }}
        >
          {/* Logo - enlarged in the form card */}
          <div className="flex justify-center mb-8">
            <div className="w-56 h-20 relative">
              <Image src="/logo.png" alt="Ink & Print Studio" fill className="object-contain" />
            </div>
          </div>

          {/* Headers */}
          <div className="text-center mb-8">
            <h2 className="text-3xl text-brand-forest font-serif mb-2" style={{ fontFamily: 'var(--font-quincy), serif' }}>
              Welcome back
            </h2>
            <p className="text-brand-muted font-sans text-sm" style={{ fontFamily: 'var(--font-quicksand)' }}>
              Sign in to your workspace
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="block text-sm font-semibold text-brand-forest"
                style={{ fontFamily: 'var(--font-quicksand)' }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                className={`w-full px-4 text-brand-black bg-brand-cream border rounded-lg h-12 focus:outline-none focus:ring-2 focus:ring-brand-sage focus:border-transparent transition-all font-sans ${error ? 'border-brand-danger ring-1 ring-brand-danger' : 'border-brand-border'}`}
                placeholder="name@inkandprints.com"
                required
              />
            </div>

            <div className="space-y-2 relative">
              <div className="flex justify-between items-center">
                <label 
                  htmlFor="password" 
                  className="block text-sm font-semibold text-brand-forest"
                  style={{ fontFamily: 'var(--font-quicksand)' }}
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className={`w-full px-4 pr-12 text-brand-black bg-brand-cream border rounded-lg h-12 focus:outline-none focus:ring-2 focus:ring-brand-sage focus:border-transparent transition-all font-sans ${error ? 'border-brand-danger ring-1 ring-brand-danger' : 'border-brand-border'}`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-sage hover:text-brand-forest transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-brand-danger text-sm font-medium mt-2 flex items-center justify-center bg-brand-danger/10 p-3 rounded-lg border border-brand-danger/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-6 bg-brand-forest text-brand-cream hover:bg-brand-sage transition-colors duration-200 rounded-[10px] font-semibold text-base flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ fontFamily: 'var(--font-quicksand)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2 text-brand-cream" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-brand-muted text-xs font-medium" style={{ fontFamily: 'var(--font-quicksand)' }}>
              © 2025 Ink & Print Studio
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
