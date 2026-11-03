"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || "Sign-in failed.");
      else router.replace("/admin/dashboard");
    } catch { setError("Unable to sign in. Please try again."); }
    finally { setBusy(false); }
  }

  return <section className="admin-page">
    <form className="admin-login" onSubmit={submit}>
      <div className="section-eyebrow">RESTRICTED ACCESS</div>
      <h1>Administrator sign in</h1>
      <p className="muted">This area is restricted to the authorized site administrator.</p>
      <label>Email address<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} /></label>
      <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} /></label>
      {error && <p className="form-message" role="alert">{error}</p>}
      <button className="button button-primary submit-button" disabled={busy}>{busy ? "Signing in…" : "Sign in securely"}</button>
    </form>
  </section>;
}
