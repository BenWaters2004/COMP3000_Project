import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const STEPS = [
  { key: "org", label: "Organisation" },
  { key: "admin", label: "Admin Account" },
  { key: "employees", label: "Employees" },
  { key: "frequency", label: "Frequency" },
  { key: "review", label: "Review" },
];

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
];

// Curated IANA timezone list (you can expand later if you want)
const TIMEZONE_GROUPS = [
  {
    group: "United Kingdom & Europe",
    zones: [
      { value: "Europe/London", label: "Europe/London (UK)" },
      { value: "Europe/Dublin", label: "Europe/Dublin (Ireland)" },
      { value: "Europe/Paris", label: "Europe/Paris" },
      { value: "Europe/Berlin", label: "Europe/Berlin" },
      { value: "Europe/Madrid", label: "Europe/Madrid" },
      { value: "Europe/Rome", label: "Europe/Rome" },
      { value: "Europe/Amsterdam", label: "Europe/Amsterdam" },
      { value: "Europe/Stockholm", label: "Europe/Stockholm" },
      { value: "Europe/Warsaw", label: "Europe/Warsaw" },
      { value: "Europe/Athens", label: "Europe/Athens" },
      { value: "Europe/Istanbul", label: "Europe/Istanbul" },
      { value: "Europe/Moscow", label: "Europe/Moscow" },
    ],
  },
  {
    group: "North America",
    zones: [
      { value: "America/New_York", label: "America/New_York (ET)" },
      { value: "America/Chicago", label: "America/Chicago (CT)" },
      { value: "America/Denver", label: "America/Denver (MT)" },
      { value: "America/Los_Angeles", label: "America/Los_Angeles (PT)" },
      { value: "America/Phoenix", label: "America/Phoenix" },
      { value: "America/Toronto", label: "America/Toronto" },
      { value: "America/Vancouver", label: "America/Vancouver" },
      { value: "America/Mexico_City", label: "America/Mexico_City" },
    ],
  },
  {
    group: "South America",
    zones: [
      { value: "America/Sao_Paulo", label: "America/Sao_Paulo" },
      { value: "America/Argentina/Buenos_Aires", label: "America/Argentina/Buenos_Aires" },
      { value: "America/Santiago", label: "America/Santiago" },
      { value: "America/Bogota", label: "America/Bogota" },
    ],
  },
  {
    group: "Africa",
    zones: [
      { value: "Africa/Lagos", label: "Africa/Lagos" },
      { value: "Africa/Johannesburg", label: "Africa/Johannesburg" },
      { value: "Africa/Nairobi", label: "Africa/Nairobi" },
      { value: "Africa/Cairo", label: "Africa/Cairo" },
      { value: "Africa/Casablanca", label: "Africa/Casablanca" },
    ],
  },
  {
    group: "Asia",
    zones: [
      { value: "Asia/Dubai", label: "Asia/Dubai" },
      { value: "Asia/Riyadh", label: "Asia/Riyadh" },
      { value: "Asia/Jerusalem", label: "Asia/Jerusalem" },
      { value: "Asia/Kolkata", label: "Asia/Kolkata (India)" },
      { value: "Asia/Karachi", label: "Asia/Karachi" },
      { value: "Asia/Bangkok", label: "Asia/Bangkok" },
      { value: "Asia/Singapore", label: "Asia/Singapore" },
      { value: "Asia/Hong_Kong", label: "Asia/Hong_Kong" },
      { value: "Asia/Shanghai", label: "Asia/Shanghai" },
      { value: "Asia/Tokyo", label: "Asia/Tokyo" },
      { value: "Asia/Seoul", label: "Asia/Seoul" },
    ],
  },
  {
    group: "Oceania",
    zones: [
      { value: "Australia/Sydney", label: "Australia/Sydney" },
      { value: "Australia/Melbourne", label: "Australia/Melbourne" },
      { value: "Australia/Brisbane", label: "Australia/Brisbane" },
      { value: "Australia/Perth", label: "Australia/Perth" },
      { value: "Pacific/Auckland", label: "Pacific/Auckland (NZ)" },
    ],
  },
  {
    group: "UTC",
    zones: [{ value: "UTC", label: "UTC" }],
  },
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

  function back() {
    setGlobalError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  // ---------- Step 1 ----------
  function validateOrg(f) {
    const e = {};
    if (!f.name.trim()) e.name = "Please enter your organisation name.";
    if (f.name.trim().length > 120) e.name = "Organisation name must be 120 characters or fewer.";
    if (f.website && f.website.trim() && !isValidUrl(f.website)) {
      e.website = "Please enter a valid website URL (include https://).";
    }
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
      if (orgForm.website.trim()) fd.append("website", orgForm.website.trim());
      if (orgForm.industry.trim()) fd.append("industry", orgForm.industry.trim());
      if (orgForm.size.trim()) fd.append("size", orgForm.size.trim());
      if (orgForm.logo) fd.append("logo", orgForm.logo);

      const res = await api.post("/api/organisations", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const createdId = res.data?.organisation?.id;
      if (!createdId) {
        setGlobalError("Organisation created, but we couldn’t confirm the ID. Please refresh and try again.");
        return;
      }

      setOrgId(createdId);
      next();
    } catch (err) {
      const fieldErrors = map422Errors(err);
      if (fieldErrors) {
        setOrgErrors(fieldErrors);
      } else {
        setGlobalError(friendlyApiError(err, "We couldn’t create your organisation."));
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
    } finally {
      setSubmitting(false);
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

    const tzLabel =
      TIMEZONE_GROUPS.flatMap((g) => g.zones).find((z) => z.value === settingsForm.timezone)?.label ||
      settingsForm.timezone;

    const freqLabel = FREQUENCIES.find((f) => f.value === settingsForm.frequency)?.label || settingsForm.frequency;

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
  }, [orgForm, adminForm, employees, settingsForm, orgId]);

  async function finishSetup() {
    // No backend "complete" endpoint yet. For now, just redirect to dashboard.
    navigate("/dashboard", { replace: true });
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>Organisation Setup</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Create your organisation, add employees, and choose how often simulations are generated.
      </p>

      <Stepper stepIndex={stepIndex} />

      {globalError && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #f2c2c2", borderRadius: 12 }}>
          <span style={{ color: "crimson" }}>{globalError}</span>
        </div>
      )}

      <div style={{ marginTop: 18, padding: 16, border: "1px solid #ddd", borderRadius: 16 }}>
        {currentStep.key === "org" && (
          <OrgStep form={orgForm} setForm={setOrgForm} errors={orgErrors} submitting={submitting} onContinue={submitOrg} />
        )}

        {currentStep.key === "admin" && (
          <AdminStep
            form={adminForm}
            setForm={setAdminForm}
            errors={adminErrors}
            submitting={submitting}
            onBack={back}
            onContinue={submitAdmin}
          />
        )}

        {currentStep.key === "employees" && (
          <EmployeesStep
            employees={employees}
            setEmployees={setEmployees}
            error={employeeErrors}
            submitting={submitting}
            onBack={back}
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
            onBack={back}
            onContinue={submitSettings}
          />
        )}

        {currentStep.key === "review" && <ReviewStep review={review} onBack={back} onFinish={finishSetup} />}
      </div>
    </div>
  );
}

function Stepper({ stepIndex }) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
      {STEPS.map((s, idx) => {
        const active = idx === stepIndex;
        const done = idx < stepIndex;
        return (
          <div
            key={s.key}
            style={{
              padding: "10px 12px",
              borderRadius: 999,
              border: "1px solid #ddd",
              background: active ? "#111" : done ? "#f4f4f4" : "#fff",
              color: active ? "#fff" : "#111",
              fontWeight: active ? 700 : 600,
            }}
          >
            {idx + 1}. {s.label}
          </div>
        );
      })}
    </div>
  );
}

