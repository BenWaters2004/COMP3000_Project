import React, { useState, useEffect } from 'react';
import { X, Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';

const PhishingModal = ({ employee, phishingData: propPhishingData, onClose, onGenerate, token }) => {
  const [phishingData, setPhishingData] = useState(propPhishingData);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPhishingEmail = async () => {
      if (employee.phishing_email) {
        try {
          const parsedData = JSON.parse(employee.phishing_email);
          setPhishingData(parsedData);
        } catch (e) {
          console.error("Failed to parse saved phishing data", e);
          setError("Failed to load saved phishing email.");
        }
      } else {
        // If no saved email, auto-generate
        await handleGenerate();
      }
    };

    loadPhishingEmail();
  }, [employee.id]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await axios.post('/api/osint/generate-phishing', {
        employee_id: employee.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newData = res.data.data;
      setPhishingData(newData);
      onGenerate?.(employee); // Optional callback to parent
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (generating) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl p-12 flex flex-col items-center max-w-sm text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-purple-600 mb-6" />
          <h3 className="text-xl font-semibold mb-2">Generating Phishing Email</h3>
          <p className="text-gray-500">Personalizing based on OSINT data...</p>
        </div>
      </div>
    );
  }

  if (error && !phishingData) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
        <div className="bg-white rounded-3xl p-10 max-w-md text-center">
          <p className="text-red-600 mb-6">Error: {error}</p>
          <button onClick={onClose} className="px-6 py-3 bg-gray-100 rounded-2xl mr-2">
            Close
          </button>
          <button 
            onClick={handleGenerate} 
            className="px-6 py-3 bg-purple-600 text-white rounded-2xl"
            disabled={generating}
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : null}
            Try Generate
          </button>
        </div>
      </div>
    );
  }

  const data = phishingData || {};

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="px-8 py-6 border-b flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Simulated Spear-Phishing Email</h2>
            <p className="text-gray-600">{employee.first_name} {employee.last_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-8">
          {data && (
            <>
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-2">Email Preview</h3>
                <div className="bg-gray-50 border rounded-xl p-6">
                  <div className="flex justify-between mb-4 text-sm text-gray-500">
                    <span>From: {data.from_name} &lt;{data.from_email}&gt;</span>
                    <span>To: {employee.email}</span>
                  </div>
                  <div className="border-b pb-2 mb-4">
                    <h1 className="text-xl font-bold text-gray-900">{data.subject}</h1>
                  </div>
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: data.body || '' }}
                  />
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-2">Training Explanation</h3>
                <div className="bg-blue-50 border rounded-xl p-6">
                  <p className="text-gray-700 whitespace-pre-wrap">{data.explanation || 'No explanation available.'}</p>
                </div>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={handleGenerate} 
                  className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-medium flex items-center"
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Regenerating...
                    </>
                  ) : (
                    'Regenerate New Email'
                  )}
                </button>
              </div>
            </>
          )}

          {!data && !error && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-6">No phishing email available yet.</p>
              <button 
                onClick={handleGenerate} 
                className="px-8 py-3 bg-purple-600 text-white rounded-2xl font-medium"
                disabled={generating}
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : null}
                Generate Email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhishingModal;