import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import './CooldownModal.css';

const CooldownModal = ({ isOpen, onClose, remainingSeconds }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="cooldown-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Compact Modal Card */}
          <motion.div
            className="cooldown-modal-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="cooldown-icon-container">
              <Clock size={32} className="cooldown-icon" />
            </div>

            {/* Message */}
            <h2 className="cooldown-modal-title">
              Please Wait
            </h2>

            <p className="cooldown-modal-subtitle">
              {remainingSeconds} seconds before sending another SOS
            </p>

            {/* OK Button */}
            <button className="cooldown-modal-ok-btn" onClick={onClose}>
              OK
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CooldownModal;
