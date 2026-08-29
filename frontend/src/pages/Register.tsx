import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, UserPlus, Package, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/api/client";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(10, "Password must be at least 10 characters")
      .regex(/[a-z]/, "Password must contain lowercase letter")
      .regex(/[A-Z]/, "Password must contain uppercase letter")
      .regex(/\d/, "Password must contain number")
      .regex(/[^A-Za-z\d]/, "Password must contain special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function submit(values: FormValues) {
    setError("");
    setIsSubmitting(true);

    try {
      await apiClient.post("/auth/register", {
        name: values.name,
        email: values.email,
        password: values.password,
      });

      navigate("/login", { replace: true, state: { message: "Registration successful! Please sign in." } });
    } catch (err: any) {
      const message = err.response?.data?.message || "Registration failed. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-mesh-dark text-white grid lg:grid-cols-2">
      <section className="hidden lg:flex flex-col justify-between p-16 relative overflow-hidden">
        <div className="z-10 flex items-center gap-3 text-2xl font-bold tracking-tight">
          <Package className="text-primary" /> OptiStock
        </div>
        <div className="z-10 animate-fade-in-up">
          <p className="mb-6 text-sm uppercase tracking-[0.3em] font-semibold text-primary">
            Join the network
          </p>
          <h1 className="max-w-xl text-6xl font-bold leading-[1.1] tracking-tight">
            Get started with <span className="text-gradient">warehouse management</span> today.
          </h1>
          <p className="mt-8 max-w-lg text-lg text-gray-400 font-light leading-relaxed">
            Create your account and join teams managing inventory across multiple warehouses.
          </p>
        </div>
        <p className="z-10 text-sm text-gray-500 font-medium">Multi-Warehouse Management System &copy; {new Date().getFullYear()}</p>
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
      </section>

      <section className="flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-background/50 backdrop-blur-3xl lg:hidden pointer-events-none" />
        <div className="w-full max-w-lg glass-panel p-10 rounded-2xl animate-fade-in z-10 relative">
          <div className="mb-10 lg:hidden flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
            <Package className="text-primary" /> OptiStock
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white">Create Account</h2>
          <p className="mt-2 text-sm text-gray-400">
            Sign up to get started with OptiStock.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-lg border border-destructive/50 bg-destructive/20 p-4 text-sm text-red-200 animate-fade-in"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(submit)} className="mt-8 space-y-5">
            <label className="block text-sm font-medium text-gray-300">
              Full Name
              <Input
                className="mt-2 bg-black/40 border-gray-700/50 focus-visible:ring-primary text-white h-11"
                type="text"
                autoComplete="name"
                {...register("name")}
                placeholder="John Doe"
              />
              {errors.name && (
                <span className="mt-2 block text-xs text-destructive">
                  {errors.name.message}
                </span>
              )}
            </label>

            <label className="block text-sm font-medium text-gray-300">
              Email
              <Input
                className="mt-2 bg-black/40 border-gray-700/50 focus-visible:ring-primary text-white h-11"
                type="email"
                autoComplete="email"
                {...register("email")}
                placeholder="you@example.com"
              />
              {errors.email && (
                <span className="mt-2 block text-xs text-destructive">
                  {errors.email.message}
                </span>
              )}
            </label>

            <label className="block text-sm font-medium text-gray-300">
              Password
              <div className="relative mt-2">
                <Input
                  className="pr-10 bg-black/40 border-gray-700/50 focus-visible:ring-primary text-white h-11"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  {...register("password")}
                  placeholder="Min 10 chars, upper, lower, number, special"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="mt-2 block text-xs text-destructive">
                  {errors.password.message}
                </span>
              )}
            </label>

            <label className="block text-sm font-medium text-gray-300">
              Confirm Password
              <div className="relative mt-2">
                <Input
                  className="pr-10 bg-black/40 border-gray-700/50 focus-visible:ring-primary text-white h-11"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="mt-2 block text-xs text-destructive">
                  {errors.confirmPassword.message}
                </span>
              )}
            </label>

            <Button className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 mt-6" disabled={isSubmitting}>
              {isSubmitting ? (
                "Creating account..."
              ) : (
                <>
                  <UserPlus size={18} className="mr-2" /> Create Account
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
              Sign in
            </Link>
          </p>

          <div className="mt-8 rounded-lg bg-black/30 border border-white/5 p-5 text-xs">
            <p className="font-semibold text-white flex items-center gap-2">
              <CheckCircle size={16} className="text-primary" /> Password Requirements
            </p>
            <ul className="mt-3 space-y-1.5 text-gray-400 ml-6 list-disc">
              <li>At least 10 characters</li>
              <li>Contains uppercase letter (A-Z)</li>
              <li>Contains lowercase letter (a-z)</li>
              <li>Contains number (0-9)</li>
              <li>Contains special character (!@#$%)</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Register;
