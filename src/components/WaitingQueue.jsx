

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProcessBlock from './ProcessBlock';

/**
 * WaitingQueue Component
 * 
 * @param {Object} props
 * @param {Array} props.processes - Processes in waiting queue
 */
function WaitingQueue({ processes }) {
  return (
    <div className="waiting-queue">
      <div className="queue-header">
        <h3>
          I/O Wait Queue
          <span className="process-count waiting">{processes.length}</span>
        </h3>
        <span className="queue-hint">Blocked for I/O operations</span>
      </div>

      <div className="queue-content">
        <AnimatePresence mode="popLayout">
          {processes.length > 0 ? (
            <div className="waiting-processes">
              {processes.map((process, i) => (
                <motion.div
                  key={process.id}
                  className="waiting-slot"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProcessBlock
                    process={process}
                    compact={true}
                    index={i}
                  />
                  {/* I/O Activity indicator */}
                  <motion.div
                    className="io-indicator"
                    animate={{
                      opacity: [0.5, 1, 0.5],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <span className="io-text">I/O in progress...</span>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              className="empty-queue-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span>No I/O waits</span>
              <span className="empty-hint">All processes are CPU-bound</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Educational note */}
      <div className="queue-education">
        <p>
          <strong>I/O Wait:</strong> Processes here are blocked waiting for disk, network,
          or other I/O operations. They do not consume CPU time until I/O completes.
        </p>
      </div>
    </div>
  );
}

export default WaitingQueue;