function OrgStep({ form, setForm, errors, submitting, onContinue }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Organisation details</h2>

      <div>
        <label>Organisation Name *</label>
        <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} style={inputStyle} />
        {errors.name && <div style={errStyle}>{errors.name}</div>}
      </div>

      <div>
        <label>Website</label>
        <input
          value={form.website}
          onChange={(e) => setForm((s) => ({ ...s, website: e.target.value }))}
          style={inputStyle}
          placeholder="https://example.com"
        />
        {errors.website && <div style={errStyle}>{errors.website}</div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label>Industry</label>
          <input value={form.industry} onChange={(e) => setForm((s) => ({ ...s, industry: e.target.value }))} style={inputStyle} />
        </div>

        <div>
          <label>Size</label>
          <input
            value={form.size}
            onChange={(e) => setForm((s) => ({ ...s, size: e.target.value }))}
            style={inputStyle}
            placeholder="e.g. 11-50"
          />
        </div>
      </div>

      <div>
        <label>Logo (optional)</label>
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setForm((s) => ({ ...s, logo: e.target.files?.[0] || null }))} />
        {errors.logo && <div style={errStyle}>{errors.logo}</div>}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onContinue} disabled={submitting} style={primaryBtn}>
          {submitting ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}

function AdminStep({ form, setForm, errors, submitting, onBack, onContinue }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Create organisation admin account</h2>
      <p style={{ marginTop: -6, opacity: 0.8 }}>
        This account can log in and manage the organisation. Employees won’t have accounts.
      </p>

      <div>
        <label>Admin name *</label>
        <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} style={inputStyle} />
        {errors.name && <div style={errStyle}>{errors.name}</div>}
      </div>

      <div>
        <label>Email *</label>
        <input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} style={inputStyle} />
        {errors.email && <div style={errStyle}>{errors.email}</div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label>Password *</label>
          <input type="password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} style={inputStyle} />
          {errors.password && <div style={errStyle}>{errors.password}</div>}
        </div>

        <div>
          <label>Confirm password *</label>
          <input
            type="password"
            value={form.password_confirm}
            onChange={(e) => setForm((s) => ({ ...s, password_confirm: e.target.value }))}
            style={inputStyle}
          />
          {errors.password_confirm && <div style={errStyle}>{errors.password_confirm}</div>}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <button onClick={onContinue} disabled={submitting} style={primaryBtn}>
          {submitting ? "Creating..." : "Continue"}
        </button>
      </div>
    </div>
  );
}

