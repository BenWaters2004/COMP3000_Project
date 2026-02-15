import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import OsintReport from '../components/OsintReport';
import PhishingModal from '../components/PhishingModal';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [report, setReport] = useState(null);
  const [selectedPhishingEmployee, setSelectedPhishingEmployee] = useState(null);
  const [phishingData, setPhishingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Get current logged-in user (to know organisation_id)
      const meRes = await api.get("/api/auth/me");
      const user = meRes.data;
      setCurrentUser(user);

      if (!user?.organisation_id) {
        console.warn("User has no organisation");
        setLoading(false);
        return;
      }

      // 2. Fetch employees for this organisation (your working route)
      const empRes = await api.get(`/api/organisations/${user.organisation_id}/employees`);
      setEmployees(empRes.data?.employees || empRes.data || []);
    } catch (err) {
      console.error("Failed to load employees", err);
    } finally {
      setLoading(false);
    }
  };

  const runOsint = async (employee) => {
    setSelectedEmployee(employee);
    setReport(null);

    try {
      const res = await api.post('/api/osint/generate', {
        employee_id: employee.id
      });
      setReport(res.data.data);
    } catch (err) {
      alert("Failed to run OSINT: " + (err.response?.data?.error || err.message));
    }
  };

  const openPhishingModal = async (employee) => {
    setSelectedPhishingEmployee(employee);
    setPhishingData(null);
  };

  const closePhishingModal = () => {
    setSelectedPhishingEmployee(null);
    setPhishingData(null);
  };

  const generatePhishing = async (employee) => {
    try {
      const res = await api.post('/api/osint/generate-phishing', {
        employee_id: employee.id
      });
      // Refresh phishing data
      setPhishingData(res.data.data);
      alert("Phishing email generated successfully!");
    } catch (err) {
      alert("Failed to generate phishing email: " + (err.response?.data?.error || err.message));
    }
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm("Delete this employee permanently?")) return;
    try {
      await api.delete(`/api/employees/${id}`);
      setEmployees(employees.filter(e => e.id !== id));
    } catch (err) {
      alert("Failed to delete employee");
    }
  };

  const filteredEmployees = employees.filter(e =>
    `${e.first_name} ${e.last_name} ${e.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium transition">
          + Add Employee
        </button>
      </div>

      <input
        type="text"
        placeholder="Search employees..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md px-5 py-3 border border-gray-300 rounded-2xl mb-6"
      />

      <div className="bg-white rounded-3xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-5 px-8 font-medium text-gray-500">Name</th>
              <th className="text-left py-5 px-8 font-medium text-gray-500">Email</th>
              <th className="text-left py-5 px-8 font-medium text-gray-500">Job Title</th>
              <th className="text-left py-5 px-8 font-medium text-gray-500">Department</th>
              <th className="text-left py-5 px-8 font-medium text-gray-500">OSINT Status</th>
              <th className="w-48"></th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(emp => (
              <tr key={emp.id} className="border-t hover:bg-gray-50 transition-colors">
                <td className="py-5 px-8 font-medium">{emp.first_name} {emp.last_name}</td>
                <td className="py-5 px-8 text-gray-600">{emp.email}</td>
                <td className="py-5 px-8 text-gray-600">{emp.job_title || '—'}</td>
                <td className="py-5 px-8 text-gray-600">{emp.department || '—'}</td>
                <td className="py-5 px-8">
                  <span className={`inline-block px-4 py-1 rounded-full text-xs font-medium ${
                    emp.osint_status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    emp.osint_status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {emp.osint_status === 'completed' ? 'Completed' : 
                     emp.osint_status === 'failed' ? 'Failed' : 'Pending'}
                  </span>
                </td>
                <td className="py-5 px-8 flex gap-4">
                  <button
                    onClick={() => runOsint(emp)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View OSINT
                  </button>
                  <button 
                    onClick={() => openPhishingModal(emp)}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    {emp.phishing_email ? 'View Phishing Email' : 'Generate & View Email'}
                  </button>
                  <button className="text-amber-600 hover:text-amber-700 font-medium">Edit</button>
                  <button 
                    onClick={() => deleteEmployee(emp.id)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedEmployee && (
        <OsintReport 
          employee={selectedEmployee} 
          report={report} 
          token={token}
          onClose={() => setSelectedEmployee(null)} 
        />
      )}

      {selectedPhishingEmployee && (
        <PhishingModal
          employee={selectedPhishingEmployee}
          phishingData={phishingData}
          onClose={closePhishingModal}
          onGenerate={(emp) => generatePhishing(emp)}
          token={token}
        />
      )}
    </div>
  );
}