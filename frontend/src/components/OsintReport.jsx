import React, { useState, useEffect } from 'react';
import { X, Loader2, Copy, Check, Download, ChevronDown, AlertCircle, Shield, ChevronUp } from 'lucide-react';
import { api } from "../lib/api";
import axios from 'axios';
import jsPDF from 'jspdf';

const OsintReport = ({ employee, token, onClose }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [orgData, setOrgData] = useState(null);

  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Load OSINT report
        if (employee.osint_ranked) {
          let rankedStr = employee.osint_ranked
            .replace(/```json\s*/g, '')
            .replace(/```\s*$/g, '')
            .trim();

          const rankedData = JSON.parse(rankedStr);

          setReport({
            raw_results: employee.osint_raw,
            ranked: rankedData
          });
        } else {
          const res = await api.post('/api/osint/generate', {
            employee_id: employee.id
          });
          setReport(res.data.data);
        }

        // 2. Load organisation data for branding (logo + color)
        if (employee.organisation_id) {
          const orgRes = await api.get(`/api/organisations/${employee.organisation_id}`);
          setOrgData(orgRes.data.organisation || orgRes.data);
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Failed to load report or organisation data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [employee.id, employee.osint_ranked, employee.organisation_id]);

  const copyRawData = () => {
    const rawText = employee.osint_raw || report?.raw_results || "No raw data available.";
    navigator.clipboard.writeText(rawText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      alert("Failed to copy to clipboard");
    });
  };

  const exportToPDF = async () => {
    if (exporting || !report) return;
    setExporting(true);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Brand colors & logo
    const brandColorHex = orgData?.primary_color || '#3b82f6';
    const brandColorRGB = hexToRgb(brandColorHex);

    const logoPath = orgData?.logo_path;
    const logoUrl = logoPath ? `${apiBase}/storage/${logoPath}` : null;

    // Header with logo (if available)
    let headerY = 15;
    if (logoUrl) {
      try {
        const img = await loadImage(logoUrl);
        doc.addImage(img, 'PNG', 20, headerY - 5, 35, 35); // slightly larger, centered vertically
        headerY += 40;
      } catch (e) {
        console.warn("Failed to load logo for PDF", e);
      }
    }

    // Company name & subtitle
    doc.setFontSize(24);
    doc.setTextColor(...brandColorRGB);
    doc.text("AIDEN", 20, headerY);

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text("Agentic Intelligence Dual-use Evaluation Network", 20, headerY + 7);

    doc.setLineWidth(0.7);
    doc.setDrawColor(...brandColorRGB);
    doc.line(20, headerY + 12, 190, headerY + 12);

    // Report title & employee info
    let y = headerY + 25;
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text("OSINT Security Assessment Report", 20, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(`Employee: ${employee.first_name} ${employee.last_name}`, 20, y);
    y += 6;
    doc.text(`Email: ${employee.email}`, 20, y);
    y += 6;
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    })}`, 20, y);
    y += 15;

    // Scores section
    doc.setFontSize(14);
    doc.text("Risk Assessment Summary", 20, y);
    y += 8;

    doc.setFontSize(11);
    doc.text(`Accuracy Score: ${report?.ranked?.accuracy ?? '—'}/10`, 25, y);
    y += 7;
    doc.text(`Usefulness Score: ${report?.ranked?.usefulness ?? '—'}/10`, 25, y);
    y += 7;

    let riskColor = [0, 0, 0];
    if (report?.ranked?.risk_level === 'Critical') riskColor = [220, 38, 38];
    else if (report?.ranked?.risk_level === 'High') riskColor = [249, 115, 22];
    else riskColor = [245, 158, 11];

    doc.setTextColor(...riskColor);
    doc.text(`Risk Level: ${report?.ranked?.risk_level || 'Medium'}`, 25, y);
    doc.setTextColor(15, 23, 42);
    y += 15;

    // Key Findings
    doc.setFontSize(14);
    doc.text("Key Findings", 20, y);
    y += 8;

    doc.setFontSize(11);
    (report?.ranked?.key_findings || []).forEach(item => {
      const lines = doc.splitTextToSize(`• ${item}`, 160);
      doc.text(lines, 25, y);
      y += lines.length * 6 + 2;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    y += 10;

    // Training Recommendations
    doc.setFontSize(14);
    doc.text("Training Recommendations", 20, y);
    y += 8;

    doc.setFontSize(11);
    (report?.ranked?.training_recommendations || []).forEach(item => {
      const lines = doc.splitTextToSize(`- ${item}`, 160);  // Changed to - for better font rendering
      doc.text(lines, 25, y);
      y += lines.length * 6 + 2;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    y += 15;

    // Raw OSINT Data
    doc.setFontSize(14);
    doc.text("Raw OSINT Data", 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    const rawText = employee.osint_raw || report?.raw_results || "No raw data available.";
    const rawLines = doc.splitTextToSize(rawText, 170);

    // Explicitly loop through raw lines to handle multi-page
    rawLines.forEach(line => {
      doc.text(line, 20, y);
      y += 5; // Line height for font size 10
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    // Footer on all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text("Confidential – AIDEN Security Awareness Platform", 20, 287, { align: 'left' });
      doc.text(`Page ${i} of ${pageCount}`, 105, 287, { align: 'center' });
      doc.text(new Date().toLocaleDateString(), 190, 287, { align: 'right' });
    }

    doc.save(`OSINT_Security_Report_${employee.first_name}_${employee.last_name}_${new Date().toISOString().slice(0,10)}.pdf`);

    setExporting(false);
  };

  // Helper: Convert hex to RGB array for jsPDF
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [59, 130, 246]; // fallback blue-500
  };

  // Helper: Load image for PDF (needed for logo)
  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 p-4 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 md:p-12 flex flex-col items-center max-w-sm w-full text-center shadow-2xl">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 mb-6" />
          <h3 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-3">
            Running OSINT Analysis
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            This can take 1–4 minutes. Please wait...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 p-6 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-10 max-w-md w-full text-center shadow-2xl border border-red-200 dark:border-red-800">
          <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Error Loading Report
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-8">
            {error}
          </p>
          <button 
            onClick={onClose} 
            className="px-8 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-200 rounded-xl font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const ranked = report?.ranked || {};

  return (
    <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 p-4 md:p-6 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-5 md:px-8 md:py-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              OSINT Security Report
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {employee.first_name} {employee.last_name}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={exportToPDF}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition disabled:opacity-50 shadow-md"
              title="Export as PDF"
            >
              {exporting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              Export PDF
            </button>
            <button 
              onClick={onClose} 
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition"
              aria-label="Close report"
            >
              <X size={28} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50/50 dark:bg-gray-950/50">
          {/* Scores Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Accuracy</p>
              <p className="text-5xl md:text-6xl font-bold text-blue-600 dark:text-blue-400">
                {ranked.accuracy ?? '—'}/10
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Usefulness</p>
              <p className="text-5xl md:text-6xl font-bold text-emerald-600 dark:text-emerald-400">
                {ranked.usefulness ?? '—'}/10
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Risk Level</p>
              <p className={`text-5xl md:text-6xl font-bold ${
                ranked.risk_level === 'Critical' ? 'text-red-600 dark:text-red-400' : 
                ranked.risk_level === 'High' ? 'text-orange-600 dark:text-orange-400' : 
                'text-amber-600 dark:text-amber-400'
              }`}>
                {ranked.risk_level || 'Medium'}
              </p>
            </div>
          </div>

          {/* Findings & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertCircle size={20} className="text-amber-600" />
                Key Findings
              </h3>
              {ranked.key_findings?.length ? (
                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                  {ranked.key_findings.map((item, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="text-emerald-500 dark:text-emerald-400 mt-1 text-lg">→</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">No key findings available.</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield size={20} className="text-blue-600" />
                Training Recommendations
              </h3>
              {ranked.training_recommendations?.length ? (
                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                  {ranked.training_recommendations.map((item, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="text-blue-500 dark:text-blue-400 mt-1 text-lg">★</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">No recommendations available.</p>
              )}
            </div>
          </div>

          {/* Collapsible Raw Data */}
          <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="w-full flex items-center justify-between text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition py-3 px-4 bg-gray-100 dark:bg-gray-800 rounded-xl"
            >
              <span className="flex items-center gap-2">
                <AlertCircle size={20} className="text-amber-600" />
                Raw OSINT Data
              </span>
              {showRaw ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {showRaw && (
              <div className="mt-4 relative">
                <pre className="bg-gray-900 text-gray-200 p-6 rounded-2xl overflow-auto text-sm leading-relaxed font-mono border border-gray-700 whitespace-pre-wrap">
                  {employee.osint_raw || report?.raw_results || "No raw data available."}
                </pre>

                <button
                  onClick={copyRawData}
                  className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-lg text-sm transition backdrop-blur-sm"
                >
                  {copied ? (
                    <>
                      <Check size={16} className="text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Export */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
          <button
            onClick={exportToPDF}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition disabled:opacity-50 shadow-md"
          >
            {exporting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            Export as PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default OsintReport;