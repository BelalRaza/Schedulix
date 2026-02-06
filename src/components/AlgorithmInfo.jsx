/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                      ALGORITHM INFO COMPONENT                             ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║ Displays educational information about the currently selected algorithm.  ║
 * ║ Helps users understand the theory behind each scheduling approach.        ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Algorithm information database
 */
const algorithmInfo = {
  FCFS: {
    title: 'First-Come, First-Served',
    icon: '🚶‍♂️',
    type: 'Non-Preemptive',
    description: 'The simplest scheduling algorithm. Processes are executed in the order they arrive, like a queue at a store.',
    pros: [
      'Simple to understand and implement',
      'No starvation - every process eventually runs',
      'Minimal overhead (no preemption)'
    ],
    cons: [
      'Convoy Effect - short processes wait behind long ones',
      'Poor average waiting time',
      'Not suitable for interactive systems'
    ],
    bestFor: 'Batch processing systems with similar job sizes',
    concept: 'CONVOY EFFECT',
    conceptExplanation: 'When a long CPU-bound process holds the CPU, all shorter processes must wait, dramatically increasing average waiting time. Like being stuck behind a slow truck on a single-lane road.'
  },
  SJF: {
    title: 'Shortest Job First',
    icon: '📏',
    type: 'Non-Preemptive',
    description: 'Selects the process with the smallest burst time. Provably optimal for minimizing average waiting time.',
    pros: [
      'Optimal average waiting time',
      'Good throughput',
      'Works well when burst times are known'
    ],
    cons: [
      'Requires knowing burst time in advance',
      'Can cause starvation of long processes',
      'Not practical for interactive systems'
    ],
    bestFor: 'Batch systems where job times are predictable',
    concept: 'STARVATION',
    conceptExplanation: 'Long processes may wait indefinitely if short processes keep arriving. The long job is perpetually "starved" of CPU time. Solution: Aging - gradually increase priority of waiting processes.'
  },
  SRTF: {
    title: 'Shortest Remaining Time First',
    icon: '⏱️',
    type: 'Preemptive',
    description: 'Preemptive version of SJF. If a new process arrives with shorter remaining time, it preempts the running process.',
    pros: [
      'Even better average waiting time than SJF',
      'Responsive to new short jobs'
    ],
    cons: [
      'Higher overhead due to preemption',
      'Starvation still possible',
      'Still requires knowing burst times'
    ],
    bestFor: 'Systems with varied job sizes where responsiveness matters',
    concept: 'PREEMPTION',
    conceptExplanation: 'The OS can forcibly remove a running process from the CPU to give it to another process. Required for responsive time-sharing systems.'
  },
  RR: {
    title: 'Round Robin',
    icon: '🔄',
    type: 'Preemptive',
    description: 'Each process gets a fixed time slice (quantum). When it expires, the process moves to the back of the queue.',
    pros: [
      'Fair - every process gets equal CPU time',
      'No starvation',
      'Good for interactive systems',
      'Creates the "illusion of parallelism"'
    ],
    cons: [
      'Performance depends on quantum size',
      'Higher overhead with small quantum',
      'Higher average waiting time than SJF'
    ],
    bestFor: 'Time-sharing systems, interactive applications',
    concept: 'TIME QUANTUM',
    conceptExplanation: 'The fixed time slice each process receives. Too small = excessive context switching overhead. Too large = degrades to FCFS. Sweet spot: 80% of CPU bursts should complete within one quantum.'
  },
  MLFQ: {
    title: 'Multi-Level Feedback Queue',
    icon: '📊',
    type: 'Preemptive',
    description: 'Uses multiple priority queues. Processes move between queues based on their behavior - adapting to workload automatically.',
    pros: [
      'Adapts to process behavior',
      'Favors interactive (I/O-bound) processes',
      'No advance knowledge needed',
      'Balances responsiveness and throughput'
    ],
    cons: [
      'Complex to implement and tune',
      'Can be gamed by malicious processes',
      'Many parameters to configure'
    ],
    bestFor: 'General-purpose operating systems (Windows, Linux, macOS)',
    concept: 'FEEDBACK',
    conceptExplanation: 'The scheduler observes process behavior and adjusts priority accordingly. Use full quantum? Demoted (CPU-bound). Yield for I/O? Stay high or promote (I/O-bound). This creates automatic adaptation.'
  }
};

/**
 * AlgorithmInfo Component
 * 
 * @param {Object} props
 * @param {string} props.algorithm - Currently selected algorithm ID
 * @param {Object} props.strategy - Strategy object with runtime info
 */
function AlgorithmInfo({ algorithm, strategy }) {
  const info = algorithmInfo[algorithm];
  
  if (!info) return null;
  
  return (
    <div className="algorithm-info">
      <AnimatePresence mode="wait">
        <motion.div
          key={algorithm}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="info-header">
            <span className="info-icon">{info.icon}</span>
            <div>
              <h3>{info.title}</h3>
              <span className={`type-badge ${info.type.toLowerCase().replace('-', '')}`}>
                {info.type}
              </span>
            </div>
          </div>
          
          <p className="info-description">{info.description}</p>
          
          <div className="info-lists">
            <div className="info-section pros">
              <h4>✓ Advantages</h4>
              <ul>
                {info.pros.map((pro, i) => (
                  <li key={i}>{pro}</li>
                ))}
              </ul>
            </div>
            
            <div className="info-section cons">
              <h4>✗ Disadvantages</h4>
              <ul>
                {info.cons.map((con, i) => (
                  <li key={i}>{con}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="info-best-for">
            <strong>Best For:</strong> {info.bestFor}
          </div>
          
          <div className="concept-highlight">
            <h4>
              <span className="concept-icon">💡</span>
              Key Concept: {info.concept}
            </h4>
            <p>{info.conceptExplanation}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default AlgorithmInfo;
