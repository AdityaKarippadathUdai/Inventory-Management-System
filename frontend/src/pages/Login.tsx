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
  return <main className="min-h-screen bg-secondary/40 grid lg:grid-cols-[1.1fr_0.9fr]">
    <section className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground"><div className="flex items-center gap-3 text-xl font-semibold"><Package /> OptiStock</div><div><p className="mb-4 text-sm uppercase tracking-[0.2em] opacity-70">Operations control center</p><h1 className="max-w-lg text-5xl font-semibold leading-tight">A clearer view of every warehouse decision.</h1><p className="mt-6 max-w-md opacity-80">Secure access for the teams who keep inventory moving.</p></div><p className="text-sm opacity-60">Multi-Warehouse Management System</p></section>
    <section className="flex items-center justify-center p-6"><div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm"><div className="mb-8 lg:hidden flex items-center gap-2 text-lg font-semibold text-primary"><Package /> OptiStock</div><h2 className="text-2xl font-semibold">Welcome back</h2><p className="mt-2 text-sm text-muted-foreground">Sign in to continue to your workspace.</p>{error && <div role="alert" className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}<form onSubmit={handleSubmit(submit)} className="mt-7 space-y-5"><label className="block text-sm font-medium">Email<Input className="mt-2" type="email" autoComplete="email" {...register("email")} />{errors.email && <span className="mt-1 block text-xs text-destructive">{errors.email.message}</span>}</label><label className="block text-sm font-medium">Password<div className="relative mt-2"><Input className="pr-10" type={showPassword ? "text" : "password"} autoComplete="current-password" {...register("password")} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-2 top-2.5 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{errors.password && <span className="mt-1 block text-xs text-destructive">{errors.password.message}</span>}</label><Button className="w-full" disabled={isSubmitting}>{isSubmitting ? "Signing in..." : <><LockKeyhole size={16} /> Sign in</>}</Button></form><Link to="/forgot-password" className="mt-5 block text-center text-sm text-primary hover:underline">Forgot your password?</Link></div></section>
  </main>;
}
