import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Warehouse, Boxes, BarChart3, ArrowRightLeft } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

const features = [
  { icon: Boxes, title: "Real-time Inventory", desc: "Track stock across all warehouses in real time" },
  { icon: Warehouse, title: "Multi-Warehouse", desc: "Manage unlimited warehouse locations from one place" },
  { icon: ArrowRightLeft, title: "Smart Transfers", desc: "Intelligent stock movement and replenishment" },
  { icon: BarChart3, title: "Insights & Analytics", desc: "Actionable reports on your entire supply chain" },
];

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function submit(values: FormValues) {
    setError("");
    try {
      await login(values.email, values.password);
      const redirect = new URLSearchParams(location.search).get("redirect") || "/dashboard";
      navigate(redirect, { replace: true });
    } catch {
      setError("Invalid email or password. Please try again.");
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      backgroundColor: "#0a0a0f",
    }}>
      {/* ── Left Panel ── */}
      <div style={{
        flex: "1",
        display: "none",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "3rem",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(145deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      }} className="lg:flex">
        {/* Background blobs */}
        <div style={{
          position: "absolute", top: "-20%", left: "-10%",
          width: "60%", height: "60%", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-20%", right: "-10%",
          width: "60%", height: "60%", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Logo */}
        <div style={{ position: "relative", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Warehouse size={22} color="white" />
            </div>
            <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}>
              OptiStock
            </span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ position: "relative", zIndex: 10 }}>
          <div style={{
            display: "inline-block", marginBottom: "1.5rem",
            padding: "0.3rem 0.9rem", borderRadius: "999px",
            background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)",
          }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#a5b4fc", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Warehouse Management
            </span>
          </div>

          <h1 style={{
            fontSize: "3.25rem", fontWeight: 800, color: "white",
            lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "1.25rem",
          }}>
            One platform.<br />
            <span style={{
              background: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Every warehouse.
            </span>
          </h1>

          <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, maxWidth: "400px" }}>
            Real-time inventory visibility, intelligent transfers, and deep analytics — built for teams that can't afford to guess.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ position: "relative", zIndex: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {features.map((f) => (
              <div key={f.title} style={{
                padding: "1rem",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                backdropFilter: "blur(8px)",
              }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  background: "rgba(99,102,241,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "0.6rem",
                }}>
                  <f.icon size={16} color="#818cf8" />
                </div>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "white", marginBottom: "0.25rem" }}>
                  {f.title}
                </div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div style={{
        width: "100%",
        maxWidth: "480px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "2.5rem",
        background: "#0f0f17",
        borderLeft: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* Mobile logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "3rem" }} className="lg:hidden">
          <div style={{
            width: "36px", height: "36px", borderRadius: "9px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Warehouse size={18} color="white" />
          </div>
          <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "white" }}>OptiStock</span>
        </div>

        {/* Form header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.875rem", fontWeight: 700, color: "white", letterSpacing: "-0.025em", marginBottom: "0.5rem" }}>
            Welcome back
          </h2>
          <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.4)" }}>
            Sign in to your OptiStock workspace
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: "0.875rem 1rem",
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "10px",
            marginBottom: "1.5rem",
            fontSize: "0.875rem",
            color: "#fca5a5",
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(submit)} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "rgba(255,255,255,0.6)", marginBottom: "0.5rem" }}>
              Email address
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              {...register("email")}
              style={{
                width: "100%", height: "44px", padding: "0 0.875rem",
                background: "rgba(255,255,255,0.05)",
                border: errors.email ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px", color: "white", fontSize: "0.9rem",
                outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => { e.target.style.borderColor = "rgba(99,102,241,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
              onBlur={(e) => { e.target.style.borderColor = errors.email ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
            />
            {errors.email && (
              <p style={{ marginTop: "0.375rem", fontSize: "0.75rem", color: "#f87171" }}>{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "rgba(255,255,255,0.6)" }}>
                Password
              </label>
              <Link to="/forgot-password" style={{ fontSize: "0.78rem", color: "#818cf8", textDecoration: "none", fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
                style={{
                  width: "100%", height: "44px", padding: "0 2.75rem 0 0.875rem",
                  background: "rgba(255,255,255,0.05)",
                  border: errors.password ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px", color: "white", fontSize: "0.9rem",
                  outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(99,102,241,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                onBlur={(e) => { e.target.style.borderColor = errors.password ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(255,255,255,0.35)", padding: "0.25rem",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p style={{ marginTop: "0.375rem", fontSize: "0.75rem", color: "#f87171" }}>{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%", height: "44px",
              background: isSubmitting
                ? "rgba(99,102,241,0.5)"
                : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              border: "none", borderRadius: "10px",
              color: "white", fontSize: "0.9rem", fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "opacity 0.2s, transform 0.15s, box-shadow 0.2s",
              boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={(e) => { if (!isSubmitting) { e.currentTarget.style.opacity = "0.92"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(99,102,241,0.45)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.35)"; }}
            onMouseDown={(e) => { if (!isSubmitting) e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Footer */}
        <p style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.85rem", color: "rgba(255,255,255,0.35)" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "#818cf8", textDecoration: "none", fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
