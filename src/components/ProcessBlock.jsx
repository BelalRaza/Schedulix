/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         PROCESS BLOCK COMPONENT                           ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║ Visual representation of a single process.                                 ║
 * ║ Color-coded by state: Green (Running), Yellow (Ready), Red (Waiting)      ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Get state-based styling
 * 
 * @param {string} state - Process state
 * @returns {Object} - Style configuration
 */
const getStateStyle = (state) => {
  switch (state) {
    case 'RUNNING':
      return {
        className: 'process-running',
        glow: 'rgba(34, 197, 94, 0.6)',
        icon: '▶',
        label: 'Executing'
      };
    case 'READY':
      return {
        className: 'process-ready',
        glow: 'rgba(234, 179, 8, 0.4)',
        icon: '◉',
        label: 'Ready'
      };
    case 'WAITING':
      return {
        className: 'process-waiting',
        glow: 'rgba(239, 68, 68, 0.4)',
        icon: '◎',
        label: 'I/O Wait'
      };
    case 'TERMINATED':
      return {
        className: 'process-terminated',
        glow: 'rgba(107, 114, 128, 0.3)',
        icon: '✓',
        label: 'Done'
      };
    default:
      return {
        className: 'process-new',
        glow: 'rgba(99, 102, 241, 0.4)',
        icon: '○',
        label: 'New'
      };
  }
};

/**
 * ProcessBlock Component
 * 
 * Renders a single process with state-based styling and animations.
 * 
 * @param {Object} props
 * @param {Object} props.process - Process snapshot data
 * @param {boolean} props.showDetails - Show detailed info
 * @param {boolean} props.compact - Use compact layout
 * @param {Function} props.onKill - Callback to kill process
 * @param {number} props.index - Index for stagger animation
 */
function ProcessBlock({ 
  process, 
  showDetails = false, 
  compact = false,
  onKill,
  index = 0 
}) {
  const stateStyle = getStateStyle(process.state);
  const progress = process.progress || 0;
  
  // Animation variants
  const variants = {
    initial: { 
      opacity: 0, 
      scale: 0.8,
      y: 20 
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        delay: index * 0.05
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      x: 100,
      transition: { duration: 0.2 }
    },
    hover: {
      scale: 1.02,
      boxShadow: `0 8px 30px ${stateStyle.glow}`
    }
  };
  
  // Running process pulse animation
  const pulseAnimation = process.state === 'RUNNING' ? {
    boxShadow: [
      `0 0 20px ${stateStyle.glow}`,
      `0 0 40px ${stateStyle.glow}`,
      `0 0 20px ${stateStyle.glow}`
    ]
  } : {};
  
  return (
    <motion.div
      className={`process-block ${stateStyle.className} ${compact ? 'compact' : ''}`}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      layout
      style={{ '--process-color': process.color }}
    >
      {/* State indicator glow */}
      <motion.div 
        className="process-glow"
        animate={pulseAnimation}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      
      {/* Process header */}
      <div className="process-header">
        <span className="process-state-icon">{stateStyle.icon}</span>
        <span className="process-name">{process.name}</span>
        {process.queueLevel !== undefined && process.queueLevel > 0 && (
          <span className="queue-badge">Q{process.queueLevel}</span>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="process-progress-container">
        <motion.div 
          className="process-progress-bar"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
        <span className="process-progress-text">
          {process.remainingTime}/{process.burstTime}
        </span>
      </div>
      
      {/* Details (when expanded) */}
      {showDetails && (
        <motion.div 
          className="process-details"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <div className="detail-row">
            <span className="detail-label">Arrival</span>
            <span className="detail-value">{process.arrivalTime}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Burst</span>
            <span className="detail-value">{process.burstTime}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Waiting</span>
            <span className="detail-value">{process.waitingTime.toFixed(1)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Priority</span>
            <span className="detail-value">{process.priority}</span>
          </div>
        </motion.div>
      )}
      
      {/* Kill button */}
      {onKill && process.state !== 'TERMINATED' && (
        <motion.button
          className="kill-button"
          onClick={(e) => {
            e.stopPropagation();
            onKill(process.id);
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Kill Process"
        >
          ×
        </motion.button>
      )}
      
      {/* State label */}
      {!compact && (
        <span className="process-state-label">{stateStyle.label}</span>
      )}
    </motion.div>
  );
}

export default ProcessBlock;
