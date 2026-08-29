import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    await apiClient.post("/auth/forgot-password", { email });
    setSent(true);
  }
  return (
    <main className="min-h-screen grid place-items-center bg-mesh-dark p-6 relative">
      <div className="absolute inset-0 bg-background/50 backdrop-blur-3xl pointer-events-none" />
      <div className="w-full max-w-md glass-panel p-10 rounded-2xl animate-fade-in z-10 relative">
        <h1 className="text-3xl font-bold tracking-tight text-white">Reset Password</h1>
        <p className="mt-2 text-sm text-gray-400">Enter your email and we will start the reset process.</p>
        
        {sent ? (
          <div className="mt-8 rounded-lg border border-primary/50 bg-primary/10 p-5 text-sm text-primary font-medium animate-fade-in">
            If the account exists, reset instructions will be sent.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-6">
            <label className="block text-sm font-medium text-gray-300">
              Email
              <Input
                className="mt-2 bg-black/40 border-gray-700/50 focus-visible:ring-primary text-white h-11"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
              />
            </label>
            <Button className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40">
              Send reset request
            </Button>
          </form>
        )}
        <Link className="mt-8 block text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors" to="/login">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
