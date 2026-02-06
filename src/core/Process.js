/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                           PROCESS CLASS                                    ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║ The Process is the fundamental unit of work in an operating system.       ║
 * ║                                                                           ║
 * ║ In real OS terms, a process is a program in execution. It contains:       ║
 * ║   - Program code (text section)                                           ║
 * ║   - Current activity (program counter, registers)                         ║
 * ║   - Stack (temporary data like function parameters, return addresses)     ║
 * ║   - Data section (global variables)                                       ║
 * ║   - Heap (dynamically allocated memory)                                   ║
 * ║                                                                           ║
 * ║ For our visualizer, we abstract this to focus on scheduling attributes.   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Process States Enumeration
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    PROCESS STATE DIAGRAM                        │
 * │                                                                 │
 * │   ┌─────────┐      admitted       ┌─────────┐                  │
 * │   │   NEW   │ ─────────────────▶  │  READY  │ ◀──────────┐     │
 * │   └─────────┘                     └────┬────┘            │     │
 * │                                        │                 │     │
 * │                              scheduler │                 │     │
 * │                               dispatch │          I/O or │     │
 * │                                        ▼          event  │     │
 * │                                   ┌─────────┐   complete │     │
 * │                                   │ RUNNING │            │     │
 * │                                   └────┬────┘            │     │
 * │                                        │                 │     │
 * │                    ┌───────────────────┼───────────────┐ │     │
 * │                    │                   │               │ │     │
 * │                    ▼                   ▼               ▼ │     │
 * │             ┌───────────┐      ┌─────────────┐   ┌─────────┐   │
 * │             │TERMINATED │      │ I/O or event│   │interrupt│   │
 * │             └───────────┘      │    wait     │   │(preempt)│   │
 * │                                └──────┬──────┘   └────┬────┘   │
 * │                                       │               │        │
 * │                                       ▼               │        │
 * │                                ┌───────────┐          │        │
 * │                                │  WAITING  │──────────┘        │
 * │                                └───────────┘                   │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * KEY CONCEPT: Preemption
 * ─────────────────────────
 * Preemption is the act of temporarily interrupting an executing process,
 * without its cooperation, with the intent of resuming it later.
 * 
 * - Non-preemptive scheduling: Once a process starts running, it continues
 *   until it voluntarily releases the CPU (by terminating or blocking for I/O).
 *   Example: FCFS, Non-preemptive SJF
 * 
 * - Preemptive scheduling: The OS can forcibly remove a running process from
 *   the CPU, typically when a time quantum expires or a higher-priority
 *   process arrives.
 *   Example: Round Robin, MLFQ, Preemptive SJF
 */
export const ProcessState = {
  NEW: 'NEW',           // Process has been created but not yet admitted to ready queue
  READY: 'READY',       // Process is waiting in queue to be assigned to CPU
  RUNNING: 'RUNNING',   // Process is currently being executed by CPU
  WAITING: 'WAITING',   // Process is waiting for I/O or an event (blocked state)
  TERMINATED: 'TERMINATED' // Process has finished execution
};

/**
 * Process Class
 * 
 * Represents a process in our CPU scheduling simulation.
 * Each process has attributes that determine how it's scheduled.
 */
