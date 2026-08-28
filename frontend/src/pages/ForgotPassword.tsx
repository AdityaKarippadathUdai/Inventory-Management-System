import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function ForgotPassword() { const [email, setEmail] = useState(""); const [sent, setSent] = useState(false); async function submit(event: FormEvent) { event.preventDefault(); await apiClient.post("/auth/forgot-password", { email }); setSent(true); } return <main className="min-h-screen grid place-items-center bg-secondary/40 p-6"><form onSubmit={submit} className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm"><h1 className="text-2xl font-semibold">Reset your password</h1><p className="mt-2 text-sm text-muted-foreground">Enter your email and we will start the reset process.</p>{sent ? <p className="mt-6 text-sm text-primary">If the account exists, reset instructions will be sent.</p> : <><label className="mt-7 block text-sm font-medium">Email<Input className="mt-2" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><Button className="mt-5 w-full">Send reset request</Button></>}<Link className="mt-5 block text-center text-sm text-primary hover:underline" to="/login">Back to sign in</Link></form></main>; }
