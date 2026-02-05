/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                          SCHEDULER CLASS                                   ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║ The Scheduler is the HEART of the operating system.                       ║
 * ║                                                                           ║
 * ║ It implements the STRATEGY DESIGN PATTERN, allowing different scheduling  ║
 * ║ algorithms to be plugged in dynamically without changing the core logic.  ║
 * ║                                                                           ║
 * ║ THE ILLUSION OF PARALLELISM                                               ║
 * ║ ─────────────────────────────                                             ║
 * ║ A single CPU can only execute ONE instruction at a time. Yet, users       ║
 * ║ perceive multiple programs running simultaneously. This "illusion" is     ║
 * ║ achieved through:                                                         ║
 * ║                                                                           ║
 * ║ 1. RAPID CONTEXT SWITCHING - The CPU switches between processes so fast   ║
 * ║    (thousands of times per second) that humans perceive simultaneity.     ║
 * ║                                                                           ║
 * ║ 2. TIME SLICING - Each process gets a small "slice" of CPU time before    ║
 * ║    the OS preempts it and gives another process a turn.                   ║
 * ║                                                                           ║
 * ║ 3. SMART SCHEDULING - The OS decides WHICH process runs next and for      ║
 * ║    HOW LONG, optimizing for various goals (fairness, throughput, etc.)    ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { ProcessState } from './Process';

/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                     SCHEDULING GOALS & TRADE-OFFS                           │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │                                                                             │
 * │  Different environments have different optimization goals:                  │
 * │                                                                             │
 * │  BATCH SYSTEMS (no human waiting):                                         │
 * │  ├─ Maximize THROUGHPUT (jobs completed per unit time)                     │
 * │  ├─ Minimize TURNAROUND TIME (arrival to completion)                       │
 * │  └─ Maximize CPU UTILIZATION (keep CPU busy)                               │
 * │                                                                             │
 * │  INTERACTIVE SYSTEMS (humans waiting):                                      │
 * │  ├─ Minimize RESPONSE TIME (time to first output)                          │
 * │  └─ Ensure FAIRNESS (no process starves)                                   │
 * │                                                                             │
 * │  REAL-TIME SYSTEMS (deadlines matter):                                      │
 * │  └─ Meet DEADLINES (absolute requirement)                                  │
 * │                                                                             │
 * │  ⚠️  These goals CONFLICT! Optimizing one often hurts another.             │
 * │      Example: High throughput may cause poor response time.                │
 * │                                                                             │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

/**
 * Scheduler Class (Context in Strategy Pattern)
 * 
 * Manages process scheduling and CPU time allocation.
 * The actual scheduling logic is delegated to a Strategy object.
 */
export class Scheduler {
  /**
   * Create a new Scheduler
   * 
   * @param {SchedulingStrategy} strategy - The scheduling algorithm to use
   */
  constructor(strategy = null) {
    // The currently selected scheduling strategy
    this.strategy = strategy;
    
    // All processes in the system
    this.processes = [];
    
    // Ready queue - processes waiting for CPU
    this.readyQueue = [];
    
    // Waiting queue - processes blocked for I/O
    this.waitingQueue = [];
    
    // Currently running process (only ONE in single-core simulation)
    this.runningProcess = null;
    
    // Completed processes
    this.completedProcesses = [];
    
    // Current simulation time (in arbitrary time units)
    this.currentTime = 0;
    
    // Is simulation currently running?
    this.isRunning = false;
    
    /**
     * CONTEXT SWITCH OVERHEAD
     * ───────────────────────
     * In real systems, context switching has a COST:
     * 
     * 1. Save state of current process (registers, program counter, etc.)
     * 2. Update PCB (Process Control Block) of current process
     * 3. Move PCB to appropriate queue
     * 4. Select next process (scheduling algorithm runs)
     * 5. Update PCB of new process
     * 6. Restore state of new process
     * 7. Flush TLB (Translation Lookaside Buffer) - very expensive!
     * 8. Potentially reload cache lines - even more expensive!
     * 
     * This typically takes 1-1000 microseconds depending on hardware.
     * We simulate this with a configurable overhead value.
     */
    this.contextSwitchOverhead = 1; // Time units
    
    // Is context switch currently happening?
    this.isContextSwitching = false;
    
    // Gantt chart data for visualization
    this.ganttChart = [];
    
    // Metrics tracking
    this.metrics = {
      totalIdleTime: 0,
      totalContextSwitches: 0,
      processesCompleted: 0
    };
    
    // Callbacks for UI updates
    this.onStateChange = null;
    this.onContextSwitch = null;
    this.onProcessComplete = null;
    
    // Time quantum remaining (for Round Robin)
    this.quantumRemaining = 0;
  }
  
