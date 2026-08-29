import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Warehouse, CheckCircle } from "lucide-react";
import { apiClient } from "@/api/client";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await apiClient.post("/auth/forgot-password", { email });
    } catch {
      // silently fail per security best practice
    } finally {
      setSent(true);
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: "radial-gradient(ellipse 80% 60% at 20% -10%, rgba(99,102,241,0.2) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 110%, rgba(168,85,247,0.15) 0%, transparent 60%), #0a0a0f",
      padding: "2rem",
    }}>
      <div style={{
        width: "100%", maxWidth: "420px",
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

        {sent ? (
          /* Success state */
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "50%",
              background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.5rem",
            }}>
              <CheckCircle size={32} color="#34d399" />
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "white", marginBottom: "0.75rem" }}>Check your email</h2>
            <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: "2rem" }}>
              If <strong style={{ color: "rgba(255,255,255,0.7)" }}>{email}</strong> is registered,
              we've sent password reset instructions.
            </p>
            <Link to="/login" style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              color: "#818cf8", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600,
            }}>
              <ArrowLeft size={16} /> Back to sign in
            </Link>
          </div>
        ) : (
          /* Form */
          <>
            <div style={{
              width: "48px", height: "48px", borderRadius: "12px",
              background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: "1.5rem",
            }}>
              <Mail size={22} color="#818cf8" />
            </div>

            <h2 style={{ fontSize: "1.625rem", fontWeight: 700, color: "white", letterSpacing: "-0.025em", marginBottom: "0.5rem" }}>
              Forgot password?
            </h2>
            <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.4)", marginBottom: "2rem", lineHeight: 1.6 }}>
              No worries — enter your email and we'll send you reset instructions.
            </p>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "rgba(255,255,255,0.55)", marginBottom: "0.4rem" }}>
                  Email address
                </label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  style={{
                    width: "100%", height: "44px", padding: "0 0.875rem",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px", color: "white", fontSize: "0.9rem",
                    outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(99,102,241,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <button type="submit" disabled={loading} style={{
                width: "100%", height: "44px",
                background: loading ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                border: "none", borderRadius: "10px", color: "white", fontSize: "0.9rem", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
              }}>
                {loading ? "Sending…" : "Send reset instructions"}
              </button>
            </form>

            <div style={{ marginTop: "1.75rem", textAlign: "center" }}>
              <Link to="/login" style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "0.85rem",
                transition: "color 0.2s",
              }}>
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
