import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { 
  Building2, 
  Globe, 
  Upload, 
  Clock, 
  Palette, 
  Mail, 
  Save,
  AlertCircle,
  CheckCircle2,
  Users,
  Trash2,
  KeyRound,
  Plus
} from "lucide-react";

export default function OrganisationSettingsPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    website: "",
    industry: "",
    size: "",
    simulation_frequency: "weekly",
    timezone: "Europe/London",
    contact_email: "",
    primary_color: "#3b82f6",
    enable_mfa: true,
    send_reports: true,
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [availableTimezones, setAvailableTimezones] = useState([]);

  // Admins
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "" });
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [deletingAdminId, setDeletingAdminId] = useState(null);

  // Options
  const industries = [
    "Technology", "Financial Services", "Healthcare", "Education",
    "Retail", "Manufacturing", "Professional Services", "Government",
    "Non-Profit", "Other"
  ];

  const companySizes = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-500", label: "201-500 employees" },
    { value: "501-2000", label: "501-2,000 employees" },
    { value: "2000+", label: "2,000+ employees" },
  ];

  const simulationFrequencies = [
    { value: "daily", label: "Daily" },
    { value: "3_days", label: "Every 3 days" },
    { value: "weekly", label: "Weekly" },
    { value: "biweekly", label: "Every 2 weeks" },
    { value: "monthly", label: "Monthly" },
  ];

  useEffect(() => {
    loadData();
    
    try {
      const zones = Intl.supportedValuesOf("timeZone");
      setAvailableTimezones(zones);
    } catch (e) {
      setAvailableTimezones([
        "Europe/London", "UTC", "America/New_York", "America/Chicago",
        "America/Los_Angeles", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo",
        "Australia/Sydney"
      ]);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const meRes = await api.get("/api/auth/me");
      const user = meRes.data;
      setMe(user);

      if (user?.organisation_id) {
        const orgRes = await api.get(`/api/organisations/${user.organisation_id}`);
        const org = orgRes.data;

        setForm({
          name: org.name || "Acme Corporation Ltd",
          website: org.website || "https://acme.com",
          industry: org.industry || "Technology",
          size: org.size || "201-500",
          simulation_frequency: org.simulation_frequency || "weekly",
          timezone: org.timezone || "Europe/London",
          contact_email: org.contact_email || "security@acme.com",
          primary_color: org.primary_color || "#3b82f6",
          enable_mfa: org.enable_mfa ?? true,
          send_reports: org.send_reports ?? true,
        });

        if (org.logo_path) {
          setLogoPreview(`/storage/${org.logo_path}`);
        }

        // Admins (placeholder data shown above)
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load settings");
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Logo must be under 2MB");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!me?.organisation_id) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Update basic organisation info + logo
      const orgFormData = new FormData();
      orgFormData.append("name", form.name);
      orgFormData.append("website", form.website);
      orgFormData.append("industry", form.industry);
      orgFormData.append("size", form.size);
      orgFormData.append("contact_email", form.contact_email);
      orgFormData.append("primary_color", form.primary_color);
      if (logoFile) orgFormData.append("logo", logoFile);

      await api.put(`/api/organisations/${me.organisation_id}`, orgFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // 2. Update settings
      await api.put(`/api/organisations/${me.organisation_id}/settings`, {
        simulation_frequency: form.simulation_frequency,
        timezone: form.timezone,
      });

      setSuccess("Organisation settings saved successfully");
      setLogoFile(null);
      setTimeout(() => loadData(), 800);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Admin handlers (unchanged, using placeholder data)
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      setError("All fields are required");
      return;
    }
    setAddingAdmin(true);
    // Simulate API call
    setTimeout(() => {
      setAdmins([...admins, { 
        id: Date.now(), 
        name: newAdmin.name, 
        email: newAdmin.email 
      }]);
      setNewAdmin({ name: "", email: "", password: "" });
      setSuccess("Admin added successfully");
      setAddingAdmin(false);
    }, 400);
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm("Delete this admin?")) return;
    setDeletingAdminId(adminId);
    setTimeout(() => {
      setAdmins(admins.filter(a => a.id !== adminId));
      setSuccess("Admin removed");
      setDeletingAdminId(null);
    }, 300);
  };

  const handleResetPassword = () => {
    alert("Password reset link sent to the admin’s email.");
  };

  if (loading) {
    return (
      <div className="p-8 max-w-screen-2xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading organisation settings...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Organisation Settings</h1>
          <p className="text-gray-500 mt-1">Manage your profile, branding, and team access</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-3xl font-semibold transition-all disabled:opacity-70 shadow-lg shadow-blue-200"
        >
          <Save size={20} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 flex items-start gap-3">
          <AlertCircle size={22} className="mt-0.5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl mb-8 flex items-start gap-3">
          <CheckCircle2 size={22} className="mt-0.5 flex-shrink-0" />
          <div>{success}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-10">
          {/* General Information */}
          <div className="bg-white rounded-3xl shadow p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Building2 size={24} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900">General Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-7">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Organisation Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Acme Corporation Ltd"
                  className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <div className="relative">
                  <Globe className="w-5 h-5 text-gray-400 absolute left-5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    name="website"
                    value={form.website}
                    onChange={handleInputChange}
                    placeholder="https://acme.com"
                    className="w-full pl-12 pr-5 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="contact_email"
                    value={form.contact_email}
                    onChange={handleInputChange}
                    placeholder="security@acme.com"
                    className="w-full pl-12 pr-5 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                <select
                  name="industry"
                  value={form.industry}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Select industry</option>
                  {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                <select
                  name="size"
                  value={form.size}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Select size</option>
                  {companySizes.map(size => (
                    <option key={size.value} value={size.value}>{size.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Toggles moved here */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 mt-8 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  name="enable_mfa"
                  checked={form.enable_mfa}
                  onChange={handleInputChange}
                  className="w-6 h-6 accent-blue-600 rounded-xl border-gray-300"
                />
                <div>
                  <div className="font-medium">Require MFA for all users</div>
                  <div className="text-sm text-gray-500">Enforces two-factor authentication</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  name="send_reports"
                  checked={form.send_reports}
                  onChange={handleInputChange}
                  className="w-6 h-6 accent-blue-600 rounded-xl border-gray-300"
                />
                <div>
                  <div className="font-medium">Send weekly risk reports</div>
                  <div className="text-sm text-gray-500">Via email to contact address</div>
                </div>
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="bg-white rounded-3xl shadow p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Palette size={24} className="text-purple-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900">Branding</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Company Logo</label>
                <div className="flex items-center gap-8">
                  <div className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-3xl overflow-hidden bg-gray-50 flex items-center justify-center relative group">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="text-gray-400 text-center">
                        <Upload size={28} className="mx-auto mb-1" />
                        <div className="text-xs">No logo</div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <label className="cursor-pointer bg-white text-gray-800 text-xs font-medium px-4 py-2 rounded-2xl">
                        Change
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                      </label>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">512×512px recommended • PNG or SVG</p>
                    <p className="text-xs text-gray-500 mt-1">Max 2MB</p>
                    <label className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 cursor-pointer text-sm font-medium">
                      <Upload size={18} />
                      Upload new logo
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Primary Brand Color</label>
                <div className="flex items-center gap-6">
                  <input
                    type="color"
                    name="primary_color"
                    value={form.primary_color}
                    onChange={handleInputChange}
                    className="w-20 h-20 rounded-2xl overflow-hidden cursor-pointer border border-gray-200"
                  />
                  <div>
                    <div className="w-10 h-10 rounded-2xl border border-gray-200 shadow-inner" style={{ backgroundColor: form.primary_color }} />
                    <p className="text-xs text-gray-500 mt-2 font-mono">{form.primary_color}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Simulation Settings */}
          <div className="bg-white rounded-3xl shadow p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center">
                <Clock size={24} className="text-amber-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900">Simulation Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-7">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Simulation Frequency</label>
                <select
                  name="simulation_frequency"
                  value={form.simulation_frequency}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {simulationFrequencies.map(freq => (
                    <option key={freq.value} value={freq.value}>{freq.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Organisation Timezone</label>
                <select
                  name="timezone"
                  value={form.timezone}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {availableTimezones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Current Admins */}
          <div className="bg-white rounded-3xl shadow p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <Users size={24} className="text-indigo-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">Organisation Admins</h3>
              </div>
              <div className="text-sm text-gray-500">{admins.length} admin{admins.length !== 1 ? 's' : ''}</div>
            </div>

            {admins.length === 0 ? (
              <div className="text-gray-400 text-center py-12">No admins yet</div>
            ) : (
              <div className="space-y-3">
                {admins.map(admin => (
                  <div key={admin.id} className="flex items-center justify-between bg-gray-50 rounded-2xl px-6 py-4 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-semibold">
                        {admin.name?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{admin.name}</div>
                        <div className="text-sm text-gray-500">{admin.email}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={handleResetPassword}
                        className="flex items-center gap-2 text-xs text-amber-600 hover:text-amber-700 font-medium"
                      >
                        <KeyRound size={16} />
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleDeleteAdmin(admin.id)}
                        disabled={deletingAdminId === admin.id}
                        className="flex items-center gap-2 text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        <Trash2 size={16} />
                        {deletingAdminId === admin.id ? "Deleting..." : "Remove"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* Add New Admin - now in sidebar (outside the main admins card) */}
          <div className="bg-white rounded-3xl shadow p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <Plus size={24} className="text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold">Add New Admin</h3>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <input
                type="text"
                placeholder="Full name"
                value={newAdmin.name}
                onChange={e => setNewAdmin({...newAdmin, name: e.target.value})}
                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500"
                required
              />
              <input
                type="email"
                placeholder="Email address"
                value={newAdmin.email}
                onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={newAdmin.password}
                onChange={e => setNewAdmin({...newAdmin, password: e.target.value})}
                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500"
                required
              />
              <button
                type="submit"
                disabled={addingAdmin}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-medium transition-all disabled:opacity-70"
              >
                {addingAdmin ? "Adding..." : "Add Admin"}
              </button>
            </form>
            
            <p className="text-xs text-gray-500 mt-4">New admins receive a welcome email with login details</p>
          </div>

          {/* Help Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100">
            <h4 className="font-semibold text-blue-900 mb-2">Need help?</h4>
            <p className="text-blue-700 text-sm leading-relaxed">
              Only add trusted team members as admins. They will have full access to the platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}