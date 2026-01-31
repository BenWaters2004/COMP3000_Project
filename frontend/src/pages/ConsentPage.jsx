import { useState, useEffect } from "react";
import { ParticlesBackground } from "../utils/Particles";
import "../App.css";
import { consentBg } from "../assets";
import { motion, AnimatePresence } from "framer-motion";

export default function ConsentPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    birthdate: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowForm(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agreed) return;
    setIsSubmitting(true);
    setTimeout(() => {
      alert("Consent recorded. Proceeding to simulation...");
      setIsSubmitting(false);
    }, 2000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="consent-root">

      {/* Background */}
      <div
        className="consent-bg"
        style={{ backgroundImage: `url(${consentBg})` }}
        aria-hidden
      />

      {/* Particles */}
      <div className="consent-particles">
        <ParticlesBackground />
      </div>

      {/* Gradient Overlay */}
      <div className="consent-gradient" aria-hidden />

      {/* Floating Card Container */}
      <div className="consent-floating-container">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="consent-glass-card"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="consent-card-inner"
          >
            {/* Header */}
            <div className="consent-header">
              <h2 className="consent-title">AIDEN</h2>
              <p className="consent-subtitle">Agentic Intelligence Dual-use Evaluation Network</p>
            </div>

            {/* Consent Summary */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="consent-summary"
            >
              <p>
                This tool simulates AI-driven spear-phishing <strong>using only your data</strong> in a
                controlled, ethical environment.
              </p>
            </motion.div>

            {/* Expandable Form */}
            <AnimatePresence>
              {showForm && (
                <motion.form
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  onSubmit={handleSubmit}
                  className="consent-form"
                >
                  {/* Name */}
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="consent-field"
                  >
                    <label className="consent-label">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Jane Doe"
                      required
                      className="consent-input"
                    />
                  </motion.div>

                  {/* Email */}
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="consent-field"
                  >
                    <label className="consent-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="jane@example.com"
                      required
                      className="consent-input"
                    />
                  </motion.div>

                  {/* Birthdate */}
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="consent-field"
                  >
                    <label className="consent-label">Birthdate</label>
                    <input
                      type="date"
                      name="birthdate"
                      value={formData.birthdate}
                      onChange={handleInputChange}
                      required
                      className="consent-input"
                    />
                  </motion.div>

                  {/* Checkbox */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="consent-checkbox-wrapper"
                  >
                    <label className="consent-checkbox-label">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="consent-checkbox"
                      />
                      <span className="checkmark" />
                      <span className="consent-checkbox-text">
                        I consent to the use of <strong>only my data</strong> for ethical simulation.
                        I understand outputs are for research only.
                      </span>
                    </label>
                  </motion.div>

                  {/* Submit */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="consent-button-wrapper"
                  >
                    <button
                      type="submit"
                      disabled={!agreed || isSubmitting}
                      className={`consent-button ${isSubmitting ? "loading" : ""}`}
                    >
                      {isSubmitting ? (
                        <span className="loader" />
                      ) : (
                        "I Consent"
                      )}
                    </button>
                  </motion.div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="consent-footer"
            >
              <p>
                <strong>Ethical AI Research Only</strong> • Withdraw anytime • Data encrypted
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}