import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle, Circle } from "lucide-react";
import { api } from "../lib/api";
import axios from 'axios';

const STEPS = [
  { key: "org", label: "Organisation" },
  { key: "admin", label: "Admin Account" },
  { key: "employees", label: "Employees" },
  { key: "frequency", label: "Frequency" },
  { key: "review", label: "Review" },
];

function isValidUrl(value) {
  if (!value || !value.trim()) return true;
  try {
    new URL(value.trim());
    return true;
  } catch {
    return false;
  }
}
function isValidEmail(value) {
  // Simple & reliable enough for UI validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}
function friendlyApiError(err, fallback = "Something went wrong. Please try again.") {
  const status = err?.response?.status;
  const data = err?.response?.data;
  if (status === 0 || status === undefined) return "Unable to reach the server. Please try again";
  if (status === 401) return "You’re not signed in. Please log in and try again.";
  if (status === 403) return "You don’t have permission to do that.";
  if (status === 409) return data?.message || "That action can’t be completed because of an existing record.";
  if (status >= 500) return "Server error. Please try again in a moment.";
  return data?.message || fallback;
}
function map422Errors(err) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  if (status === 422 && data?.errors) {
    const mapped = {};
    Object.keys(data.errors).forEach((k) => (mapped[k] = data.errors[k]?.[0]));
    return mapped;
  }
  return null;
}
export default function OrgSetupWizard() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [orgId, setOrgId] = useState(null);

  // Dynamic dropdown options
  const [industries, setIndustries] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [frequencies, setFrequencies] = useState([]);
  const [timezoneGroups, setTimezoneGroups] = useState([]);

  // Fetch options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [indRes, sizeRes, freqRes, tzRes] = await Promise.all([
          api.get('/api/settings/industries'),
          api.get('/api/settings/company-sizes'),
          api.get('/api/settings/frequencies'),
          api.get('/api/settings/timezones'),
        ]);

        setIndustries([{ value: "", label: "Select industry" }, ...indRes.data.map(name => ({ value: name, label: name }))]);
        setSizes([{ value: "", label: "Select size" }, ...sizeRes.data.map(range => ({ value: range, label: range }))]);
        setFrequencies(freqRes.data); // already {value, label}
        setTimezoneGroups(tzRes.data); // already grouped array
      } catch (err) {
        console.error("Failed to load dropdown options:", err.response?.data || err.message);
      }
    };

    fetchOptions();
  }, []);

  // Step 1: Org
  const [orgForm, setOrgForm] = useState({
    name: "",
    website: "",
    industry: "",
    size: "",
    logo: null,
  });
  const [orgErrors, setOrgErrors] = useState({});
  // Step 2: Admin account
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [adminErrors, setAdminErrors] = useState({});
  // Step 3: Employees
  const [employees, setEmployees] = useState([
    { first_name: "", last_name: "", email: "", job_title: "", department: "" },
  ]);
  const [employeeErrors, setEmployeeErrors] = useState(null); // string or array
  // Step 4: Frequency
  const [settingsForm, setSettingsForm] = useState({
    frequency: "weekly",
    timezone: "Europe/London",
    startAt: "",
  });
  const [settingsErrors, setSettingsErrors] = useState({});
  const currentStep = STEPS[stepIndex];
  function next() {
    setGlobalError(null);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }
  // ---------- Step 1 ----------
  function validateOrg(f) {
    const e = {};
    if (!f.name.trim()) e.name = "Please enter your organisation name.";
    if (f.name.trim().length > 120) e.name = "Organisation name must be 120 characters or fewer.";
    if (!f.website.trim()) e.website = "Please enter your website.";
    else if (!isValidUrl(f.website)) e.website = "Please enter a valid website URL (include https://).";
    return e;
  }
  async function submitOrg() {
    if (submitting) return;
    const e = validateOrg(orgForm);
    setOrgErrors(e);
    if (Object.keys(e).length) return;
    setSubmitting(true);
    setGlobalError(null);
    try {
      const fd = new FormData();
      fd.append("name", orgForm.name.trim());
      fd.append("website", orgForm.website.trim());
      if (orgForm.industry) fd.append("industry", orgForm.industry);
      if (orgForm.size) fd.append("size", orgForm.size);
      if (orgForm.logo) fd.append("logo", orgForm.logo);
      let res;
      if (orgId) {
        fd.append("_method", "PUT");
        res = await api.post(`/api/organisations/${orgId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.post("/api/organisations", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      const id = res.data?.organisation?.id;
      if (!id) {
        setGlobalError("Organisation saved, but we couldn’t confirm the ID. Please refresh and try again.");
        return;
      }
      setOrgId(id);
      setOrgForm({...orgForm, logo: null}); // Clear logo after save to avoid re-upload
      next();
    } catch (err) {
      const status = err?.response?.status;
      const fieldErrors = map422Errors(err);
      if (fieldErrors) {
        setOrgErrors(fieldErrors);
      } else if (status === 401 || status === 403) {
        setGlobalError("Please complete the admin account creation first to edit organisation details.");
        setStepIndex(1); // Move to admin step
      } else {
        setGlobalError(friendlyApiError(err, "We couldn’t save your organisation."));
      }
    } finally {
      setSubmitting(false);
    }
  }
  // ---------- Step 2 ----------
  function validateAdmin(f) {
    const e = {};
    if (!f.name.trim()) e.name = "Please enter the admin name.";
    if (!f.email.trim()) e.email = "Please enter an email address.";
    else if (!isValidEmail(f.email)) e.email = "Please enter a valid email address.";
    if (!f.password) e.password = "Please create a password.";
    else if (f.password.length < 8) e.password = "Password must be at least 8 characters.";
    if (!f.password_confirm) e.password_confirm = "Please confirm the password.";
    else if (f.password !== f.password_confirm) e.password_confirm = "Passwords don’t match.";
    return e;
  }
  async function submitAdmin() {
    if (submitting) return;
    const e = validateAdmin(adminForm);
    setAdminErrors(e);
    if (Object.keys(e).length) return;
    if (!orgId) {
      setGlobalError("Please complete the organisation step first.");
      return;
    }
    setSubmitting(true);
    setGlobalError(null);
    try {
      // 1) Create admin user for this org
      await api.post(`/api/organisations/${orgId}/admin`, {
        name: adminForm.name.trim(),
        email: adminForm.email.trim(),
        password: adminForm.password,
        password_confirmation: adminForm.password_confirm,
      });
      // 2) Auto-login (token auth)
      const loginRes = await api.post("/api/auth/login", {
        email: adminForm.email.trim(),
        password: adminForm.password,
      });
      localStorage.setItem("auth_token", loginRes.data.token);
      next();
    } catch (err) {
      const fieldErrors = map422Errors(err);
      if (fieldErrors) {
        // Common mismatch: Laravel uses "password" + "password_confirmation"
        // We show it nicely under confirm as well if needed
        const mapped = { ...fieldErrors };
        if (mapped.password_confirmation) mapped.password_confirm = mapped.password_confirmation;
        setAdminErrors(mapped);
      } else {
        setGlobalError(friendlyApiError(err, "We couldn’t create the admin account."));
      }
    } finally {
      setSubmitting(false);
    }
  }
  // ---------- Step 3 ----------
  function validateEmployees(list) {
    const issues = [];
    // Remove fully empty rows
    const cleaned = list
      .map((e) => ({
        first_name: e.first_name.trim(),
        last_name: e.last_name.trim(),
        email: e.email.trim(),
        job_title: e.job_title.trim(),
        department: e.department.trim(),
      }))
      .filter((e) => e.first_name || e.last_name || e.email || e.job_title || e.department);
    if (!cleaned.length) {
      return { cleaned, issues: ["Please add at least one employee or click “Skip for now”."] };
    }
    const emails = cleaned.map((e) => e.email.toLowerCase());
    const dupes = emails.filter((email, idx) => emails.indexOf(email) !== idx);
    cleaned.forEach((emp, idx) => {
      const rowNum = idx + 1;
      if (!emp.first_name) issues.push(`Row ${rowNum}: first name is required.`);
      if (!emp.last_name) issues.push(`Row ${rowNum}: last name is required.`);
      if (!emp.email) issues.push(`Row ${rowNum}: email is required.`);
      else if (!isValidEmail(emp.email)) issues.push(`Row ${rowNum}: please enter a valid email address.`);
    });
    if (dupes.length) {
      issues.push("Duplicate employee emails found. Each employee must have a unique email.");
    }
    return { cleaned, issues };
  }
  async function submitEmployees() {
    if (submitting) return;
    if (!orgId) {
      setGlobalError("Please complete the organisation step first.");
      return;
    }
    const { cleaned, issues } = validateEmployees(employees);
    if (issues.length) {
      setEmployeeErrors(issues);
      return;
    }
    setSubmitting(true);
    setEmployeeErrors(null);
    setGlobalError(null);
    try {
      await api.post(`/api/organisations/${orgId}/employees/bulk`, { employees: cleaned });
      next();
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 422) {
        // Your backend may return { existing_emails: [...] } or validation errors
        if (Array.isArray(data?.existing_emails) && data.existing_emails.length) {
          setEmployeeErrors([
            "Some employees already exist in your organisation:",
            ...data.existing_emails.map((e) => `• ${e}`),
          ]);
        } else if (data?.errors) {
          setEmployeeErrors(["Some employee details look invalid. Please review and try again."]);
        } else {
          setEmployeeErrors(["Some employee details look invalid. Please review and try again."]);
        }
      } else {
        setGlobalError(friendlyApiError(err, "We couldn’t add employees."));
      }
    } finally {7
      setSubmitting(false);
      const handleGatherOsint = async (employees) => {
        try {
          const response = await axios.post('/api/osint/gather', employees, {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }, // Tie to your login
          });
        } catch (error) {
          console.error('Error gathering OSINT:', error);
        }
      };
      handleGatherOsint(cleaned);
    }
  }
  // ---------- Step 4 ----------
  function validateSettings(f) {
    const e = {};
    if (!f.frequency) e.frequency = "Please choose how often simulations should run.";
    if (!f.timezone) e.timezone = "Please select a timezone.";
    // optional: validate startAt if present (datetime-local gives a valid value format)
    return e;
  }
  async function submitSettings() {
    if (submitting) return;
    const e = validateSettings(settingsForm);
    setSettingsErrors(e);
    if (Object.keys(e).length) return;
    if (!orgId) {
      setGlobalError("Please complete the organisation step first.");
      return;
    }
    setSubmitting(true);
    setGlobalError(null);
    try {
      await api.put(`/api/organisations/${orgId}/settings`, {
        simulation_frequency: settingsForm.frequency,
        timezone: settingsForm.timezone,
        start_at: settingsForm.startAt || null,
      });
      next();
    } catch (err) {
      const fieldErrors = map422Errors(err);
      if (fieldErrors) {
        setSettingsErrors(fieldErrors);
      } else {
        setGlobalError(friendlyApiError(err, "We couldn’t save your settings."));
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- Review ----------
  const review = useMemo(() => {
    const employeeCount = employees.filter(
      (e) => e.email.trim() || e.first_name.trim() || e.last_name.trim() || e.job_title.trim() || e.department.trim()
    ).length;

    // Use the fetched timezoneGroups instead of the removed constant
    const tzLabel =
      timezoneGroups
        .flatMap((g) => g.zones)
        .find((z) => z.value === settingsForm.timezone)?.label ||
      settingsForm.timezone ||
      "Not selected";

    const freqLabel =
      frequencies.find((f) => f.value === settingsForm.frequency)?.label ||
      settingsForm.frequency ||
      "Not selected";

    return {
      orgId,
      organisation: {
        name: orgForm.name,
        website: orgForm.website,
        industry: orgForm.industry,
        size: orgForm.size,
        logoName: orgForm.logo ? orgForm.logo.name : null,
      },
      admin: {
        name: adminForm.name,
        email: adminForm.email,
      },
      employeesCount: employeeCount,
      settings: {
        frequencyLabel: freqLabel,
        timezoneLabel: tzLabel,
        startAt: settingsForm.startAt || "Not set",
      },
    };
  }, [
    orgForm,
    adminForm,
    employees,
    settingsForm,
    orgId,
    timezoneGroups,
    frequencies,
  ]);

  async function finishSetup() {
    // No backend "complete" endpoint yet. For now, just redirect to dashboard.
    navigate("/dashboard", { replace: true });
  }
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <style jsx>{`
        :root {
          /* Neural Network Animation Vars (Pure CSS AI effect) */
          --inputX: 0.9;
          --inputY: -1;
          --output1bias: 0.006412765611663633;
          --output2bias: 0.007072853542676219;
          --output3bias: 0.0064746685639952214;
          --output4bias: 0.004851470988693036;
          --weights1-1: -0.9807254999119579;
          --weights1-2: 0.9813663133332142;
          --weights1-3: -0.9817224902785696;
          --weights1-4: 0.9817919593383302;
          --weights2-1: -0.9809082670731147;
          --weights2-2: -0.9816176935504328;
          --weights2-3: 0.9815336794202348;
          --weights2-4: 0.9815925299039976;
          --output1a: calc((var(--weights1-1) * var(--inputX)) + (var(--weights2-1) * var(--inputY)));
          --output2a: calc((var(--weights1-2) * var(--inputX)) + (var(--weights2-2) * var(--inputY)));
          --output3a: calc((var(--weights1-3) * var(--inputX)) + (var(--weights2-3) * var(--inputY)));
          --output4a: calc((var(--weights1-4) * var(--inputX)) + (var(--weights2-4) * var(--inputY)));
          --output1b: calc(max(0, var(--output1a)) + var(--output1bias));
          --output2b: calc(max(0, var(--output2a)) + var(--output2bias));
          --output3b: calc(max(0, var(--output3a)) + var(--output3bias));
          --output4b: calc(max(0, var(--output4a)) + var(--output4bias));
          --maxOut: max(var(--output1b), var(--output2b), var(--output3b), var(--output4b));
          --output1c: max(calc(1 - ((var(--output1b) - var(--maxOut)) * (var(--output1b) - var(--maxOut)) * 1000000000)), 0);
          --output2c: max(calc(1 - ((var(--output2b) - var(--maxOut)) * (var(--output2b) - var(--maxOut)) * 1000000000)), 0);
          --output3c: max(calc(1 - ((var(--output3b) - var(--maxOut)) * (var(--output3b) - var(--maxOut)) * 1000000000)), 0);
          --output4c: max(calc(1 - ((var(--output4b) - var(--maxOut)) * (var(--output4b) - var(--maxOut)) * 1000000000)), 0);
        }
        .neural-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 50%);
          animation: neural-pulse 4s ease-in-out infinite alternate;
        }
        @keyframes neural-pulse {
          0% { opacity: 0.6; transform: scale(1); }
          100% { opacity: 0.8; transform: scale(1.02); }
        }
        .neural-node {
          position: absolute;
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          animation: float 6s ease-in-out infinite;
        }
        .neural-node:nth-child(1) { top: 20%; left: 30%; animation-delay: 0s; }
        .neural-node:nth-child(2) { top: 60%; left: 70%; animation-delay: 2s; }
        .neural-node:nth-child(3) { top: 80%; left: 20%; animation-delay: 4s; }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }
        .neural-line {
          position: absolute;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent);
          animation: line-glow 3s ease-in-out infinite;
        }
        .neural-line:nth-child(4) { top: 30%; left: 20%; width: 60%; animation-delay: 1s; }
        .neural-line:nth-child(5) { top: 50%; left: 60%; width: 30%; transform: rotate(45deg); animation-delay: 2.5s; }
        @keyframes line-glow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.5; }
        }
        .stepper {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          margin-bottom: 1.5rem;
        }
        .step-item {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          border: 2px solid #d1d5db;
          background: #fff;
          color: #111827;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .step-item.active {
          border-color: #3b82f6;
          background: #3b82f6;
          color: white;
        }
        .step-item.done {
          border-color: #10b981;
          background: #10b981;
          color: white;
        }
        .step-connector {
          flex: 1;
          height: 2px;
          background: #d1d5db;
          transition: background 0.2s;
        }
        .step-connector.done {
          background: #10b981;
        }
        .step-connector.active {
          background: #3b82f6;
        }
        .table-container {
          overflow-x: auto;
          margin-top: 1rem;
        }
        .employee-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .employee-table th,
        .employee-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        .employee-table th {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        .employee-table input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }
        .section {
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .section-title {
          font-weight: 800;
          margin-bottom: 0.5rem;
          color: #111827;
        }
        .summary-row {
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 0.75rem;
          padding: 0.25rem 0;
        }
        .summary-label {
          opacity: 0.75;
          color: #6b7280;
        }
        .summary-value {
          font-weight: 600;
          color: #111827;
        }
        
        .employee-table input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.95rem;
          min-width: 140px;
        }

        .employee-table td {
          padding: 0.75rem 1rem;
          min-width: 160px;
        }

        .employee-table th {
          min-width: 140px;
          padding: 0.75rem 1rem;
        }
      `}</style>
      <div className="max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex lg:flex-row flex-col">
        {/* LEFT: White Login Side */}
        <div className="flex-1 lg:min-h-[600px] p-8 lg:p-12 flex flex-col justify-center">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-2">AIDEN</h1>
            <p className="text-xl text-gray-600 max-w-md mx-auto">
              Agentic Intelligence Dual-use Evaluation Network
            </p>
          </div>
          <div className="max-w-2xl mx-auto w-full space-y-6">
            <Stepper stepIndex={stepIndex} />
            {globalError && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-2xl text-sm text-red-700 animate-fade-in">
                {globalError}
              </div>
            )}
            <div className="space-y-6">
              {currentStep.key === "org" && (
                <OrgStep form={orgForm} setForm={setOrgForm} errors={orgErrors} submitting={submitting} onContinue={submitOrg} industries={industries} sizes={sizes} />
              )}
              {currentStep.key === "admin" && (
                <AdminStep
                  form={adminForm}
                  setForm={setAdminForm}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  errors={adminErrors}
                  submitting={submitting}
                  onContinue={submitAdmin}
                />
              )}
              {currentStep.key === "employees" && (
                <EmployeesStep
                  employees={employees}
                  setEmployees={setEmployees}
                  error={employeeErrors}
                  submitting={submitting}
                  onContinue={submitEmployees}
                  onSkip={() => next()}
                />
              )}
              {currentStep.key === "frequency" && (
                <FrequencyStep
                  form={settingsForm}
                  setForm={setSettingsForm}
                  errors={settingsErrors}
                  submitting={submitting}
                  onContinue={submitSettings}
                  frequencies={frequencies}
                  timezoneGroups={timezoneGroups}
                />
              )}
              {currentStep.key === "review" && <ReviewStep review={review} onFinish={finishSetup} />}
            </div>
            <div className="text-center text-sm">
              <p className="text-gray-500">
                Already have an account?{" "}
                <a href="/login" className="font-medium text-purple-600 hover:text-purple-700 hover:underline">
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </div>
        {/* RIGHT: Colored Animation Side */}
        <div className="flex-1 relative bg-gradient-to-br from-blue-200 via-purple-200 to-indigo-200 lg:min-h-[600px]">
          {/* Neural Network Background Animation */}
          <div className="neural-bg">
            {/* Simulated nodes (glowing dots) */}
            <div className="neural-node"></div>
            <div className="neural-node"></div>
            <div className="neural-node"></div>
            {/* Connecting lines */}
            <div className="neural-line"></div>
            <div className="neural-line"></div>
          </div>
          {/* Centered Image on Top */}
          <img
            src="/blank_logo.png"
            alt="AIDEN Illustration"
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 invisible lg:visible w-48 h-48 lg:w-80 lg:h-80 object-contain z-10 drop-shadow-lg"
          />
        </div>
      </div>
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
function Stepper({ stepIndex }) {
  return (
    <div className="stepper">
      {STEPS.map((s, idx) => (
        <React.Fragment key={s.key}>
          {idx > 0 && (
            <div className={`step-connector ${idx <= stepIndex ? 'done' : idx === stepIndex + 1 ? 'active' : ''}`} />
          )}
          <div
            title={s.label}
            className={`step-item ${idx === stepIndex ? 'active' : idx < stepIndex ? 'done' : ''}`}
          >
            {idx < stepIndex ? <CheckCircle size={16} /> : <Circle size={16} />}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
function OrgStep({ form, setForm, errors, submitting, onContinue, industries, sizes, }) {

  // Force it to be an array if somehow undefined
  const safeIndustries = Array.isArray(industries) ? industries : [];
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Organisation details</h2>
      <p className="text-gray-600">Tell us about your organisation.</p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Organisation Name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          className="w-full rounded-2xl border border-gray-200 px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          placeholder="Enter organisation name"
        />
        {errors.name && <div className="mt-1 text-sm text-red-600">{errors.name}</div>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Website *</label>
        <input
          value={form.website}
          onChange={(e) => setForm((s) => ({ ...s, website: e.target.value }))}
          className="w-full rounded-2xl border border-gray-200 px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          placeholder="https://example.com"
        />
        {errors.website && <div className="mt-1 text-sm text-red-600">{errors.website}</div>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
          <select
            value={form.industry || ""}
            onChange={(e) => setForm((s) => ({ ...s, industry: e.target.value }))}
            className="w-full rounded-2xl border border-gray-200 px-5 py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
            disabled={industries.length === 0}
          >
            {safeIndustries.length > 0 ? (
              safeIndustries.map((ind) => (
                <option key={ind.value} value={ind.value}>
                  {ind.label}
                </option>
              ))
            ) : (
              <option value="">Loading industries...</option>
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Size</label>
          <select
            value={form.size || ""}
            onChange={(e) => setForm((s) => ({ ...s, size: e.target.value }))}
            className="w-full rounded-2xl border border-gray-200 px-5 py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
            disabled={sizes.length === 0}
          >
            {sizes && Array.isArray(sizes) && sizes.length > 0 ? (
              sizes.map((sz) => (
                <option key={sz.value} value={sz.value}>
                  {sz.label}
                </option>
              ))
            ) : (
              <option value="">Loading sizes...</option>
            )}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo (optional)</label>
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setForm((s) => ({ ...s, logo: e.target.files?.[0] || null }))} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
      </div>
      <div className="flex justify-end">
        <button
          onClick={onContinue}
          disabled={submitting}
          className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 disabled:from-blue-400 disabled:via-purple-400 disabled:to-indigo-500 text-white font-semibold py-3.5 px-8 rounded-2xl transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </div>
  );
}
function AdminStep({ form, setForm, showPassword, setShowPassword, errors, submitting, onContinue }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Create organisation admin account</h2>
      <p className="text-gray-600">This account can log in and manage the organisation. Employees won’t have accounts.</p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          className="w-full rounded-2xl border border-gray-200 px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          placeholder="Enter admin name"
        />
        {errors.name && <div className="mt-1 text-sm text-red-600">{errors.name}</div>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
        <input
          value={form.email}
          onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
          className="w-full rounded-2xl border border-gray-200 px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          placeholder="you@company.com"
        />
        {errors.email && <div className="mt-1 text-sm text-red-600">{errors.email}</div>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              className="w-full rounded-2xl border border-gray-200 px-5 py-3.5 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <div className="mt-1 text-sm text-red-600">{errors.password}</div>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password *</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password_confirm}
              onChange={(e) => setForm((s) => ({ ...s, password_confirm: e.target.value }))}
              className="w-full rounded-2xl border border-gray-200 px-5 py-3.5 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>
          {errors.password_confirm && <div className="mt-1 text-sm text-red-600">{errors.password_confirm}</div>}
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={onContinue}
          disabled={submitting}
          className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 disabled:from-blue-400 disabled:via-purple-400 disabled:to-indigo-500 text-white font-semibold py-3.5 px-8 rounded-2xl transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating...
            </>
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </div>
  );
}
function EmployeesStep({ employees, setEmployees, error, submitting, onContinue, onSkip }) {
  function update(idx, key, value) {
    setEmployees((list) => list.map((e, i) => (i === idx ? { ...e, [key]: value } : e)));
  }
  function addRow() {
    setEmployees((list) => [...list, { first_name: "", last_name: "", email: "", job_title: "", department: "" }]);
  }
  function removeRow(idx) {
    setEmployees((list) => list.filter((_, i) => i !== idx));
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Add employees</h2>
        <p className="text-gray-600">Employees don’t need accounts. Add them now (you can also do this later).</p>
      </div>
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-2xl text-sm text-red-700 animate-fade-in">
          {Array.isArray(error) ? (
            <ul className="mt-0 space-y-1 list-disc list-inside">
              {error.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          ) : (
            error
          )}
        </div>
      )}
      <div className="table-container">
        <table className="employee-table">
          <thead>
            <tr>
              {["First name*", "Last name*", "Email*", "Job title", "Department", ""].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, idx) => (
              <tr key={idx}>
                <td>
                  <input value={emp.first_name} onChange={(e) => update(idx, "first_name", e.target.value)} placeholder="First name" />
                </td>
                <td>
                  <input value={emp.last_name} onChange={(e) => update(idx, "last_name", e.target.value)} placeholder="Last name" />
                </td>
                <td>
                  <input value={emp.email} onChange={(e) => update(idx, "email", e.target.value)} placeholder="email@company.com" />
                </td>
                <td>
                  <input value={emp.job_title} onChange={(e) => update(idx, "job_title", e.target.value)} placeholder="Job title" />
                </td>
                <td>
                  <input value={emp.department} onChange={(e) => update(idx, "department", e.target.value)} placeholder="Department" />
                </td>
                <td className="w-20">
                  {employees.length > 1 && (
                    <button
                      onClick={() => removeRow(idx)}
                      disabled={submitting}
                      className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={addRow}
            disabled={submitting}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed transition"
          >
            + Add row
          </button>
          <button
            onClick={onSkip}
            disabled={submitting}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed transition"
          >
            Skip for now
          </button>
        </div>
        <div className="flex justify-end gap-4">
          <button
            onClick={onContinue}
            disabled={submitting}
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 disabled:from-blue-400 disabled:via-purple-400 disabled:to-indigo-500 text-white font-semibold py-3.5 px-8 rounded-2xl transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
function FrequencyStep({ form, setForm, errors, submitting, onContinue, frequencies, timezoneGroups }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Simulation frequency</h2>
        <p className="text-gray-600">Choose how often the app generates simulated emails for review inside the dashboard.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Frequency *</label>
        <select
          value={form.frequency}
          onChange={(e) => setForm((s) => ({ ...s, frequency: e.target.value }))}
          className="w-full rounded-2xl border border-gray-200 px-5 py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
        >
        {frequencies?.length > 0 ? (
          frequencies.map(f => <option key={f.value} value={f.value}>{f.label}</option>)
        ) : (
          <option value="" disabled>Loading frequencies...</option>
        )}
      </select>
        {errors.frequency && <div className="mt-1 text-sm text-red-600">{errors.frequency}</div>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone *</label>
          <select
            value={form.timezone}
            onChange={(e) => setForm((s) => ({ ...s, timezone: e.target.value }))}
            className="w-full rounded-2xl border border-gray-200 px-5 py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          >
            {timezoneGroups.length > 0 ? (
              timezoneGroups.map(group => (
                <optgroup key={group.group} label={group.group}>
                  {group.zones.map(z => (
                    <option key={z.value} value={z.value}>{z.label}</option>
                  ))}
                </optgroup>
              ))
            ) : (
              <option value="">Loading timezones...</option>
            )}
          </select>
          {errors.timezone && <div className="mt-1 text-sm text-red-600">{errors.timezone}</div>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Start date/time (optional)</label>
          <input
            type="datetime-local"
            value={form.startAt}
            onChange={(e) => setForm((s) => ({ ...s, startAt: e.target.value }))}
            className="w-full rounded-2xl border border-gray-200 px-5 py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          />
          <div className="mt-2 text-sm text-gray-500">Leave blank to start generating immediately.</div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={onContinue}
          disabled={submitting}
          className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 disabled:from-blue-400 disabled:via-purple-400 disabled:to-indigo-500 text-white font-semibold py-3.5 px-8 rounded-2xl transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </div>
  );
}
function ReviewStep({ review, onFinish }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Review</h2>
        <p className="text-gray-600">Please confirm the details below. You can go back and edit anything.</p>
      </div>
      <div className="space-y-4">
        <Section title="Organisation">
          <SummaryRow label="Name" value={review.organisation.name || "—"} />
          <SummaryRow label="Website" value={review.organisation.website || "—"} />
          <SummaryRow label="Industry" value={review.organisation.industry || "—"} />
          <SummaryRow label="Size" value={review.organisation.size || "—"} />
          <SummaryRow label="Logo" value={review.organisation.logoName || "No logo uploaded"} />
        </Section>
        <Section title="Admin account">
          <SummaryRow label="Admin name" value={review.admin.name || "—"} />
          <SummaryRow label="Admin email" value={review.admin.email || "—"} />
        </Section>
        <Section title="Employees">
          <SummaryRow label="Employees added" value={String(review.employeesCount)} />
          <div className="mt-2 text-sm text-gray-500">You can edit employees later from the dashboard.</div>
        </Section>
        <Section title="Simulation settings">
          <SummaryRow label="Frequency" value={review.settings.frequencyLabel} />
          <SummaryRow label="Timezone" value={review.settings.timezoneLabel} />
          <SummaryRow label="Start time" value={review.settings.startAt} />
        </Section>
      </div>
      <div className="flex justify-end">
        <button
          onClick={onFinish}
          className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 text-white font-semibold py-3.5 px-8 rounded-2xl transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Finish setup
        </button>
      </div>
    </div>
  );
}
function Section({ title, children }) {
  return (
    <div className="section">
      <div className="section-title">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function SummaryRow({ label, value }) {
  return (
    <div className="summary-row">
      <div className="summary-label">{label}</div>
      <div className="summary-value">{value}</div>
    </div>
  );
}