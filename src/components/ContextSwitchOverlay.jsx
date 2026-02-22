
import React from 'react';
import { motion } from 'framer-motion';

/**
 * ContextSwitchOverlay Component
 * 
 * @param {Object} props
 * @param {Object} props.info - Context switch information
 * @param {Object} props.info.from - Process being switched out
 * @param {Object} props.info.to - Process being switched in
 * @param {number} props.info.overhead - Time cost of the switch
 */
function ContextSwitchOverlay({ info }) {
  const { from, to, overhead } = info;

  return (
    <motion.div
      className="context-switch-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="overlay-content"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="overlay-header">
          <motion.span
            className="switch-icon"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.6, repeat: 1 }}
          >
            ⟳
          </motion.span>
          <h2>Context Switch</h2>
        </div>

        <div className="switch-visualization">
          {/* Process being switched out */}
          <motion.div
            className="switch-process out"
            initial={{ x: 0, opacity: 1 }}
            animate={{ x: -50, opacity: 0.5 }}
            transition={{ duration: 0.3 }}
          >
            <span className="direction">OUT</span>
            {from ? (
              <>
                <span
                  className="process-color"
                  style={{ backgroundColor: from.color }}
                />
                <span className="process-name">{from.name}</span>
              </>
            ) : (
              <span className="process-name idle">Idle</span>
            )}
          </motion.div>

          {/* Switch arrow */}
          <motion.div
            className="switch-arrow"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 0.5, repeat: 1 }}
          >
            ⟶
          </motion.div>

          {/* Process being switched in */}
          <motion.div
            className="switch-process in"
            initial={{ x: 50, opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <span className="direction">IN</span>
            <span
              className="process-color"
              style={{ backgroundColor: to.color }}
            />
            <span className="process-name">{to.name}</span>
          </motion.div>
        </div>

        {/* What's happening explanation */}
        <div className="switch-details">
          <div className="detail-item">
            <span>Saving CPU registers &amp; state</span>
          </div>
          <div className="detail-item">
            <span>Updating Process Control Block</span>
          </div>
          <div className="detail-item">
            <span>Loading new process state</span>
          </div>
          <div className="detail-item">
            <span>Flushing TLB cache</span>
          </div>
        </div>

        {/* Overhead cost */}
        <motion.div
          className="overhead-badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <span className="overhead-label">Overhead Cost</span>
          <span className="overhead-value">{overhead} time unit{overhead > 1 ? 's' : ''}</span>
        </motion.div>

        {/* Educational note */}
        <p className="switch-note">
          This is overhead time — the CPU is doing housekeeping, not useful work.
          Too many context switches degrade performance.
        </p>
      </motion.div>
    </motion.div>
  );
}

export default ContextSwitchOverlay;
