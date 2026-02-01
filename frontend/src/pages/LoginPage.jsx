import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }
    if (!isValidEmail(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/api/auth/login", {
        email: form.email.trim(),
        password: form.password,
      });

      localStorage.setItem("auth_token", res.data.token);

      // Optional: confirm
      await api.get("/api/auth/me");

      navigate("/dashboard", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) setError("Incorrect email or password.");
      else setError(err?.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 460, margin: "60px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>Organisation Login</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>Sign in to manage your organisation.</p>

      {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
          style={inputStyle}
        />
        <button disabled={submitting} style={primaryBtn}>
          {submitting ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

const inputStyle = { width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ccc" };
const primaryBtn = { padding: "10px 14px", borderRadius: 12, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 700 };
