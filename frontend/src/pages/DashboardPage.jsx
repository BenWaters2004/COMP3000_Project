import React, { useEffect, useState, useMemo } from "react";
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
import { Users, Shield, AlertTriangle, TrendingUp } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function DashboardPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const meRes = await api.get("/api/auth/me");
      const user = meRes.data;
      setMe(user);

      if (user?.organisation_id) {
        const empRes = await api.get(`/api/organisations/${user.organisation_id}/employees`);
        setEmployees(empRes.data?.employees || empRes.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard");
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const totalEmployees = employees.length;
  const completedOsint = employees.filter(e => e.osint_status === "completed").length;
  const pendingOsint = employees.filter(e => e.osint_status === "pending").length;

  // Charts
  const byDepartment = useMemo(() => {
    const map = {};
    employees.forEach(e => {
      const dept = (e.department || "Unspecified").trim();
      map[dept] = (map[dept] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [employees]);

  const deptChartData = {
    labels: byDepartment.map(d => d.name),
    datasets: [{ label: "Employees", data: byDepartment.map(d => d.value), backgroundColor: "#3b82f6" }],
  };

  return (
    <div className="p-8 max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {me ? `Welcome back, ${me.name}` : "Loading..."}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard icon={<Users size={28} />} title="Total Employees" value={totalEmployees} color="blue" />
        <StatCard icon={<Shield size={28} />} title="OSINT Completed" value={completedOsint} color="emerald" />
        <StatCard icon={<AlertTriangle size={28} />} title="Pending OSINT" value={pendingOsint} color="amber" />
        <StatCard icon={<TrendingUp size={28} />} title="Risk Exposure" value="Medium" color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Department Chart */}
        <div className="bg-white rounded-3xl shadow p-8">
          <h3 className="text-xl font-semibold mb-6">Employees by Department</h3>
          <div className="h-80">
            <Bar data={deptChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Placeholder for more charts */}
        <div className="bg-white rounded-3xl shadow p-8">
          <h3 className="text-xl font-semibold mb-6">OSINT Activity (Last 7 Days)</h3>
          <div className="h-80 flex items-center justify-center text-gray-400">
            Simulation activity chart coming soon
          </div>
        </div>
      </div>

      <div className="mt-12 text-center text-gray-400 text-sm">
        Add more employees to see richer statistics
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color = "blue" }) {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="bg-white rounded-3xl shadow p-8 flex items-start gap-6">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-4xl font-bold text-gray-900 mt-2">{value}</p>
      </div>
    </div>
  );
}