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
    <div className="min-h-screen w-full flex bg-brand-forest font-sans relative">
      {/* Subtle Background Texture */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(242,239,230,1) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />
      
      {/* CENTER PANEL - LOGIN FORM */}
      <div className="w-full flex flex-col justify-center items-center p-6 relative z-10">
        <div 
          className="w-full max-w-md bg-brand-white rounded-2xl p-8 md:p-10"
          style={{ boxShadow: '0 4px 40px rgba(0,0,0,0.3)' }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-56 h-20 relative">
              <Image src="/logo.png" alt="Ink & Print Studio" fill className="object-contain" priority />
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
