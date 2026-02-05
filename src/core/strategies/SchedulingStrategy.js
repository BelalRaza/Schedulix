/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    SCHEDULING STRATEGY (Abstract Base)                     ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║ This is the STRATEGY interface in the Strategy Design Pattern.            ║
 * ║                                                                           ║
 * ║ STRATEGY PATTERN BENEFITS:                                                ║
 * ║ ─────────────────────────                                                 ║
 * ║ 1. ENCAPSULATION: Each algorithm is encapsulated in its own class        ║
 * ║ 2. FLEXIBILITY: Algorithms can be swapped at runtime                      ║
 * ║ 3. EXTENSIBILITY: New algorithms can be added without modifying existing ║
 * ║ 4. TESTABILITY: Each algorithm can be tested independently               ║
 * ║                                                                           ║
 * ║ In real operating systems, the scheduler is often not easily swappable,  ║
 * ║ but Linux does support different scheduling policies (SCHED_FIFO,         ║
 * ║ SCHED_RR, SCHED_OTHER) that can be selected per-process.                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Base class for all scheduling strategies
 * 
 * Each concrete strategy must implement:
 * - selectNext(): Choose the next process to run
 * - shouldPreempt(): Determine if running process should be preempted
 */
export class SchedulingStrategy {
  constructor() {
    // Display name of the algorithm
    this.name = 'Unknown Strategy';
    
    // Educational description explaining the algorithm
    this.description = '';
    
    // Time quantum for preemptive algorithms (null for non-preemptive)
    this.timeQuantum = null;
    
    // Is this algorithm preemptive?
    this.isPreemptive = false;
  }
  
  /**
   * Select the next process to run from the ready queue
   * 
   * This is the core of the scheduling algorithm - different strategies
   * implement this differently based on their scheduling policy.
   * 
   * @param {Process[]} readyQueue - Processes waiting for CPU
   * @param {number} currentTime - Current simulation time
   * @returns {Process|null} - The next process to run, or null if queue is empty
   */
  selectNext(readyQueue, currentTime) {
    throw new Error('selectNext() must be implemented by concrete strategy');
  }
  
  /**
   * Determine if the currently running process should be preempted
   * 
   * @param {Process} runningProcess - Currently running process
   * @param {Process[]} readyQueue - Processes waiting for CPU
   * @param {number} quantumRemaining - Time remaining in current quantum
   * @returns {boolean} - True if process should be preempted
   */
  shouldPreempt(runningProcess, readyQueue, quantumRemaining) {
    // Default: no preemption for non-preemptive algorithms
    return false;
  }
  
  /**
   * Called when a new process is admitted to the system
   * Useful for MLFQ to initialize queue assignment
   * 
   * @param {Process} process - Newly admitted process
   */
  onProcessAdmit(process) {
    // Default: do nothing
  }
  
  /**
   * Get the current time quantum (for Round Robin and MLFQ)
   * 
   * @param {Process} process - The process being scheduled
   * @returns {number} - Time quantum for this process
   */
  getQuantum(process) {
    return this.timeQuantum || Infinity;
  }
  
  /**
   * Get educational information about this algorithm
   */
  getInfo() {
    return {
      name: this.name,
      description: this.description,
      isPreemptive: this.isPreemptive,
      timeQuantum: this.timeQuantum
    };
  }
}

export default SchedulingStrategy;
