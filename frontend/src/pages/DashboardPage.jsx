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
import { Bar } from "react-chartjs-2";
import { Users, Shield, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function DashboardPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
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
  const pendingOsint = employees.filter(e => !["completed", "failed"].includes(e.osint_status)).length;

  // Risk Exposure: Average of all employees
  const riskExposure = useMemo(() => {
    if (!employees.length) return "No Data";

    const riskMap = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
      // fallback for unknown/missing
      "": 2,
      null: 2,
      undefined: 2
    };

    const totalRisk = employees.reduce((sum, emp) => {
      const status = (emp.osint_status || "").toLowerCase();
      return sum + (riskMap[status] || 2);
    }, 0);

    const avg = totalRisk / employees.length;
    const rounded = Math.round(avg);

    const reverseMap = {
      1: "Low",
      2: "Medium",
      3: "High",
      4: "Critical"
    };

    return reverseMap[rounded] || "Medium";
  }, [employees]);

  // Department chart data (dark mode aware)
  const deptChartData = useMemo(() => {
    const map = {};
    employees.forEach(e => {
      const dept = (e.department || "Unspecified").trim();
      map[dept] = (map[dept] || 0) + 1;
    });

    const entries = Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return {
      labels: entries.map(d => d.name),
      datasets: [{
        label: "Employees",
        data: entries.map(d => d.value),
        backgroundColor: "#3b82f6", // blue-500
        borderColor: "#2563eb",     // blue-600
        borderWidth: 1,
      }]
    };
  }, [employees]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(107, 114, 128, 0.2)" }, // gray-500/20
        ticks: { color: "#6b7280" } // gray-500
      },
      x: {
        grid: { display: false },
        ticks: { color: "#6b7280" }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 md:p-8 transition-colors duration-300">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {me ? `Welcome back, ${me.name}` : "Loading user..."}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300 flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard 
            icon={<Users size={28} />} 
            title="Total Employees" 
            value={totalEmployees} 
            color="blue" 
          />
          <StatCard 
            icon={<Shield size={28} />} 
            title="OSINT Completed" 
            value={completedOsint} 
            color="emerald" 
          />
          <StatCard 
            icon={<AlertTriangle size={28} />} 
            title="Pending OSINT" 
            value={pendingOsint} 
            color="amber" 
          />
          <StatCard 
            icon={<TrendingUp size={28} />} 
            title="Risk Exposure" 
            value={riskExposure} 
            color={
              riskExposure === "Critical" ? "red" :
              riskExposure === "High" ? "orange" :
              riskExposure === "Medium" ? "amber" : "emerald"
            } 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Department Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Employees by Department
            </h3>
            <div className="h-80">
              <Bar 
                data={deptChartData} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: { labels: { color: "#6b7280" } }
                  }
                }} 
              />
            </div>
          </div>

          {/* Placeholder for future charts */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-8 border border-gray-200 dark:border-gray-700 flex flex-col">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              OSINT Activity (Last 7 Days)
            </h3>
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <p>Simulation activity chart coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color = "blue" }) {
  const colors = {
    blue:    "bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    emerald: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    amber:   "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    orange:  "bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    red:     "bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
  };

  return (
    <div className={`
      bg-white dark:bg-gray-800 
      rounded-3xl shadow-sm p-6 md:p-8 
      flex items-center gap-6 
      border ${colors[color]}
      transition-colors duration-300
    `}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
          {value}
        </p>
      </div>
    </div>
  );
}