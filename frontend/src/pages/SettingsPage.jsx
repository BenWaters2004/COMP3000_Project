import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import {
  Building2, Globe, Upload, Clock, Palette, Save,
  AlertCircle, CheckCircle2, Users, Trash2, KeyRound, Plus,
  Eye, EyeOff
} from "lucide-react";

export default function OrganisationSettingsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [orgId, setOrgId] = useState(null);

  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  // Form state
  const [form, setForm] = useState({
    name: "",
    website: "",
    industry: "",
    size: "",
    simulation_frequency: "weekly",
    timezone: "Europe/London",
    primary_color: "#3b82f6",
    enable_mfa: true,
    send_reports: true,
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  // Dropdown options from API
  const [industries, setIndustries] = useState([]);
  const [companySizes, setCompanySizes] = useState([]);
  const [frequencies, setFrequencies] = useState([]);
  const [timezones, setTimezones] = useState([]);

  // Admins
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [addingAdmin, setAddingAdmin] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Get current user to know organisation_id
      const meRes = await api.get("/api/auth/me");
      const user = meRes.data;
      setOrgId(user.organisation_id);

      if (!user?.organisation_id) {
        throw new Error("No organisation associated with this user");
      }

      const orgId = user.organisation_id;

      // Step 2: Parallel fetch everything else
      const [
        industriesRes,
        sizesRes,
        freqRes,
        tzRes,
        orgRes,
        adminsRes
      ] = await Promise.all([
        api.get("/api/settings/industries"),
        api.get("/api/settings/company-sizes"),
        api.get("/api/settings/frequencies"),
        api.get("/api/settings/timezones"),
        api.get(`/api/organisations/${orgId}`),
        api.get(`/api/organisations/${orgId}/admins`),
      ]);

      // Process responses
      const org = orgRes.data.organisation || orgRes.data;
      const settings = org.settings || org.organisation_settings || {};

      setIndustries(industriesRes.data || []);
      setCompanySizes(sizesRes.data.map(v => ({ value: v, label: v })) || []);
      setFrequencies(freqRes.data || []);

      // Timezones: flatten if grouped
      const flatTz = Array.isArray(tzRes.data)
        ? tzRes.data.flatMap(group => group.zones || group || [])
        : [];
      setTimezones(flatTz);

      // Set form values
      setForm({
        name: org.name || "",
        website: org.website || "",
        industry: org.industry || "",
        size: org.size || "",
        simulation_frequency: settings.simulation_frequency || "weekly",
        timezone: settings.timezone || "Europe/London",
        primary_color: settings.primary_color || "#3b82f6",
        enable_mfa: settings.enable_mfa ?? true,
        send_reports: settings.send_reports ?? true,
      });

      if (org.logo_path) {
        setLogoPreview(`${apiBase}/storage/${org.logo_path}`);
      }

      setAdmins(adminsRes.data || []);

    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to load settings";
      setError(msg);
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Logo must be under 2MB");
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!orgId) {
      setError("Organisation ID not loaded. Please refresh.");
      setSaving(false);
      return;
    }


    if (!form.name?.trim()) {
      setError("Organisation name is required.");
      setSaving(false);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // PART 1: Organisation update (use POST + _method)
      const fd = new FormData();
      fd.append('_method', 'POST');          // ← this is the key!
      fd.append('name', form.name.trim());
      fd.append('website', (form.website || '').trim());
      fd.append('industry', form.industry || '');
      fd.append('size', form.size || '');
      if (logoFile) fd.append('logo', logoFile);

      await api.post(`/api/organisations/${orgId}/update`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });


      // ────────────────────────────────────────────────
      // PART 2: Update settings (pure JSON – no FormData)
      // ────────────────────────────────────────────────
      const settingsRes = await api.post(`/api/organisations/${orgId}/settings`, {
        simulation_frequency: form.simulation_frequency,
        timezone: form.timezone,
        primary_color: form.primary_color,
        enable_mfa: form.enable_mfa,
        send_reports: form.send_reports,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setSuccess("Organisation settings saved successfully");
      setLogoFile(null);
      await loadAllData(); // refresh everything
    } catch (err) {

      let msg = "Failed to save changes";

      if (err.response) {
        // HTTP error (422, 403, 405, etc.)

        if (err.response.status === 422) {
          const errors = err.response.data.errors || {};
          msg = Object.values(errors)[0]?.[0] || err.response.data.message || msg;
        } else if (err.response.data?.message) {
          msg = err.response.data.message;
        } else if (err.response.status === 405) {
          msg = "Method not allowed – please check backend routes";
        } else if (err.response.status === 403) {
          msg = "Permission denied – you may not own this organisation";
        } else if (err.response.status === 404) {
          msg = "Organisation not found – please reload";
        }
      } else if (err.request) {
        // No response received (network error, CORS, timeout)
        msg = "Network error – cannot reach server. Check connection or backend status.";
      } else {
        // Something else (e.g. TypeError)
        msg = `Unexpected error: ${err.message}`;
      }

      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleNewAdminChange = (e) => {
    const { name, value } = e.target;
    setNewAdmin(prev => ({ ...prev, [name]: value }));
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAddingAdmin(true);
    setError(null);

    try {
      await api.post(`/api/organisations/${me?.organisation_id}/admins`, {
        name: newAdmin.name,
        email: newAdmin.email,
        password: newAdmin.password,
        password_confirmation: newAdmin.password_confirmation,
      });

      setNewAdmin({ name: "", email: "", password: "", password_confirmation: "" });
      setSuccess("Admin added successfully");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add admin");
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm("Remove this admin?")) return;

    try {
      await api.delete(`/api/organisations/${me?.organisation_id}/admins/${adminId}`);
      setSuccess("Admin removed");
      setAdmins(prev => prev.filter(a => a.id !== adminId));
    } catch (err) {
      setError("Failed to remove admin");
    }
  };

  const handleResetPassword = async (adminId) => {
    try {
      await api.post(`/api/organisations/${me?.organisation_id}/admins/${adminId}/reset-password`);
      setSuccess("Password reset link sent");
    } catch (err) {
      setError("Failed to send reset link");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading organisation settings...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Organisation Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage branding, simulation preferences and team access</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition disabled:opacity-60 shadow-md"
        >
          <Save size={18} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300 flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-8 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl text-green-700 dark:text-green-300 flex items-start gap-3">
          <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0" />
          <div>{success}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column – main settings */}
        <div className="lg:col-span-8 space-y-10">
          {/* General Information */}
          <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-7 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="text-blue-600" size={28} />
              <h2 className="text-2xl font-semibold">General Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/40 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Website</label>
                <input
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/40 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Industry</label>
                <select name="industry" value={form.industry} onChange={handleChange} className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/40 transition-all duration-200 appearance-none">
                  <option value="">Select industry</option>
                  {industries.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Company Size</label>
                <select name="size" value={form.size} onChange={handleChange} className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/40 transition-all duration-200 appearance-none">
                  <option value="">Select size</option>
                  {companySizes.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Branding */}
          <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-7 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="text-purple-600" size={28} />
              <h2 className="text-2xl font-semibold">Branding</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Logo</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden relative group">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center text-gray-400">
                        <Upload size={32} />
                        <p className="text-xs mt-2">No logo</p>
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                      <span className="bg-white text-gray-800 px-4 py-2 rounded-xl text-sm font-medium">Change</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogo} />
                    </label>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Recommended: 512×512 px, PNG/SVG</p>
                    <p className="text-xs text-gray-500 mt-1">Max 2 MB</p>
                    <label className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 cursor-pointer text-sm font-medium">
                      <Upload size={16} />
                      Upload logo
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogo} />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Primary Color</label>
                <div className="flex items-center gap-6">
                  <input
                    type="color"
                    name="primary_color"
                    value={form.primary_color}
                    onChange={handleChange}
                    className="w-24 h-24 rounded-xl cursor-pointer border border-gray-300 dark:border-gray-600"
                  />
                  <div className="text-center">
                    <div
                      className="w-12 h-12 rounded-xl border border-gray-300 dark:border-gray-600 shadow-inner mx-auto"
                      style={{ backgroundColor: form.primary_color }}
                    />
                    <p className="text-xs font-mono mt-2 text-gray-500">{form.primary_color}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Simulation & Security */}
          <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-7 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="text-amber-600" size={28} />
              <h2 className="text-2xl font-semibold">Simulation & Security</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Simulation Frequency</label>
                <select name="simulation_frequency" value={form.simulation_frequency} onChange={handleChange} className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/40 transition-all duration-200 appearance-none">
                  {frequencies.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Timezone</label>
                <select name="timezone" value={form.timezone} onChange={handleChange} className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/40 transition-all duration-200 appearance-none">
                  {timezones.map(tz => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label || tz.value.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-6 md:col-span-2 pt-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="enable_mfa"
                    checked={form.enable_mfa}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium">Require MFA for all users</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Enforce two-factor authentication</div>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="send_reports"
                    checked={form.send_reports}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-500/40dark:bg-gray-700"
                  />
                  <div>
                    <div className="font-medium">Send weekly summary reports</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Email digest of risk metrics</div>
                  </div>
                </label>
              </div>
            </div>
          </section>
        </div>

        {/* Right column – Admins */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-7 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="text-indigo-600" size={28} />
                <h2 className="text-2xl font-semibold">Admins</h2>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{admins.length} admin{admins.length !== 1 ? 's' : ''}</div>
            </div>

            {admins.length === 0 ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">No additional admins yet</div>
            ) : (
              <div className="space-y-4">
                {admins.map(admin => (
                  <div
                    key={admin.id}
                    className="
                      bg-gray-50 dark:bg-gray-900/50 
                      rounded-2xl px-5 py-5
                      border border-gray-200 dark:border-gray-700
                    "
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="
                        w-10 h-10 bg-indigo-100 dark:bg-indigo-900 
                        rounded-full flex items-center justify-center 
                        text-indigo-600 dark:text-indigo-300 font-semibold flex-shrink-0
                      ">
                        {admin.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {admin.name || 'Unnamed'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {admin.email}
                        </div>
                      </div>
                    </div>

                    {/* Actions – new row, full width on mobile */}
                    <div className="flex flex-wrap gap-3 text-sm">
                      <button
                        onClick={() => handleResetPassword(admin.id)}
                        className="
                          flex items-center gap-1.5 px-4 py-2 
                          text-amber-600 hover:text-amber-800 
                          dark:text-amber-400 dark:hover:text-amber-300 
                          bg-amber-50 dark:bg-amber-950/30 
                          rounded-lg transition-colors
                        "
                        title="Send password reset link"
                      >
                        <KeyRound size={16} />
                        Reset password
                      </button>

                      <button
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="
                          flex items-center gap-1.5 px-4 py-2 
                          text-red-600 hover:text-red-800 
                          dark:text-red-400 dark:hover:text-red-300 
                          bg-red-50 dark:bg-red-950/30 
                          rounded-lg transition-colors
                        "
                        title="Remove this admin"
                      >
                        <Trash2 size={16} />
                        Remove admin
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Add Admin Form */}
          <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-7 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Plus className="text-indigo-600" size={28} />
              <h2 className="text-xl font-semibold">Add New Admin</h2>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <input
                name="name"
                placeholder="Full name"
                value={newAdmin.name}
                onChange={handleNewAdminChange}
                className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/40 transition-all duration-200"
                required
              />
              <input
                name="email"
                type="email"
                placeholder="Email address"
                value={newAdmin.email}
                onChange={handleNewAdminChange}
                className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/40 transition-all duration-200"
                required
              />

              {/* Password with toggle */}
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={newAdmin.password}
                  onChange={handleNewAdminChange}
                  className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/40 transition-all duration-200 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Confirm Password with toggle */}
              <div className="relative">
                <input
                  name="password_confirmation"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={newAdmin.password_confirmation}
                  onChange={handleNewAdminChange}
                  className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/40 transition-all duration-200 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={addingAdmin}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-medium transition disabled:opacity-60 mt-2"
              >
                {addingAdmin ? "Adding..." : "Add Admin"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}