  /**
   * Set the scheduling strategy (algorithm)
   * 
   * This is the key to the Strategy Pattern - we can swap algorithms
   * at runtime without changing any of the Scheduler's core logic.
   * 
   * @param {SchedulingStrategy} strategy - The new scheduling strategy
   */
  setStrategy(strategy) {
    this.strategy = strategy;
    // Reset quantum when changing strategies
    if (strategy && strategy.timeQuantum) {
      this.quantumRemaining = strategy.timeQuantum;
    }
  }
  
  /**
   * Add a process to the system
   * 
   * @param {Process} process - The process to add
   */
  addProcess(process) {
    this.processes.push(process);
    
    // If process has already arrived, add to ready queue
    if (process.arrivalTime <= this.currentTime) {
      this.admitProcess(process);
    }
  }
  
  /**
   * Admit a process to the ready queue
   * 
   * @param {Process} process - Process to admit
   */
  admitProcess(process) {
    if (process.state === ProcessState.NEW) {
      process.setState(ProcessState.READY, this.currentTime);
      this.readyQueue.push(process);
      
      // Let strategy know about new process (for MLFQ queue assignment)
      if (this.strategy && this.strategy.onProcessAdmit) {
        this.strategy.onProcessAdmit(process);
      }
    }
  }
  
  /**
   * Remove a process from the system (kill)
   * 
   * @param {string} processId - ID of process to kill
   */
  killProcess(processId) {
    // Find and remove from all queues
    this.readyQueue = this.readyQueue.filter(p => p.id !== processId);
    this.waitingQueue = this.waitingQueue.filter(p => p.id !== processId);
    
    if (this.runningProcess && this.runningProcess.id === processId) {
      this.runningProcess.setState(ProcessState.TERMINATED, this.currentTime);
      this.runningProcess = null;
    }
    
    // Find in processes array and terminate
    const process = this.processes.find(p => p.id === processId);
    if (process && process.state !== ProcessState.TERMINATED) {
      process.setState(ProcessState.TERMINATED, this.currentTime);
      this.completedProcesses.push(process);
    }
    
    this.notifyStateChange();
  }
  
  /**
   * Inject an I/O interrupt to the running process
   * 
   * This simulates a process requesting I/O (disk read, network, etc.)
   * The process moves to WAITING state and another process can run.
   * 
   * @param {number} ioDuration - How long the I/O takes
   */
  injectIOInterrupt(ioDuration = 5) {
    if (this.runningProcess) {
      const process = this.runningProcess;
      process.setState(ProcessState.WAITING, this.currentTime);
      process.startIO(ioDuration);
      
      // In MLFQ, yielding for I/O is rewarded with promotion
      if (this.strategy && this.strategy.name === 'MLFQ') {
        process.promote();
      }
      
      this.waitingQueue.push(process);
      this.runningProcess = null;
      
      this.notifyStateChange();
    }
  }
  
  /**
   * Perform a context switch
   * 
   * @param {Process} nextProcess - The process to switch to
   * @returns {Promise} - Resolves when context switch is complete
   */
  async performContextSwitch(nextProcess) {
    this.isContextSwitching = true;
    this.metrics.totalContextSwitches++;
    
    // Notify UI about context switch starting
    if (this.onContextSwitch) {
      this.onContextSwitch({
        from: this.runningProcess ? this.runningProcess.toSnapshot() : null,
        to: nextProcess.toSnapshot(),
        overhead: this.contextSwitchOverhead
      });
    }
    
    // Record context switch in Gantt chart
    this.ganttChart.push({
      type: 'context_switch',
      startTime: this.currentTime,
      endTime: this.currentTime + this.contextSwitchOverhead
    });
    
    // Simulate context switch delay
    await this.delay(this.contextSwitchOverhead * 100); // Visual delay
    
    this.currentTime += this.contextSwitchOverhead;
    this.isContextSwitching = false;
    
    return true;
  }
  
