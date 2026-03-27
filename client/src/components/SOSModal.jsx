import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Siren } from 'lucide-react';
import './SOSModal.css';

const SOSModal = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="sos-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Compact Modal Card */}
          <motion.div
            className="sos-modal-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="sos-icon-container">
              <Siren size={32} className="sos-icon" />
            </div>

            {/* Message */}
            <h2 className="sos-modal-title">
              SOS Sent Successfully!
            </h2>

            <p className="sos-modal-subtitle">
              Help is on the way 🚑
            </p>

            {/* OK Button */}
            <button className="sos-modal-ok-btn" onClick={onClose}>
              OK
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SOSModal;
