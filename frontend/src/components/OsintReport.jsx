import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OsintReport = ({ employee, token }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runOsint = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post('/api/osint/generate', {
        employee_id: employee.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setReport(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Auto-run if no report yet
  useEffect(() => {
    if (employee.osint_status === 'pending' || !employee.osint_ranked) {
      runOsint();
    } else if (employee.osint_ranked) {
      try {
        setReport({
          raw_results: employee.osint_raw,
          ranked: typeof employee.osint_ranked === 'string' 
            ? JSON.parse(employee.osint_ranked) 
            : employee.osint_ranked
        });
      } catch (e) {
        setReport({ raw_results: employee.osint_raw, ranked: {} });
      }
    }
  }, [employee.id]);

  if (loading) {
    return <div className="text-center py-12 text-lg">Running comprehensive OSINT analysis...</div>;
  }

  if (error) {
    return <div className="text-red-600 p-4 bg-red-50 rounded-xl">Error: {error}</div>;
  }

  const ranked = report?.ranked || {};

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">OSINT Security Report</h2>
          <p className="text-gray-500 mt-1">for {employee.first_name} {employee.last_name}</p>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-medium ${
          ranked.risk_level === 'Critical' ? 'bg-red-100 text-red-700' :
          ranked.risk_level === 'High' ? 'bg-orange-100 text-orange-700' :
          'bg-emerald-100 text-emerald-700'
        }`}>
          Risk: {ranked.risk_level || 'Medium'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gray-50 rounded-2xl p-6">
          <p className="text-xs uppercase tracking-widest text-gray-500">Accuracy</p>
          <p className="text-6xl font-bold text-blue-600 mt-2">{ranked.accuracy || '?'}/10</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-6">
          <p className="text-xs uppercase tracking-widest text-gray-500">Usefulness</p>
          <p className="text-6xl font-bold text-emerald-600 mt-2">{ranked.usefulness || '?'}/10</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-6">
          <p className="text-xs uppercase tracking-widest text-gray-500">Breach Risk</p>
          <p className="text-4xl font-bold mt-3">High</p>
        </div>
      </div>

      <div className="space-y-10">
        <div>
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            Key Findings
          </h3>
          <ul className="space-y-3">
            {ranked.key_findings?.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-emerald-500">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-4">Training Recommendations</h3>
          <ul className="space-y-3">
            {ranked.training_recommendations?.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-blue-500">★</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <details className="mt-12 border-t pt-6">
        <summary className="cursor-pointer text-blue-600 font-medium text-sm">
          View Raw OSINT Data (for developers)
        </summary>
        <pre className="mt-4 bg-gray-950 text-gray-300 p-6 rounded-2xl overflow-auto text-xs leading-relaxed">
          {report?.raw_results}
        </pre>
      </details>
    </div>
  );
};

export default OsintReport;