  /**
   * Execute one simulation step
   * 
   * This is the main scheduling loop iteration.
   * 
   * @returns {Object} - Step result with state information
   */
  async step() {
    if (!this.strategy) {
      throw new Error('No scheduling strategy set!');
    }
    
    // 1. Check for newly arriving processes
    this.checkArrivals();
    
    // 2. Check for I/O completions
    this.checkIOCompletions();
    
    // 3. If nothing is running, select next process
    if (!this.runningProcess && this.readyQueue.length > 0) {
      const nextProcess = this.strategy.selectNext(this.readyQueue, this.currentTime);
      
      if (nextProcess) {
        // Remove from ready queue
        this.readyQueue = this.readyQueue.filter(p => p.id !== nextProcess.id);
        
        // Perform context switch
        await this.performContextSwitch(nextProcess);
        
        // Start running the process
        this.runningProcess = nextProcess;
        nextProcess.setState(ProcessState.RUNNING, this.currentTime);
        
        // Reset quantum for this process
        this.quantumRemaining = this.strategy.timeQuantum || Infinity;
      }
    }
    
    // 4. Execute running process for one time unit
    if (this.runningProcess) {
      const result = this.runningProcess.execute(1);
      
      // Record in Gantt chart
      this.ganttChart.push({
        type: 'execution',
        processId: this.runningProcess.id,
        processName: this.runningProcess.name,
        color: this.runningProcess.color,
        startTime: this.currentTime,
        endTime: this.currentTime + 1
      });
      
      this.currentTime += 1;
      this.quantumRemaining -= 1;
      
      // Check if process completed
      if (result.completed) {
        this.runningProcess.setState(ProcessState.TERMINATED, this.currentTime);
        this.completedProcesses.push(this.runningProcess);
        this.metrics.processesCompleted++;
        
        if (this.onProcessComplete) {
          this.onProcessComplete(this.runningProcess.toSnapshot());
        }
        
        this.runningProcess = null;
      }
      // Check if process requests I/O
      else if (result.requestsIO) {
        this.injectIOInterrupt(3 + Math.floor(Math.random() * 5));
      }
      // Check for preemption (quantum expired or higher priority arrived)
      else if (this.strategy.shouldPreempt(this.runningProcess, this.readyQueue, this.quantumRemaining)) {
        // Handle preemption based on strategy
        this.handlePreemption();
      }
    } else {
      // CPU is idle
      this.metrics.totalIdleTime++;
      this.ganttChart.push({
        type: 'idle',
        startTime: this.currentTime,
        endTime: this.currentTime + 1
      });
      this.currentTime += 1;
    }
    
    this.notifyStateChange();
    
    return this.getState();
  }
  
  /**
   * Handle preemption of running process
   * 
   * PREEMPTION SCENARIOS:
   * ─────────────────────
   * 1. Time quantum expired (Round Robin)
   * 2. Higher priority process arrived (Priority Scheduling)
   * 3. Shorter job arrived (Preemptive SJF)
   */
  handlePreemption() {
    if (!this.runningProcess) return;
    
    const process = this.runningProcess;
    
    // In MLFQ, using full quantum = demotion
    if (this.strategy.name === 'MLFQ' && this.quantumRemaining <= 0) {
      process.demote(2); // Max 3 queues (0, 1, 2)
    }
    
    // Move back to ready queue
    process.setState(ProcessState.READY, this.currentTime);
    this.readyQueue.push(process);
    this.runningProcess = null;
  }
  
  /**
   * Check for processes that have arrived at current time
   */
  checkArrivals() {
    for (const process of this.processes) {
      if (process.state === ProcessState.NEW && process.arrivalTime <= this.currentTime) {
        this.admitProcess(process);
      }
    }
  }
  
  /**
   * Check for completed I/O operations
   */
  checkIOCompletions() {
    const completedIO = [];
    
    for (const process of this.waitingQueue) {
      if (process.processIO(1)) {
        completedIO.push(process);
      }
    }
    
    // Move completed I/O processes back to ready queue
    for (const process of completedIO) {
      this.waitingQueue = this.waitingQueue.filter(p => p.id !== process.id);
      process.setState(ProcessState.READY, this.currentTime);
      this.readyQueue.push(process);
    }
  }
  
  /**
   * Run simulation until all processes complete
   * 
   * @param {number} stepDelay - Delay between steps in ms (for visualization)
   */
  async run(stepDelay = 500) {
    this.isRunning = true;
    
    while (this.isRunning && !this.isComplete()) {
      await this.step();
      await this.delay(stepDelay);
    }
    
    this.isRunning = false;
  }
  
  /**
   * Pause the simulation
   */
  pause() {
    this.isRunning = false;
  }
  
  /**
   * Check if all processes have completed
   */
  isComplete() {
    return this.processes.length > 0 && 
           this.processes.every(p => p.state === ProcessState.TERMINATED);
  }
  
