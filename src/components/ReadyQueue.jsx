/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                        READY QUEUE COMPONENT                              ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║ Visualizes the Ready Queue - processes waiting for CPU time.              ║
 * ║                                                                           ║
 * ║ For MLFQ: Shows multiple priority queues stacked vertically.              ║
 * ║ For other algorithms: Shows a single FIFO queue.                          ║
 * ║                                                                           ║
 * ║ Processes are color-coded YELLOW to indicate Ready state.                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProcessBlock from './ProcessBlock';

/**
 * ReadyQueue Component
 * 
 * @param {Object} props
 * @param {Array} props.processes - Processes in ready queue
 * @param {string} props.algorithm - Current scheduling algorithm
 * @param {Function} props.onKillProcess - Callback to kill a process
 */
function ReadyQueue({ processes, algorithm, onKillProcess }) {
  const isMLFQ = algorithm === 'MLFQ';
  
  // For MLFQ, group processes by queue level
  const queueLevels = isMLFQ ? [
    { level: 0, label: 'Queue 0 (High Priority)', quantum: 4 },
    { level: 1, label: 'Queue 1 (Medium Priority)', quantum: 8 },
    { level: 2, label: 'Queue 2 (Low Priority)', quantum: 16 }
  ] : null;
  
  const getProcessesForLevel = (level) => {
    return processes.filter(p => (p.queueLevel || 0) === level);
  };
  
  return (
    <div className="ready-queue">
      <div className="queue-header">
        <h3>
          Ready Queue
          <span className="process-count">{processes.length}</span>
        </h3>
        <span className="queue-hint">
          {isMLFQ ? 'Multi-Level Feedback Queues' : 'Processes waiting for CPU'}
        </span>
      </div>
      
      <div className={`queue-content ${isMLFQ ? 'mlfq' : 'single'}`}>
        {isMLFQ ? (
          // MLFQ - Multiple priority queues
          <div className="mlfq-queues">
            {queueLevels.map((q, idx) => {
              const levelProcesses = getProcessesForLevel(q.level);
              return (
                <motion.div 
                  key={q.level}
                  className={`mlfq-level level-${q.level}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="level-header">
                    <span className="level-label">{q.label}</span>
                    <span className="level-quantum">Q = {q.quantum}</span>
                    <span className="level-count">{levelProcesses.length}</span>
                  </div>
                  <div className="level-processes">
                    <AnimatePresence mode="popLayout">
                      {levelProcesses.length > 0 ? (
                        levelProcesses.map((process, i) => (
                          <ProcessBlock
                            key={process.id}
                            process={process}
                            compact={true}
                            index={i}
                            onKill={onKillProcess}
                          />
                        ))
                      ) : (
                        <motion.div 
                          className="empty-queue"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.5 }}
                        >
                          Empty
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {/* Visual arrows showing demotion flow */}
                  {q.level < queueLevels.length - 1 && (
                    <div className="demotion-arrow">
                      <span className="arrow-label">Demote if uses full quantum</span>
                      <span className="arrow">↓</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          // Single queue for other algorithms
          <div className="single-queue">
            <AnimatePresence mode="popLayout">
              {processes.length > 0 ? (
                <>
                  {/* Queue visualization with FIFO indicator */}
                  <div className="fifo-indicator">
                    <span className="fifo-end">Back</span>
                    <div className="fifo-line" />
                    <span className="fifo-front">Front → CPU</span>
                  </div>
                  <div className="queue-processes">
                    {processes.map((process, i) => (
                      <motion.div
                        key={process.id}
                        layout
                        className="queue-slot"
                        initial={{ opacity: 0, scale: 0.8, x: -50 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: 50 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                      >
                        <ProcessBlock
                          process={process}
                          compact={true}
                          index={i}
                          onKill={onKillProcess}
                        />
                        {i < processes.length - 1 && (
                          <span className="queue-connector">→</span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : (
                <motion.div 
                  className="empty-queue-message"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span className="empty-icon">—</span>
                  <span>Queue is empty</span>
                  <span className="empty-hint">Add processes to begin</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Educational note based on algorithm */}
      <div className="queue-education">
        {algorithm === 'FCFS' && (
          <p><strong>FCFS:</strong> First process in queue runs next. Watch for the Convoy Effect!</p>
        )}
        {algorithm === 'SJF' && (
          <p><strong>SJF:</strong> Shortest remaining time runs next. May cause starvation!</p>
        )}
        {algorithm === 'SRTF' && (
          <p><strong>SRTF:</strong> Preemptive SJF - can interrupt for shorter jobs.</p>
        )}
        {algorithm === 'RR' && (
          <p><strong>Round Robin:</strong> Each process gets a turn, then moves to back.</p>
        )}
        {algorithm === 'MLFQ' && (
          <p><strong>MLFQ:</strong> Higher queues have priority. Demoted for using full quantum.</p>
        )}
      </div>
    </div>
  );
}

export default ReadyQueue;
