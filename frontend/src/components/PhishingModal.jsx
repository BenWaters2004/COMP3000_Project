import React, { useState, useEffect } from 'react';
import { X, Loader2, RefreshCw } from 'lucide-react';
import { api } from "../lib/api"; // ← use your consistent api instance

const PhishingModal = ({ employee, phishingData: propPhishingData, onClose, onGenerate }) => {
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
        // Auto-generate if no saved email
        await handleGenerate();
      }
    };

    loadPhishingEmail();
  }, [employee.id, employee.phishing_email]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await api.post('/api/osint/generate-phishing', {
        employee_id: employee.id
      });
      const newData = res.data.data;
      setPhishingData(newData);
      onGenerate?.(employee); // callback to parent if needed
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to generate phishing email");
    } finally {
      setGenerating(false);
    }
  };

  if (generating) {
    return (
      <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 p-4 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 md:p-12 flex flex-col items-center max-w-sm w-full text-center shadow-2xl">
          <RefreshCw className="w-12 h-12 animate-spin text-purple-600 dark:text-purple-400 mb-6" />
          <h3 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-3">
            Generating Phishing Email
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Personalizing based on OSINT data...
          </p>
        </div>
      </div>
    );
  }

  if (error && !phishingData) {
    return (
      <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 p-6 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-10 max-w-md w-full text-center shadow-2xl border border-red-200 dark:border-red-800">
          <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Error
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-8">
            {error}
          </p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={onClose} 
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-200 rounded-xl font-medium transition"
            >
              Close
            </button>
            <button 
              onClick={handleGenerate} 
              disabled={generating}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition disabled:opacity-60 flex items-center gap-2"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw size={18} />}
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const data = phishingData || {};

  return (
    <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 p-4 md:p-6 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-5 md:px-8 md:py-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Simulated Spear-Phishing Email
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {employee.first_name} {employee.last_name}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition"
            aria-label="Close modal"
          >
            <X size={28} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50/50 dark:bg-gray-950/50">
          {data.subject || data.body ? (
            <>
              {/* Email Preview */}
              <div className="mb-10">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Email Preview
                </h3>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between mb-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>From: {data.from_name} &lt;{data.from_email}&gt;</span>
                    <span className="mt-1 sm:mt-0">To: {employee.email}</span>
                  </div>
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                      {data.subject || '(No subject)'}
                    </h1>
                  </div>
                  <div 
                    className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: data.body || '<p>No email body available.</p>' }}
                  />
                </div>
              </div>

              {/* Training Explanation */}
              <div className="mb-10">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Why This Email is Dangerous (Training Insight)
                </h3>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 shadow-sm">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {data.explanation || 'No explanation available for this simulation.'}
                  </p>
                </div>
              </div>

              {/* Regenerate Button */}
              <div className="flex justify-center">
                <button 
                  onClick={handleGenerate} 
                  disabled={generating}
                  className="
                    flex items-center gap-2 px-8 py-3 
                    bg-gradient-to-r from-purple-600 to-indigo-600 
                    hover:from-purple-700 hover:to-indigo-700 
                    text-white rounded-xl font-medium 
                    transition-all duration-200 shadow-md hover:shadow-lg 
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={18} />
                      Regenerate New Email
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-6">
                No phishing email generated yet for this employee.
              </p>
              <button 
                onClick={handleGenerate} 
                disabled={generating}
                className="
                  flex items-center gap-2 mx-auto px-8 py-3 
                  bg-gradient-to-r from-purple-600 to-indigo-600 
                  hover:from-purple-700 hover:to-indigo-700 
                  text-white rounded-xl font-medium 
                  transition-all duration-200 shadow-md hover:shadow-lg 
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    Generate Phishing Email
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhishingModal;