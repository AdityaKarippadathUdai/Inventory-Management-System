import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Warehouse, CheckCircle2, XCircle } from "lucide-react";
import { apiClient } from "@/api/client";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(10, "Password must be at least 10 characters")
      .regex(/[a-z]/, "Must contain lowercase letter")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/\d/, "Must contain number")
      .regex(/[^A-Za-z\d]/, "Must contain special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

const reqs = [
  { label: "At least 10 characters", test: (v: string) => v.length >= 10 },
  { label: "Uppercase letter (A–Z)", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Lowercase letter (a–z)", test: (v: string) => /[a-z]/.test(v) },
  { label: "Number (0–9)", test: (v: string) => /\d/.test(v) },
  { label: "Special character (!@#$%…)", test: (v: string) => /[^A-Za-z\d]/.test(v) },
];

const inputStyle = (hasError?: boolean): React.CSSProperties => ({
  width: "100%", height: "44px", padding: "0 0.875rem",
  background: "rgba(255,255,255,0.05)",
  border: hasError ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px", color: "white", fontSize: "0.9rem",
  outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
  boxSizing: "border-box" as const,
});

export function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pwValue, setPwValue] = useState("");

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const watchedPw = watch("password", "");

  async function submit(values: FormValues) {
    setError("");
    setIsSubmitting(true);
    try {
      await apiClient.post("/auth/register", { name: values.name, email: values.email, password: values.password });
      navigate("/login", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function onFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = "rgba(99,102,241,0.6)";
    e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
  }
  function onBlur(e: React.FocusEvent<HTMLInputElement>, hasErr?: boolean) {
    e.target.style.borderColor = hasErr ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)";
    e.target.style.boxShadow = "none";
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: "radial-gradient(ellipse 80% 60% at 20% -10%, rgba(99,102,241,0.2) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 110%, rgba(168,85,247,0.15) 0%, transparent 60%), #0a0a0f",
      padding: "2rem",
    }}>
      <div style={{
        width: "100%", maxWidth: "460px",
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: "20px",
        padding: "2.5rem",
        boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "9px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Warehouse size={18} color="white" />
          </div>
          <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "white" }}>OptiStock</span>
        </div>

        <h2 style={{ fontSize: "1.625rem", fontWeight: 700, color: "white", letterSpacing: "-0.025em", marginBottom: "0.375rem" }}>
          Create your account
        </h2>
        <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.4)", marginBottom: "2rem" }}>
          Join OptiStock and manage your warehouses with ease.
        </p>

        {error && (
          <div style={{
            padding: "0.875rem 1rem", background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px",
            marginBottom: "1.5rem", fontSize: "0.875rem", color: "#fca5a5",
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit(submit)} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {/* Name */}
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "rgba(255,255,255,0.55)", marginBottom: "0.4rem" }}>Full Name</label>
            <input type="text" autoComplete="name" placeholder="John Doe" {...register("name")}
              style={inputStyle(!!errors.name)} onFocus={onFocus} onBlur={(e) => onBlur(e, !!errors.name)} />
            {errors.name && <p style={{ marginTop: "0.3rem", fontSize: "0.73rem", color: "#f87171" }}>{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "rgba(255,255,255,0.55)", marginBottom: "0.4rem" }}>Email</label>
            <input type="email" autoComplete="email" placeholder="you@company.com" {...register("email")}
              style={inputStyle(!!errors.email)} onFocus={onFocus} onBlur={(e) => onBlur(e, !!errors.email)} />
            {errors.email && <p style={{ marginTop: "0.3rem", fontSize: "0.73rem", color: "#f87171" }}>{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "rgba(255,255,255,0.55)", marginBottom: "0.4rem" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} autoComplete="new-password"
                placeholder="Create a strong password"
                {...register("password", { onChange: (e) => setPwValue(e.target.value) })}
                style={{ ...inputStyle(!!errors.password), paddingRight: "2.75rem" }}
                onFocus={onFocus} onBlur={(e) => onBlur(e, !!errors.password)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)",
                display: "flex", alignItems: "center",
              }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Password strength checklist */}
            {(watchedPw || pwValue) && (
              <div style={{
                marginTop: "0.75rem", padding: "0.875rem",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "8px",
              }}>
                {reqs.map((r) => {
                  const passed = r.test(watchedPw || pwValue);
                  return (
                    <div key={r.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                      {passed
                        ? <CheckCircle2 size={13} color="#34d399" />
                        : <XCircle size={13} color="rgba(255,255,255,0.2)" />}
                      <span style={{ fontSize: "0.73rem", color: passed ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.3)" }}>{r.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "rgba(255,255,255,0.55)", marginBottom: "0.4rem" }}>Confirm Password</label>
            <div style={{ position: "relative" }}>
              <input type={showConfirm ? "text" : "password"} autoComplete="new-password"
                placeholder="Re-enter password" {...register("confirmPassword")}
                style={{ ...inputStyle(!!errors.confirmPassword), paddingRight: "2.75rem" }}
                onFocus={onFocus} onBlur={(e) => onBlur(e, !!errors.confirmPassword)} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{
                position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)",
                display: "flex", alignItems: "center",
              }}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && <p style={{ marginTop: "0.3rem", fontSize: "0.73rem", color: "#f87171" }}>{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} style={{
            width: "100%", height: "44px", marginTop: "0.5rem",
            background: isSubmitting ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            border: "none", borderRadius: "10px", color: "white", fontSize: "0.9rem", fontWeight: 600,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            boxShadow: "0 4px 20px rgba(99,102,241,0.35)", transition: "opacity 0.2s, transform 0.15s",
          }}>
            {isSubmitting ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p style={{ marginTop: "1.75rem", textAlign: "center", fontSize: "0.85rem", color: "rgba(255,255,255,0.35)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#818cf8", textDecoration: "none", fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
