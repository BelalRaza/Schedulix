/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║           MULTI-LEVEL FEEDBACK QUEUE (MLFQ) STRATEGY                      ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║ The most sophisticated and realistic scheduling algorithm.                 ║
 * ║ Used by modern operating systems (Windows, macOS, Linux variants).        ║
 * ║                                                                           ║
 * ║ MLFQ learns from process BEHAVIOR to make scheduling decisions!           ║
 * ║                                                                           ║
 * ║ KEY INSIGHT:                                                              ║
 * ║ ────────────                                                              ║
 * ║ We can't know burst times in advance, but we can OBSERVE behavior:        ║
 * ║ - Processes that USE their full quantum are likely CPU-BOUND              ║
 * ║ - Processes that YIELD early (for I/O) are likely I/O-BOUND               ║
 * ║                                                                           ║
 * ║ CHARACTERISTICS:                                                          ║
 * ║ ────────────────                                                          ║
 * ║ ✓ Adapts to process behavior automatically                               ║
 * ║ ✓ Favors interactive (I/O-bound) processes                               ║
 * ║ ✓ No advance knowledge of burst times needed                             ║
 * ║ ✓ Good response time for interactive tasks                               ║
 * ║ ✗ More complex to implement                                              ║
 * ║ ✗ Can be gamed by malicious processes                                    ║
 * ║ ✗ Requires tuning of many parameters                                     ║
 * ║                                                                           ║
 * ║ ┌─────────────────────────────────────────────────────────────────────┐   ║
 * ║ │                    MLFQ RULES                                       │   ║
 * ║ ├─────────────────────────────────────────────────────────────────────┤   ║
 * ║ │                                                                     │   ║
 * ║ │  RULE 1: If Priority(A) > Priority(B), A runs (B doesn't)          │   ║
 * ║ │                                                                     │   ║
 * ║ │  RULE 2: If Priority(A) = Priority(B), A & B run in Round Robin    │   ║
 * ║ │                                                                     │   ║
 * ║ │  RULE 3: New processes start at TOP priority                       │   ║
 * ║ │                                                                     │   ║
 * ║ │  RULE 4a: If process uses entire quantum, DEMOTE to lower queue    │   ║
 * ║ │           (Penalize CPU-bound behavior)                            │   ║
 * ║ │                                                                     │   ║
 * ║ │  RULE 4b: If process yields before quantum, STAY at same level     │   ║
 * ║ │           (Reward I/O-bound behavior)                              │   ║
 * ║ │                                                                     │   ║
 * ║ │  RULE 5: Periodically BOOST all processes to top queue             │   ║
 * ║ │          (Prevents starvation of CPU-bound processes)              │   ║
 * ║ │                                                                     │   ║
 * ║ └─────────────────────────────────────────────────────────────────────┘   ║
 * ║                                                                           ║
 * ║ QUEUE STRUCTURE:                                                          ║
 * ║ ────────────────                                                          ║
 * ║                                                                           ║
 * ║   QUEUE 0 (Highest Priority) ─ Quantum: 4  ─ Interactive processes       ║
 * ║         │                                                                 ║
 * ║         │ DEMOTE (used full quantum)                                     ║
 * ║         ▼                                                                 ║
 * ║   QUEUE 1 (Medium Priority)  ─ Quantum: 8  ─ Mixed behavior              ║
 * ║         │                                                                 ║
 * ║         │ DEMOTE (used full quantum)                                     ║
 * ║         ▼                                                                 ║
 * ║   QUEUE 2 (Lowest Priority)  ─ Quantum: 16 ─ CPU-bound processes         ║
 * ║                                                                           ║
 * ║   Note: Lower queues have LARGER quantums - if you're CPU-bound,         ║
 * ║   might as well let you run longer per turn (fewer context switches).    ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { SchedulingStrategy } from './SchedulingStrategy';

export class MLFQStrategy extends SchedulingStrategy {
  /**
   * Create MLFQ Strategy
   * 
   * @param {number} numQueues - Number of priority queues (default: 3)
   * @param {number[]} quantums - Time quantum for each queue level
   * @param {number} boostInterval - Time between priority boosts (to prevent starvation)
   */
  constructor(numQueues = 3, quantums = [4, 8, 16], boostInterval = 50) {
    super();
    
    this.name = 'MLFQ';
    this.description = `Multi-Level Feedback Queue: The most sophisticated scheduler. 
Processes start at highest priority. If they use full quantum, they're DEMOTED (CPU-bound penalty). 
If they yield for I/O, they may be PROMOTED (I/O-bound reward). 
Watch processes move between the 3 priority queues based on their behavior!`;
    
    // MLFQ is PREEMPTIVE
    this.isPreemptive = true;
    
    // Number of priority levels
    this.numQueues = numQueues;
    
    /**
     * TIME QUANTUM PER LEVEL
     * ──────────────────────
     * Higher priority queues get SMALLER quantums:
     * - Quick response for interactive processes
     * - They don't need long bursts anyway
     * 
     * Lower priority queues get LARGER quantums:
     * - CPU-bound processes can make progress
     * - Fewer context switches for long computations
     */
    this.quantums = quantums;
    
    // Default time quantum (will be overridden based on queue level)
    this.timeQuantum = quantums[0];
    
    /**
     * PRIORITY BOOST INTERVAL
     * ───────────────────────
     * Periodically boost all processes to top queue.
     * This prevents STARVATION of CPU-bound processes.
     * 
     * Without this, a CPU-bound process could be stuck in the
     * lowest queue forever if interactive processes keep arriving.
     */
    this.boostInterval = boostInterval;
    this.timeSinceLastBoost = 0;
  }
  
  /**
   * Initialize a new process - assign to highest priority queue
   * 
   * MLFQ RULE 3: New processes enter at top priority
   * This gives new processes a chance to show they're interactive.
   * 
   * @param {Process} process - Newly admitted process
   */
  onProcessAdmit(process) {
    process.queueLevel = 0; // Start at highest priority
    process.quantumUsed = 0; // Reset quantum tracking
  }
  
  /**
   * Update time quantums for each queue level at runtime
   * Allows users to customize quantum values per priority queue.
   * 
   * @param {number[]} quantums - New time quantum values for each queue level
   */
  setQuantums(quantums) {
    if (Array.isArray(quantums) && quantums.length === this.numQueues) {
      this.quantums = quantums.map(q => Math.max(1, Math.floor(q)));
      this.timeQuantum = this.quantums[0];
    }
  }

  /**
   * Get time quantum for a process based on its queue level
   * 
   * @param {Process} process - The process
   * @returns {number} - Time quantum for this process
   */
  getQuantum(process) {
    const level = process.queueLevel || 0;
    return this.quantums[Math.min(level, this.quantums.length - 1)];
  }
  
  /**
   * Select next process using MLFQ rules
   * 
   * @param {Process[]} readyQueue - All waiting processes
   * @param {number} currentTime - Current simulation time
   * @returns {Process|null} - Highest priority process to run
   */
  selectNext(readyQueue, currentTime) {
    if (readyQueue.length === 0) {
      return null;
    }
    
    /**
     * MLFQ SELECTION ALGORITHM:
     * ─────────────────────────
     * 1. Check each queue from highest priority (0) to lowest
     * 2. Return first process found in non-empty queue
     * 3. Within same queue, use Round Robin (FIFO)
     * 
     * RULE 1 & 2 in action:
     * - Higher priority always runs first (Rule 1)
     * - Same priority uses Round Robin (Rule 2)
     */
    
    // Group processes by queue level
    const queues = Array.from({ length: this.numQueues }, () => []);
    
    for (const process of readyQueue) {
      const level = Math.min(process.queueLevel || 0, this.numQueues - 1);
      queues[level].push(process);
    }
    
    // Find highest priority non-empty queue
    for (let level = 0; level < this.numQueues; level++) {
      if (queues[level].length > 0) {
        // Within queue, sort by arrival time (FIFO for Round Robin)
        queues[level].sort((a, b) => a.arrivalTime - b.arrivalTime);
        
        // Update timeQuantum to match selected process's queue
        this.timeQuantum = this.quantums[level];
        
        return queues[level][0];
      }
    }
    
    return null;
  }
  
  /**
   * Check if running process should be preempted
   * 
   * Preempt if:
   * 1. Quantum expired for current queue level
   * 2. Higher priority process arrived
   * 
   * @param {Process} runningProcess - Currently running process
   * @param {Process[]} readyQueue - Processes waiting for CPU
   * @param {number} quantumRemaining - Time remaining in current quantum
   * @returns {boolean} - True if should preempt
   */
  shouldPreempt(runningProcess, readyQueue, quantumRemaining) {
    // Check if quantum expired (Rule 4a trigger)
    if (quantumRemaining <= 0) {
      return true;
    }
    
    // Check if higher priority process is waiting (Rule 1)
    const runningLevel = runningProcess.queueLevel || 0;
    const higherPriorityWaiting = readyQueue.some(p => 
      (p.queueLevel || 0) < runningLevel
    );
    
    /**
     * PREEMPTION FOR HIGHER PRIORITY:
     * ────────────────────────────────
     * If a process in a higher priority queue is waiting,
     * preempt the current process to run it.
     * 
     * This ensures interactive processes get quick response time.
     */
    return higherPriorityWaiting;
  }
  
  /**
   * Perform periodic priority boost (Rule 5)
   * 
   * @param {Process[]} allProcesses - All processes in system
   */
  performBoost(allProcesses) {
    this.timeSinceLastBoost = 0;
    
    for (const process of allProcesses) {
      process.queueLevel = 0;
      process.quantumUsed = 0;
    }
  }
  
  /**
   * Check if boost is due
   * 
   * @returns {boolean} - True if boost should happen
   */
  isBoostDue() {
    return this.timeSinceLastBoost >= this.boostInterval;
  }
  
  /**
   * Update time tracking for boost
   * 
   * @param {number} elapsed - Time elapsed
   */
  updateTime(elapsed) {
    this.timeSinceLastBoost += elapsed;
  }
  
  /**
   * Get visual representation of queue structure for UI
   * 
   * @param {Process[]} readyQueue - All waiting processes
   * @returns {Object[]} - Queue structure with processes
   */
  getQueueStructure(readyQueue) {
    const structure = [];
    
    for (let level = 0; level < this.numQueues; level++) {
      const processesInQueue = readyQueue.filter(p => 
        (p.queueLevel || 0) === level
      );
      
      structure.push({
        level,
        quantum: this.quantums[level],
        priority: level === 0 ? 'Highest' : level === this.numQueues - 1 ? 'Lowest' : 'Medium',
        processes: processesInQueue.map(p => p.toSnapshot()),
        label: `Queue ${level} (Q=${this.quantums[level]})`
      });
    }
    
    return structure;
  }
}

export default MLFQStrategy;