function EmployeesStep({ employees, setEmployees, error, submitting, onBack, onContinue, onSkip }) {
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
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Add employees</h2>
      <p style={{ marginTop: -6, opacity: 0.8 }}>
        Employees don’t need accounts. Add them now (you can also do this later).
      </p>

      {error && (
        <div style={{ padding: 12, border: "1px solid #f2c2c2", borderRadius: 12, color: "crimson" }}>
          {Array.isArray(error) ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {error.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          ) : (
            error
          )}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["First name*", "Last name*", "Email*", "Job title", "Department", ""].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, idx) => (
              <tr key={idx}>
                <td style={tdStyle}>
                  <input value={emp.first_name} onChange={(e) => update(idx, "first_name", e.target.value)} style={cellInputStyle} />
                </td>
                <td style={tdStyle}>
                  <input value={emp.last_name} onChange={(e) => update(idx, "last_name", e.target.value)} style={cellInputStyle} />
                </td>
                <td style={tdStyle}>
                  <input value={emp.email} onChange={(e) => update(idx, "email", e.target.value)} style={cellInputStyle} />
                </td>
                <td style={tdStyle}>
                  <input value={emp.job_title} onChange={(e) => update(idx, "job_title", e.target.value)} style={cellInputStyle} />
                </td>
                <td style={tdStyle}>
                  <input value={emp.department} onChange={(e) => update(idx, "department", e.target.value)} style={cellInputStyle} />
                </td>
                <td style={{ ...tdStyle, width: 90 }}>
                  {employees.length > 1 && (
                    <button onClick={() => removeRow(idx)} style={dangerBtn} disabled={submitting}>
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={addRow} disabled={submitting} style={secondaryBtn}>
            + Add row
          </button>
          <button onClick={onSkip} disabled={submitting} style={secondaryBtn}>
            Skip for now
          </button>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onBack} disabled={submitting} style={secondaryBtn}>
            Back
          </button>
          <button onClick={onContinue} disabled={submitting} style={primaryBtn}>
            {submitting ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FrequencyStep({ form, setForm, errors, submitting, onBack, onContinue }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Simulation frequency</h2>
      <p style={{ marginTop: -6, opacity: 0.8 }}>
        Choose how often the app generates simulated emails for review inside the dashboard.
      </p>

      <div>
        <label>Frequency *</label>
        <select value={form.frequency} onChange={(e) => setForm((s) => ({ ...s, frequency: e.target.value }))} style={inputStyle}>
          {FREQUENCIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        {errors.frequency && <div style={errStyle}>{errors.frequency}</div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label>Timezone *</label>
          <select value={form.timezone} onChange={(e) => setForm((s) => ({ ...s, timezone: e.target.value }))} style={inputStyle}>
            {TIMEZONE_GROUPS.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.zones.map((z) => (
                  <option key={z.value} value={z.value}>
                    {z.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {errors.timezone && <div style={errStyle}>{errors.timezone}</div>}
        </div>

        <div>
          <label>Start date/time (optional)</label>
          <input type="datetime-local" value={form.startAt} onChange={(e) => setForm((s) => ({ ...s, startAt: e.target.value }))} style={inputStyle} />
          <div style={{ marginTop: 6, opacity: 0.7, fontSize: 13 }}>
            Leave blank to start generating immediately.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <button onClick={onBack} disabled={submitting} style={secondaryBtn}>
          Back
        </button>
        <button onClick={onContinue} disabled={submitting} style={primaryBtn}>
          {submitting ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}

function ReviewStep({ review, onBack, onFinish }) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <h2 style={{ margin: 0 }}>Review</h2>
      <p style={{ marginTop: -8, opacity: 0.8 }}>
        Please confirm the details below. You can go back and edit anything.
      </p>

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
        <div style={{ marginTop: 6, opacity: 0.7, fontSize: 13 }}>
          You can edit employees later from the dashboard.
        </div>
      </Section>

      <Section title="Simulation settings">
        <SummaryRow label="Frequency" value={review.settings.frequencyLabel} />
        <SummaryRow label="Timezone" value={review.settings.timezoneLabel} />
        <SummaryRow label="Start time" value={review.settings.startAt} />
      </Section>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <button onClick={onBack} style={secondaryBtn}>
          Back
        </button>
        <button onClick={onFinish} style={primaryBtn}>
          Finish setup
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 12 }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "grid", gap: 8 }}>{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12 }}>
      <div style={{ opacity: 0.75 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 12,
  border: "1px solid #ccc",
};

const cellInputStyle = {
  width: "100%",
  padding: 8,
  borderRadius: 10,
  border: "1px solid #ddd",
};

const tdStyle = { padding: 8, borderBottom: "1px solid #f2f2f2" };
const errStyle = { color: "crimson", marginTop: 6 };

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
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #f2c2c2",
  background: "#fff",
  color: "crimson",
  fontWeight: 700,
  cursor: "pointer",
};