export class Process {
  /**
   * Creates a new Process instance
   * 
   * @param {Object} config - Process configuration
   * @param {string} config.name - Human-readable process name (e.g., "P1", "Browser")
   * @param {number} config.arrivalTime - Time at which process enters the system
   * @param {number} config.burstTime - Total CPU time required to complete
   * @param {number} config.priority - Priority level (lower number = higher priority in most systems)
   * @param {number} config.ioFrequency - How often process requests I/O (0 = never)
   */
  constructor({ name, arrivalTime = 0, burstTime, priority = 5, ioFrequency = 0 }) {
    // Unique identifier for the process (simulates Process ID in real OS)
    this.id = uuidv4();
    
    // Human-readable name for display purposes
    this.name = name;
    
    /**
     * ARRIVAL TIME
     * ─────────────
     * The time at which the process enters the ready queue.
     * In real systems, this is when a program is launched or a new task is created.
     * 
     * This is crucial for:
     * - FCFS: Determines order of execution
     * - SJF: Used with burst time to calculate optimal scheduling
     * - All algorithms: Calculating waiting time and turnaround time
     */
    this.arrivalTime = arrivalTime;
    
    /**
     * BURST TIME (CPU Burst)
     * ──────────────────────
     * The total amount of CPU time the process needs to complete.
     * 
     * In reality, this is unknown - the OS uses various prediction techniques:
     * - Exponential averaging of previous CPU bursts
     * - Static analysis of program code
     * - User hints/declarations
     * 
     * For our visualizer, we specify it upfront for educational clarity.
     */
    this.burstTime = burstTime;
    
    // Remaining burst time (decreases as process executes)
    this.remainingTime = burstTime;
    
    /**
     * PRIORITY
     * ────────
     * A value indicating the process's importance.
     * 
     * Priority can be:
     * - Statically assigned (based on process type, user, etc.)
     * - Dynamically calculated (based on waiting time, CPU usage, etc.)
     * 
     * CAUTION: Priority scheduling can lead to STARVATION
     * ──────────────────────────────────────────────────────
     * Starvation occurs when a low-priority process waits indefinitely
     * because higher-priority processes keep arriving.
     * 
     * Solution: AGING - gradually increasing priority of waiting processes
     */
    this.priority = priority;
    
    // Current queue level for MLFQ (0 = highest priority queue)
    this.queueLevel = 0;
    
    // Current state of the process
    this.state = ProcessState.NEW;
    
    // How often process requests I/O (0 = CPU-bound, higher = I/O-bound)
    this.ioFrequency = ioFrequency;
    
    // Tracking I/O operations
    this.ioRemaining = 0; // Time remaining in I/O operation
    
    /**
     * METRICS FOR ANALYSIS
     * ────────────────────
     * These help us calculate important scheduling metrics:
     */
    
    // Time when process first started executing
    this.startTime = null;
    
    // Time when process completed execution
    this.completionTime = null;
    
    // Total time spent waiting in ready queue
    // WAITING TIME = Turnaround Time - Burst Time
    this.waitingTime = 0;
    
    // Time spent in current wait (reset each time process enters ready queue)
    this.currentWaitStart = null;
    
    /**
     * TURNAROUND TIME
     * ───────────────
     * Total time from arrival to completion.
     * Turnaround Time = Completion Time - Arrival Time
     * 
     * This includes:
     * - Waiting time in ready queue
     * - Execution time
     * - Time spent blocked for I/O
     */
    this.turnaroundTime = null;
    
    /**
     * RESPONSE TIME
     * ─────────────
     * Time from arrival to first execution.
     * Response Time = First Execution Time - Arrival Time
     * 
     * Important for interactive systems where users expect quick feedback.
     */
    this.responseTime = null;
    
    // Visual properties
    this.color = this.generateColor();
    
    // Time quantum used in current queue (for MLFQ tracking)
    this.quantumUsed = 0;
  }
  
  /**
   * Generate a unique color for this process
   * Uses HSL to ensure good saturation and visibility
   */
  generateColor() {
    // Generate a hue based on the process name for consistency
    const hash = this.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = (hash * 137) % 360; // Golden ratio distribution
    return `hsl(${hue}, 70%, 55%)`;
  }
  
