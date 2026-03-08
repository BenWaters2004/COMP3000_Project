import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import OsintReport from "../components/OsintReport";
import PhishingModal from "../components/PhishingModal";
import AddEmployeeModal from "../components/AddEmployeeModal";
import EditEmployeeModal from "../components/EditEmployeeModal";
import {
  Users, Plus, Search, ChevronDown, ChevronUp,
  Mail, Briefcase, Building, AlertCircle, CheckCircle,
  Eye, Trash2, Edit, Shield, Send, Download
} from "lucide-react";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [report, setReport] = useState(null);
  const [selectedPhishingEmployee, setSelectedPhishingEmployee] = useState(null);
  const [phishingData, setPhishingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState(null);

  // Modal & messages
  const [showAddModal, setShowAddModal] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const meRes = await api.get("/api/auth/me");
      const user = meRes.data;
      setOrgId(user.organisation_id);

      if (!user?.organisation_id) {
        throw new Error("No organisation associated with this user");
      }

      const empRes = await api.get(`/api/organisations/${user.organisation_id}/employees`);
      setEmployees(empRes.data?.employees || empRes.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to load employees";
      setError(msg);
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const runOsint = async (employee) => {
    setSelectedEmployee(employee);
    setReport(null);
    try {
      const res = await api.post('/api/osint/generate', { employee_id: employee.id });
      setReport(res.data.data);
    } catch (err) {
      setError("Failed to run OSINT: " + (err.response?.data?.error || err.message));
    }
  };

  const openPhishingModal = (employee) => {
    setSelectedPhishingEmployee(employee);
    setPhishingData(null);
  };

  const closePhishingModal = () => {
    setSelectedPhishingEmployee(null);
    setPhishingData(null);
  };

  const openEditModal = (employee) => {
    setEditingEmployee(employee);
    setShowEditModal(true);
  };

  const generatePhishing = async (employee) => {
    try {
      const res = await api.post('/api/osint/generate-phishing', { employee_id: employee.id });
      setPhishingData(res.data.data);
      setSuccess("Phishing email generated successfully!");
    } catch (err) {
      setError("Failed to generate phishing email: " + (err.response?.data?.error || err.message));
    }
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm("Delete this employee permanently? This cannot be undone.")) return;

    if (!orgId) {
      setError("Organisation ID not loaded. Please refresh.");
      return;
    }

    try {
      await api.delete(`/api/employees/${id}`);

      setSuccess("Employee deleted successfully");
      setEmployees(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error("Delete error:", err.response?.data, err.response?.status);

      let msg = "Failed to delete employee";

      if (err.response?.status === 403) {
        msg = "Permission denied – you may not delete this employee.";
      } else if (err.response?.status === 404) {
        msg = "Employee not found.";
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }

      setError(msg);
    }
  };

  // Filter
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      `${emp.first_name || ''} ${emp.last_name || ''} ${emp.email || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "completed" && emp.osint_status === "completed") ||
      (statusFilter === "pending" && emp.osint_status !== "completed" && emp.osint_status !== "failed") ||
      (statusFilter === "failed" && emp.osint_status === "failed");

    return matchesSearch && matchesStatus;
  });

  // Sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getSortedEmployees = () => {
    if (!sortConfig.key) return filteredEmployees;

    return [...filteredEmployees].sort((a, b) => {
      const aValue = (a[sortConfig.key] || '').toString().toLowerCase();
      const bValue = (b[sortConfig.key] || '').toString().toLowerCase();
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = getSortedEmployees().slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(getSortedEmployees().length / itemsPerPage);

  // Reset page on filter/sort/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortConfig]);

  // Export to CSV
  const exportToCSV = () => {
    if (!filteredEmployees.length) {
      setError("No employees to export.");
      return;
    }

    const headers = ["First Name", "Last Name", "Email", "Job Title", "Department", "OSINT Status"];
    const rows = filteredEmployees.map(emp => [
      emp.first_name || "",
      emp.last_name || "",
      emp.email || "",
      emp.job_title || "",
      emp.department || "",
      emp.osint_status || "Pending"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "employees_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-950 p-6 md:p-8 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Employees</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage team members and run security simulations
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <button 
            onClick={exportToCSV}
            className="
              bg-gradient-to-r from-green-600 to-emerald-600 
              hover:from-green-700 hover:to-emerald-700 
              text-white px-5 py-2.5 rounded-xl font-medium 
              transition-all duration-200 shadow-md hover:shadow-lg 
              flex items-center gap-2
            "
          >
            <Download size={18} />
            Export CSV
          </button>

          <button 
            onClick={() => setShowAddModal(true)}
            className="
              bg-gradient-to-r from-blue-600 to-indigo-600 
              hover:from-blue-700 hover:to-indigo-700 
              text-white px-6 py-3 rounded-xl font-medium 
              transition-all duration-200 shadow-lg hover:shadow-xl 
              flex items-center gap-2
            "
          >
            <Plus size={18} />
            Add Employee
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full pl-11 pr-5 py-3.5 
              bg-white dark:bg-gray-800 
              border border-gray-300 dark:border-gray-600 
              rounded-xl 
              text-gray-900 dark:text-gray-200 
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/40
              transition-all duration-200
            "
          />
        </div>

        <div className="relative w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="
              w-full px-5 py-3.5 
              bg-white dark:bg-gray-800 
              border border-gray-300 dark:border-gray-600 
              rounded-xl 
              text-gray-900 dark:text-gray-200 
              focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/40
              transition-all duration-200 appearance-none
            "
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300 flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl text-green-700 dark:text-green-300 flex items-start gap-3">
          <CheckCircle size={20} className="mt-0.5 flex-shrink-0" />
          <div>{success}</div>
        </div>
      )}

      {/* Loading / Empty / Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400 flex items-center justify-center gap-3">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          Loading employees...
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow p-12 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
          <Users size={48} className="mx-auto mb-4 opacity-50 text-gray-400 dark:text-gray-500" />
          <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-gray-100">No employees found</h3>
          <p className="mb-6">Add team members or adjust filters.</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 mx-auto"
          >
            <Plus size={18} />
            Add Employee
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {[
                    { label: "Name", key: "first_name" },
                    { label: "Email", key: "email" },
                    { label: "Job Title", key: "job_title", className: "hidden md:table-cell" },
                    { label: "Department", key: "department", className: "hidden md:table-cell" },
                    { label: "OSINT Status", key: "osint_status" },
                    { label: "Actions", key: null }
                  ].map(header => (
                    <th 
                      key={header.key || header.label}
                      className={`text-left py-5 px-6 md:px-8 font-medium text-gray-600 dark:text-gray-300 ${header.className || ''}`}
                    >
                      {header.key ? (
                        <button
                          onClick={() => requestSort(header.key)}
                          className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition"
                        >
                          {header.label}
                          {sortConfig.key === header.key && (
                            sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </button>
                      ) : (
                        header.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentItems.map(emp => (
                  <tr 
                    key={emp.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
                  >
                    <td className="py-5 px-6 md:px-8 font-medium text-gray-900 dark:text-gray-100">
                      {emp.first_name} {emp.last_name}
                    </td>
                    <td className="py-5 px-6 md:px-8 text-gray-600 dark:text-gray-300">
                      {emp.email}
                    </td>
                    <td className="py-5 px-6 md:px-8 text-gray-600 dark:text-gray-300 hidden md:table-cell">
                      {emp.job_title || '—'}
                    </td>
                    <td className="py-5 px-6 md:px-8 text-gray-600 dark:text-gray-300 hidden md:table-cell">
                      {emp.department || '—'}
                    </td>
                    <td className="py-5 px-6 md:px-8">
                      <span className={`
                        inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-medium
                        ${emp.osint_status === 'completed' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' 
                          : emp.osint_status === 'failed' 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}
                      `}>
                        {emp.osint_status === 'completed' ? (
                          <CheckCircle size={14} />
                        ) : emp.osint_status === 'failed' ? (
                          <AlertCircle size={14} />
                        ) : (
                          <Shield size={14} />
                        )}
                        {emp.osint_status === 'completed' ? 'Completed' : 
                         emp.osint_status === 'failed' ? 'Failed' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-5 px-6 md:px-8 flex flex-wrap gap-3 md:gap-4 text-sm">
                      <button
                        onClick={() => runOsint(emp)}
                        className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                        title="View OSINT report"
                      >
                        <Eye size={16} />
                        OSINT
                      </button>
                      <button 
                        onClick={() => openPhishingModal(emp)}
                        className="flex items-center gap-1.5 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors"
                        title="Phishing simulation"
                      >
                        <Send size={16} />
                        Phishing
                      </button>
                      <button 
                        onClick={() => openEditModal(emp)}  // ← new
                        className="flex items-center gap-1.5 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 font-medium transition-colors"
                        title="Edit employee"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button 
                        onClick={() => deleteEmployee(emp.id)}
                        className="flex items-center gap-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                        title="Delete employee"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-1"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-1"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddEmployeeModal
          orgId={orgId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setSuccess("Employee added successfully");
            loadData();
          }}
          api={api}
        />
      )}

      {selectedEmployee && (
        <OsintReport 
          employee={selectedEmployee} 
          report={report} 
          onClose={() => setSelectedEmployee(null)} 
        />
      )}

      {selectedPhishingEmployee && (
        <PhishingModal
          employee={selectedPhishingEmployee}
          phishingData={phishingData}
          onClose={closePhishingModal}
          onGenerate={generatePhishing}
        />
      )}

      {showEditModal && editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          orgId={orgId}
          onClose={() => {
            setShowEditModal(false);
            setEditingEmployee(null);
          }}
          onSuccess={(updatedEmployee) => {
            setSuccess("Employee updated successfully");
            setEmployees(prev =>
              prev.map(e => (e.id === updatedEmployee.id ? updatedEmployee : e))
            );
            setShowEditModal(false);
            setEditingEmployee(null);
          }}
          api={api}
        />
      )}
    </div>
  );
}