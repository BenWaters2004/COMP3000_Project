import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function groupCount(list, key) {
  const map = new Map();
  list.forEach((item) => {
    const raw = (item?.[key] || "").trim();
    const k = raw || "Unspecified";
    map.set(k, (map.get(k) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function lastNDays(n = 7) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d);
  }
  return out;
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function loadEmployees(search = "") {
    setLoading(true);
    setErr(null);

    try {
      const meRes = await api.get("/api/auth/me");
      const user = meRes.data;
      setMe(user);

      if (!user?.organisation_id) {
        setErr("Your account isn’t linked to an organisation yet.");
        setLoading(false);
        return;
      }

      const empRes = await api.get(`/api/organisations/${user.organisation_id}/employees`, {
        params: search.trim() ? { q: search.trim() } : {},
      });

      setEmployees(empRes.data?.employees || []);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) {
        navigate("/login", { replace: true });
      } else {
        setErr(e?.response?.data?.message || "Failed to load dashboard data.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadEmployees(q), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const byDept = useMemo(() => groupCount(employees, "department").slice(0, 10), [employees]);
  const byTitle = useMemo(() => groupCount(employees, "job_title").slice(0, 8), [employees]);

  const deptChartData = useMemo(() => {
    return {
      labels: byDept.map((d) => d.name),
      datasets: [
        {
          label: "Employees",
          data: byDept.map((d) => d.value),
        },
      ],
    };
  }, [byDept]);

  const titleChartData = useMemo(() => {
    return {
      labels: byTitle.map((d) => d.name),
      datasets: [
        {
          label: "Employees",
          data: byTitle.map((d) => d.value),
        },
      ],
    };
  }, [byTitle]);

  const simulationChartData = useMemo(() => {
    const days = lastNDays(7);
    return {
      labels: days.map((d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" })),
      datasets: [
        {
          label: "Simulations generated",
          data: days.map(() => 0), // placeholder until you have data
          tension: 0.3,
        },
      ],
    };
  }, []);

  const commonBarOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
        title: { display: false },
      },
      scales: {
        x: { ticks: { maxRotation: 25, minRotation: 25 } },
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    };
  }, []);

  const lineOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        tooltip: { enabled: true },
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    };
  }, []);

  async function logout() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("auth_token");
      navigate("/login", { replace: true });
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "28px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Dashboard</h1>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            {me ? `Signed in as ${me.name} (${me.email})` : "Loading account…"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button style={secondaryBtn} onClick={() => navigate("/setup")}>
            Open setup wizard
          </button>
          <button style={dangerBtn} onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      {err && (
        <div style={{ marginTop: 14, padding: 12, border: "1px solid #f2c2c2", borderRadius: 12, color: "crimson" }}>
          {err}
        </div>
      )}

      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <StatCard title="Employees" value={employees.length} />
        <StatCard title="Departments" value={new Set(employees.map(e => (e.department || "Unspecified").trim() || "Unspecified")).size} />
        <StatCard title="Simulations (last 7 days)" value="0" note="No simulation data yet" />
      </div>

      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card title="Employees by department">
          {employees.length === 0 ? (
            <EmptyState text="Add employees to see department breakdown." />
          ) : (
            <div style={{ height: 280 }}>
              <Bar data={deptChartData} options={commonBarOptions} />
            </div>
          )}
        </Card>

        <Card title="Top job titles">
          {employees.length === 0 ? (
            <EmptyState text="Add employees to see role distribution." />
          ) : (
            <div style={{ height: 280 }}>
              <Bar data={titleChartData} options={commonBarOptions} />
            </div>
          )}
        </Card>
      </div>

      <div style={{ marginTop: 12 }}>
        <Card
          title="Simulation activity (placeholder)"
          subtitle="Once you store generated simulation items, this will show real activity."
        >
          <div style={{ height: 260 }}>
            <Line data={simulationChartData} options={lineOptions} />
          </div>

          <div style={{ marginTop: 10, opacity: 0.75 }}>
            No simulation data yet. When you build “simulated emails”, store each generated item (org_id, employee_id, created_at).
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 18 }}>
        <Card title="Employees">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search employees (name, email, dept, title)…"
              style={inputStyle}
            />
            <button style={primaryBtn} onClick={() => navigate("/setup")}>
              Add employees
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            {loading ? (
              <div style={{ opacity: 0.75 }}>Loading employees…</div>
            ) : employees.length === 0 ? (
              <div style={{ opacity: 0.75 }}>No employees yet. Use the setup wizard to add employees.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Name", "Email", "Job title", "Department"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((e) => (
                      <tr key={e.id}>
                        <td style={tdStyle}>{e.first_name} {e.last_name}</td>
                        <td style={tdStyle}>{e.email}</td>
                        <td style={tdStyle}>{e.job_title || "—"}</td>
                        <td style={tdStyle}>{e.department || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 16, padding: 14 }}>
      <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
      {subtitle && <div style={{ opacity: 0.75, marginTop: 4 }}>{subtitle}</div>}
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}

function StatCard({ title, value, note }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 16, padding: 14 }}>
      <div style={{ opacity: 0.75 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{value}</div>
      {note && <div style={{ marginTop: 6, opacity: 0.7, fontSize: 13 }}>{note}</div>}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ padding: 14, border: "1px dashed #ccc", borderRadius: 14, opacity: 0.8 }}>
      {text}
    </div>
  );
}

const inputStyle = {
  minWidth: 280,
  width: "min(520px, 100%)",
  padding: 10,
  borderRadius: 12,
  border: "1px solid #ccc",
};

const thStyle = { textAlign: "left", padding: 8, borderBottom: "1px solid #eee" };
const tdStyle = { padding: 8, borderBottom: "1px solid #f2f2f2" };

const primaryBtn = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryBtn = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  fontWeight: 700,
  cursor: "pointer",
};

const dangerBtn = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #f2c2c2",
  background: "#fff",
  color: "crimson",
  fontWeight: 800,
  cursor: "pointer",
};
