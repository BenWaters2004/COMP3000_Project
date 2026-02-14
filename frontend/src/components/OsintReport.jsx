import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import axios from 'axios';

const OsintReport = ({ employee, token, onClose }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadReport = async () => {
      // Use saved data if available
      if (employee.osint_ranked) {
        try {
          let rankedStr = employee.osint_ranked;

          // Clean up markdown code blocks
          rankedStr = rankedStr
            .replace(/```json\s*/g, '')
            .replace(/```\s*$/g, '')
            .trim();

          const rankedData = JSON.parse(rankedStr);

          setReport({
            raw_results: employee.osint_raw,
            ranked: rankedData
          });
          setLoading(false);
          return;
        } catch (e) {
          console.error("Failed to parse saved ranked data", e);
        }
      }

      // Otherwise run fresh scan
      setLoading(true);
      try {
        const res = await axios.post('/api/osint/generate', {
          employee_id: employee.id
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setReport(res.data.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [employee.id, token]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl p-12 flex flex-col items-center max-w-sm text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-6" />
          <h3 className="text-xl font-semibold mb-2">Running OSINT Analysis</h3>
          <p className="text-gray-500">This can take 1–4 minutes. Please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
        <div className="bg-white rounded-3xl p-10 max-w-md text-center">
          <p className="text-red-600 mb-6">Error: {error}</p>
          <button onClick={onClose} className="px-6 py-3 bg-gray-100 rounded-2xl">
            Close
          </button>
        </div>
      </div>
    );
  }

  const ranked = report?.ranked || {};

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="px-8 py-6 border-b flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">OSINT Security Report</h2>
            <p className="text-gray-600">{employee.first_name} {employee.last_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <div className="grid grid-cols-3 gap-6 mb-10">
            <div className="bg-white border rounded-2xl p-6">
              <p className="text-sm text-gray-500">Accuracy</p>
              <p className="text-5xl font-bold text-blue-600 mt-3">{ranked.accuracy || '—'}/10</p>
            </div>
            <div className="bg-white border rounded-2xl p-6">
              <p className="text-sm text-gray-500">Usefulness</p>
              <p className="text-5xl font-bold text-emerald-600 mt-3">{ranked.usefulness || '—'}/10</p>
            </div>
            <div className="bg-white border rounded-2xl p-6">
              <p className="text-sm text-gray-500">Risk Level</p>
              <p className={`text-5xl font-bold mt-3 ${
                ranked.risk_level === 'Critical' ? 'text-red-600' : 
                ranked.risk_level === 'High' ? 'text-orange-600' : 'text-amber-600'
              }`}>
                {ranked.risk_level || 'Medium'}
              </p>
            </div>
          </div>

          <div className="space-y-10">
            <div>
              <h3 className="font-semibold mb-4">Key Findings</h3>
              <ul className="space-y-2 text-gray-700">
                {ranked.key_findings?.map((item, i) => (
                  <li key={i} className="flex gap-3"><span className="text-emerald-500">→</span> {item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Training Recommendations</h3>
              <ul className="space-y-2 text-gray-700">
                {ranked.training_recommendations?.map((item, i) => (
                  <li key={i} className="flex gap-3"><span className="text-blue-600">★</span> {item}</li>
                ))}
              </ul>
            </div>
          </div>

          <details className="mt-12 border-t pt-6">
            <summary className="cursor-pointer text-blue-600 font-medium">View Raw OSINT Data</summary>
            <pre className="mt-4 bg-gray-900 text-gray-300 p-6 rounded-2xl overflow-auto text-xs">
              {report?.raw_results}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
};

export default OsintReport;