  /**
   * Transition process to a new state
   * Validates state transitions according to process lifecycle
   * 
   * @param {string} newState - The target state
   * @param {number} currentTime - Current simulation time
   */
  setState(newState, currentTime) {
    const oldState = this.state;
    
    // Validate state transition
    const validTransitions = {
      [ProcessState.NEW]: [ProcessState.READY],
      [ProcessState.READY]: [ProcessState.RUNNING, ProcessState.TERMINATED],
      [ProcessState.RUNNING]: [ProcessState.READY, ProcessState.WAITING, ProcessState.TERMINATED],
      [ProcessState.WAITING]: [ProcessState.READY],
      [ProcessState.TERMINATED]: [] // Terminal state - no transitions out
    };
    
    if (!validTransitions[oldState].includes(newState)) {
      console.warn(`Invalid state transition: ${oldState} -> ${newState}`);
      return false;
    }
    
    // Handle state-specific logic
    switch (newState) {
      case ProcessState.READY:
        // Process entering ready queue - start tracking wait time
        this.currentWaitStart = currentTime;
        this.quantumUsed = 0; // Reset quantum tracking
        break;
        
      case ProcessState.RUNNING:
        // Process starting/resuming execution
        if (this.currentWaitStart !== null) {
          this.waitingTime += currentTime - this.currentWaitStart;
          this.currentWaitStart = null;
        }
        if (this.startTime === null) {
          // First time running - record start time and response time
          this.startTime = currentTime;
          this.responseTime = currentTime - this.arrivalTime;
        }
        break;
        
      case ProcessState.WAITING:
        // Process blocked for I/O
        // Note: This doesn't count as waiting time (process chose to wait)
        break;
        
      case ProcessState.TERMINATED:
        // Process completed - calculate final metrics
        this.completionTime = currentTime;
        this.turnaroundTime = this.completionTime - this.arrivalTime;
        this.remainingTime = 0;
        break;
        
      default:
        break;
    }
    
    this.state = newState;
    return true;
  }
  
  /**
   * Execute the process for a given time slice
   * 
   * @param {number} timeSlice - Duration to execute
   * @returns {Object} - Execution result with actual time used and completion status
   */
  execute(timeSlice) {
    const actualTime = Math.min(timeSlice, this.remainingTime);
    this.remainingTime -= actualTime;
    this.quantumUsed += actualTime;
    
    return {
      timeUsed: actualTime,
      completed: this.remainingTime === 0,
      // Check if process should do I/O (random based on ioFrequency)
      requestsIO: this.ioFrequency > 0 && Math.random() < this.ioFrequency && this.remainingTime > 0
    };
  }
  
  /**
   * Start an I/O operation
   * 
   * @param {number} ioDuration - How long the I/O takes
   */
  startIO(ioDuration) {
    this.ioRemaining = ioDuration;
  }
  
  /**
   * Process I/O completion
   * 
   * @param {number} elapsed - Time elapsed
   * @returns {boolean} - True if I/O is complete
   */
  processIO(elapsed) {
    this.ioRemaining = Math.max(0, this.ioRemaining - elapsed);
    return this.ioRemaining === 0;
  }
  
  /**
   * Demote process to lower priority queue (for MLFQ)
   * 
   * MLFQ RULE: If a process uses its entire time quantum,
   * it is demoted to a lower priority queue (penalized for CPU-bound behavior)
   */
  demote(maxQueueLevel) {
    if (this.queueLevel < maxQueueLevel) {
      this.queueLevel++;
      this.quantumUsed = 0;
    }
  }
  
  /**
   * Promote process to higher priority queue (for MLFQ)
   * 
   * MLFQ RULE: If a process voluntarily yields the CPU (e.g., for I/O),
   * it may be promoted to a higher priority queue (rewarded for I/O-bound behavior)
   */
  promote() {
    if (this.queueLevel > 0) {
      this.queueLevel--;
      this.quantumUsed = 0;
    }
  }
  
  /**
   * Reset process for re-running simulations
   */
  reset() {
    this.remainingTime = this.burstTime;
    this.state = ProcessState.NEW;
    this.queueLevel = 0;
    this.startTime = null;
    this.completionTime = null;
    this.waitingTime = 0;
    this.currentWaitStart = null;
    this.turnaroundTime = null;
    this.responseTime = null;
    this.ioRemaining = 0;
    this.quantumUsed = 0;
  }
  
  /**
   * Create a snapshot of process state for visualization
   */
  toSnapshot() {
    return {
      id: this.id,
      name: this.name,
      state: this.state,
      arrivalTime: this.arrivalTime,
      burstTime: this.burstTime,
      remainingTime: this.remainingTime,
      priority: this.priority,
      queueLevel: this.queueLevel,
      waitingTime: this.waitingTime,
      color: this.color,
      progress: ((this.burstTime - this.remainingTime) / this.burstTime) * 100
    };
  }
}

export default Process;
