import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LockKeyhole, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/auth/AuthContext";

const schema = z.object({ email: z.string().email("Enter a valid email address"), password: z.string().min(1, "Password is required") });
type FormValues = z.infer<typeof schema>;
export function Login() {
  const { login } = useAuth(); const navigate = useNavigate(); const location = useLocation(); const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  async function submit(values: FormValues) { setError(""); try { await login(values.email, values.password); const redirect = new URLSearchParams(location.search).get("redirect") || "/dashboard"; navigate(redirect, { replace: true }); } catch { setError("We could not sign you in. Check your email and password."); } }
  return <main className="min-h-screen bg-mesh-dark text-white grid lg:grid-cols-2">
    <section className="hidden lg:flex flex-col justify-between p-16 relative overflow-hidden">
      <div className="z-10 flex items-center gap-3 text-2xl font-bold tracking-tight"><Package className="text-primary" /> OptiStock</div>
      <div className="z-10 animate-fade-in-up">
        <p className="mb-6 text-sm uppercase tracking-[0.3em] font-semibold text-primary">Operations control center</p>
        <h1 className="max-w-xl text-6xl font-bold leading-[1.1] tracking-tight">A clearer view of every <span className="text-gradient">warehouse decision.</span></h1>
        <p className="mt-8 max-w-lg text-lg text-gray-400 font-light leading-relaxed">Secure access for the teams who keep inventory moving. Real-time insights, intelligent forecasting, and seamless supply chain management.</p>
      </div>
      <p className="z-10 text-sm text-gray-500 font-medium">Multi-Warehouse Management System &copy; {new Date().getFullYear()}</p>
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
    </section>
    
    <section className="flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-background/50 backdrop-blur-3xl lg:hidden pointer-events-none" />
      <div className="w-full max-w-md glass-panel p-10 rounded-2xl animate-fade-in z-10 relative">
        <div className="mb-10 lg:hidden flex items-center gap-3 text-2xl font-bold tracking-tight text-white"><Package className="text-primary" /> OptiStock</div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Welcome back</h2>
        <p className="mt-2 text-sm text-gray-400">Sign in to your account to continue.</p>
        
        {error && <div role="alert" className="mt-6 rounded-lg border border-destructive/50 bg-destructive/20 p-4 text-sm text-red-200 animate-fade-in">{error}</div>}
        
        <form onSubmit={handleSubmit(submit)} className="mt-8 space-y-6">
          <label className="block text-sm font-medium text-gray-300">
            Email
            <Input className="mt-2 bg-black/40 border-gray-700/50 focus-visible:ring-primary text-white h-11" type="email" autoComplete="email" placeholder="name@company.com" {...register("email")} />
            {errors.email && <span className="mt-2 block text-xs text-destructive">{errors.email.message}</span>}
          </label>
          <label className="block text-sm font-medium text-gray-300">
            Password
            <div className="relative mt-2">
              <Input className="pr-10 bg-black/40 border-gray-700/50 focus-visible:ring-primary text-white h-11" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" {...register("password")} />
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="mt-2 block text-xs text-destructive">{errors.password.message}</span>}
          </label>
          <div className="flex items-center justify-between mt-2">
            <Link to="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">Forgot password?</Link>
          </div>
          <Button className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : <><LockKeyhole size={18} className="mr-2" /> Sign in</>}
          </Button>
        </form>
        <p className="mt-8 text-center text-sm text-gray-400">
          Don't have an account? <Link to="/register" className="text-primary hover:text-primary/80 font-semibold transition-colors">Create one</Link>
        </p>
      </div>
    </section>
  </main>;
}