  /**
   * Reset the scheduler for a new simulation
   */
  reset() {
    this.currentTime = 0;
    this.isRunning = false;
    this.isContextSwitching = false;
    this.runningProcess = null;
    this.readyQueue = [];
    this.waitingQueue = [];
    this.completedProcesses = [];
    this.ganttChart = [];
    this.quantumRemaining = 0;
    
    this.metrics = {
      totalIdleTime: 0,
      totalContextSwitches: 0,
      processesCompleted: 0
    };
    
    // Reset all processes
    for (const process of this.processes) {
      process.reset();
    }
    
    // Re-admit processes that have arrived at time 0
    this.checkArrivals();
    
    this.notifyStateChange();
  }
  
  /**
   * Clear all processes
   */
  clear() {
    this.processes = [];
    this.reset();
  }
  
  /**
   * Calculate comprehensive metrics
   * 
   * @returns {Object} - Calculated metrics
   */
  calculateMetrics() {
    const completed = this.processes.filter(p => p.state === ProcessState.TERMINATED);
    
    if (completed.length === 0) {
      return {
        avgWaitingTime: 0,
        avgTurnaroundTime: 0,
        avgResponseTime: 0,
        cpuUtilization: 0,
        throughput: 0,
        contextSwitches: this.metrics.totalContextSwitches
      };
    }
    
    /**
     * AVERAGE WAITING TIME
     * ────────────────────
     * Sum of all waiting times / Number of processes
     * 
     * Lower is better - indicates less time spent idle in ready queue.
     * FCFS can have very high waiting time due to Convoy Effect.
     * SJF theoretically minimizes this metric.
     */
    const avgWaitingTime = completed.reduce((sum, p) => sum + p.waitingTime, 0) / completed.length;
    
    /**
     * AVERAGE TURNAROUND TIME
     * ───────────────────────
     * Sum of all turnaround times / Number of processes
     * 
     * Turnaround = Completion - Arrival
     * Lower is better - indicates faster job completion.
     */
    const avgTurnaroundTime = completed.reduce((sum, p) => sum + p.turnaroundTime, 0) / completed.length;
    
    /**
     * AVERAGE RESPONSE TIME
     * ─────────────────────
     * Sum of all response times / Number of processes
     * 
     * Response = First Execution - Arrival
     * Critical for interactive systems - users hate waiting!
     */
    const avgResponseTime = completed.reduce((sum, p) => sum + (p.responseTime || 0), 0) / completed.length;
    
    /**
     * CPU UTILIZATION
     * ───────────────
     * (Total Time - Idle Time) / Total Time * 100
     * 
     * Higher is better - indicates CPU is being used efficiently.
     * 100% utilization isn't always desirable (no headroom for spikes).
     */
    const totalTime = this.currentTime || 1;
    const busyTime = totalTime - this.metrics.totalIdleTime - 
                     (this.metrics.totalContextSwitches * this.contextSwitchOverhead);
    const cpuUtilization = Math.max(0, (busyTime / totalTime) * 100);
    
    /**
     * THROUGHPUT
     * ──────────
     * Number of processes completed per unit time
     * 
     * Higher is better - indicates system is completing work quickly.
     */
    const throughput = completed.length / (totalTime || 1);
    
    return {
      avgWaitingTime: avgWaitingTime.toFixed(2),
      avgTurnaroundTime: avgTurnaroundTime.toFixed(2),
      avgResponseTime: avgResponseTime.toFixed(2),
      cpuUtilization: cpuUtilization.toFixed(1),
      throughput: throughput.toFixed(3),
      contextSwitches: this.metrics.totalContextSwitches
    };
  }
  
  /**
   * Get current scheduler state for UI
   */
  getState() {
    return {
      currentTime: this.currentTime,
      isRunning: this.isRunning,
      isContextSwitching: this.isContextSwitching,
      runningProcess: this.runningProcess ? this.runningProcess.toSnapshot() : null,
      readyQueue: this.readyQueue.map(p => p.toSnapshot()),
      waitingQueue: this.waitingQueue.map(p => p.toSnapshot()),
      completedProcesses: this.completedProcesses.map(p => p.toSnapshot()),
      allProcesses: this.processes.map(p => p.toSnapshot()),
      ganttChart: this.ganttChart,
      metrics: this.calculateMetrics(),
      strategy: this.strategy ? {
        name: this.strategy.name,
        description: this.strategy.description,
        timeQuantum: this.strategy.timeQuantum
      } : null,
      quantumRemaining: this.quantumRemaining
    };
  }
  
  /**
   * Notify UI of state change
   */
  notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }
  
  /**
   * Utility function for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default Scheduler;
