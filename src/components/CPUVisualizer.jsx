

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProcessBlock from './ProcessBlock';

/**
 * CPUVisualizer Component
 * 
 * Displays the CPU core with the currently running process.
 * 
 * @param {Object} props
 * @param {Object} props.runningProcess - Currently executing process (or null)
 * @param {boolean} props.isContextSwitching - Whether a context switch is occurring
 * @param {number} props.quantumRemaining - Time remaining in current quantum
 * @param {string} props.algorithm - Current scheduling algorithm
 */
function CPUVisualizer({
  runningProcess,
  isContextSwitching,
  quantumRemaining,
  algorithm
}) {
  const isActive = !!runningProcess;
  const isIdle = !runningProcess && !isContextSwitching;

  return (
    <div className="cpu-visualizer">
      <div className="cpu-header">
        <h2>CPU Core</h2>
        <div className="cpu-meta">
          {quantumRemaining && quantumRemaining !== Infinity && (
            <span className="quantum-display">
              Quantum: <strong>{quantumRemaining}</strong>
            </span>
          )}
        </div>
      </div>

      {/* CPU Chip Visualization */}
      <div className="cpu-container">
        {/* Background circuit pattern */}
        <div className="cpu-circuit-bg">
          <svg viewBox="0 0 100 100" className="circuit-svg">
            {/* Circuit traces */}
            <path d="M50 0 L50 30 M50 70 L50 100" stroke="currentColor" strokeWidth="0.5" fill="none" />
            <path d="M0 50 L30 50 M70 50 L100 50" stroke="currentColor" strokeWidth="0.5" fill="none" />
            <path d="M20 20 L30 30 M70 70 L80 80" stroke="currentColor" strokeWidth="0.3" fill="none" />
            <path d="M80 20 L70 30 M30 70 L20 80" stroke="currentColor" strokeWidth="0.3" fill="none" />
            {/* Corner pins */}
            <circle cx="15" cy="15" r="2" fill="currentColor" opacity="0.3" />
            <circle cx="85" cy="15" r="2" fill="currentColor" opacity="0.3" />
            <circle cx="15" cy="85" r="2" fill="currentColor" opacity="0.3" />
            <circle cx="85" cy="85" r="2" fill="currentColor" opacity="0.3" />
          </svg>
        </div>

        {/* CPU Core */}
        <motion.div
          className={`cpu-core ${isActive ? 'active' : ''} ${isIdle ? 'idle' : ''} ${isContextSwitching ? 'switching' : ''}`}
          animate={{
            boxShadow: isActive
              ? [
                '0 0 30px rgba(34, 197, 94, 0.3), inset 0 0 20px rgba(34, 197, 94, 0.1)',
                '0 0 50px rgba(34, 197, 94, 0.5), inset 0 0 30px rgba(34, 197, 94, 0.2)',
                '0 0 30px rgba(34, 197, 94, 0.3), inset 0 0 20px rgba(34, 197, 94, 0.1)'
              ]
              : isContextSwitching
                ? [
                  '0 0 30px rgba(147, 51, 234, 0.5), inset 0 0 20px rgba(147, 51, 234, 0.2)',
                  '0 0 50px rgba(147, 51, 234, 0.7), inset 0 0 30px rgba(147, 51, 234, 0.3)',
                  '0 0 30px rgba(147, 51, 234, 0.5), inset 0 0 20px rgba(147, 51, 234, 0.2)'
                ]
                : '0 0 20px rgba(100, 100, 120, 0.2), inset 0 0 10px rgba(100, 100, 120, 0.1)'
          }}
          transition={{
            duration: isActive ? 1 : isContextSwitching ? 0.3 : 0,
            repeat: isActive || isContextSwitching ? Infinity : 0
          }}
        >
          {/* Activity indicator ring */}
          <motion.div
            className="cpu-activity-ring"
            animate={{
              rotate: isActive ? 360 : 0,
              opacity: isActive ? 1 : 0.3
            }}
            transition={{
              rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
              opacity: { duration: 0.3 }
            }}
          >
            <svg viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke="url(#activityGradient)"
                strokeWidth="2"
                strokeDasharray="20 10"
              />
              <defs>
                <linearGradient id="activityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(34, 197, 94, 0.8)" />
                  <stop offset="50%" stopColor="rgba(34, 197, 94, 0.2)" />
                  <stop offset="100%" stopColor="rgba(34, 197, 94, 0.8)" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          {/* Process display area */}
          <div className="cpu-process-area">
            <AnimatePresence mode="wait">
              {isContextSwitching ? (
                <motion.div
                  key="switching"
                  className="context-switch-indicator"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <motion.div
                    className="switch-spinner"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                  >
                    ⟳
                  </motion.div>
                  <span>Context Switching</span>
                  <span className="switch-cost">Overhead Cost!</span>
                </motion.div>
              ) : runningProcess ? (
                <motion.div
                  key={runningProcess.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="running-process-display"
                >
                  <ProcessBlock
                    process={runningProcess}
                    showDetails={true}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  className="cpu-idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="idle-text">CPU Idle</span>
                  <span className="idle-hint">No processes in ready queue</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CPU label */}
          <div className="cpu-label">
            <span className="chip-name">SCHEDULER v1.0</span>
          </div>
        </motion.div>

        {/* Data flow indicators */}
        <div className="data-flow-indicators">
          <motion.div
            className="data-arrow left"
            animate={{
              opacity: isActive ? [0.3, 1, 0.3] : 0.1,
              x: isActive ? [0, -5, 0] : 0
            }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            →
          </motion.div>
          <motion.div
            className="data-arrow right"
            animate={{
              opacity: isActive ? [0.3, 1, 0.3] : 0.1,
              x: isActive ? [0, 5, 0] : 0
            }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
          >
            ←
          </motion.div>
        </div>
      </div>

      {/* Educational tooltip */}
      <div className="cpu-tooltip">
        {isContextSwitching && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="tooltip-warning"
          >
            <strong>Context Switch Overhead:</strong> The CPU is saving the old process state
            and loading the new one. This takes time and adds to execution overhead.
          </motion.p>
        )}
        {isIdle && (
          <p className="tooltip-info">
            The CPU is waiting for work. Add processes or use Quick Add to begin.
          </p>
        )}
      </div>
    </div>
  );
}

export default CPUVisualizer;
