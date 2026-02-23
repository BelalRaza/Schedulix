/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    ROUND ROBIN (RR) STRATEGY                              ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║ The workhorse of time-sharing systems. Each process gets a fixed TIME     ║
 * ║ QUANTUM (time slice) to execute before being preempted.                   ║
 * ║                                                                           ║
 * ║ This is what creates the ILLUSION OF PARALLELISM!                        ║
 * ║                                                                           ║
 * ║ CHARACTERISTICS:                                                          ║
 * ║ ────────────────                                                          ║
 * ║ ✓ FAIR - every process gets equal CPU time                               ║
 * ║ ✓ No starvation (bounded waiting time)                                   ║
 * ║ ✓ Good response time for interactive processes                           ║
 * ║ ✓ Simple to implement                                                    ║
 * ║ ✗ Performance depends heavily on quantum size                            ║
 * ║ ✗ Context switching overhead with small quantum                          ║
 * ║ ✗ Higher average waiting time than SJF                                   ║
 * ║                                                                           ║
 * ║ ┌─────────────────────────────────────────────────────────────────────┐   ║
 * ║ │                    TIME QUANTUM TRADE-OFF                           │   ║
 * ║ ├─────────────────────────────────────────────────────────────────────┤   ║
 * ║ │                                                                     │   ║
 * ║ │  QUANTUM TOO LARGE:                                                │   ║
 * ║ │  ─────────────────                                                  │   ║
 * ║ │  - Degrades to FCFS behavior                                       │   ║
 * ║ │  - Poor response time                                              │   ║
 * ║ │  - Less "parallelism illusion"                                     │   ║
 * ║ │                                                                     │   ║
 * ║ │  QUANTUM TOO SMALL:                                                │   ║
 * ║ │  ─────────────────                                                  │   ║
 * ║ │  - Excessive context switching                                     │   ║
 * ║ │  - High overhead (CPU spends time switching, not computing)        │   ║
 * ║ │  - Throughput suffers                                              │   ║
 * ║ │                                                                     │   ║
 * ║ │  SWEET SPOT:                                                       │   ║
 * ║ │  ───────────                                                        │   ║
 * ║ │  Quantum should be large enough that most processes complete       │   ║
 * ║ │  within one quantum, but small enough for good responsiveness.     │   ║
 * ║ │                                                                     │   ║
 * ║ │  Rule of thumb: 80% of CPU bursts should be < quantum              │   ║
 * ║ │  Typical values: 10-100 milliseconds                               │   ║
 * ║ │                                                                     │   ║
 * ║ └─────────────────────────────────────────────────────────────────────┘   ║
 * ║                                                                           ║
 * ║ VISUALIZATION:                                                            ║
 * ║ ─────────────                                                             ║
 * ║                                                                           ║
 * ║   Time: 0    4    8    12   16   20   24   28                            ║
 * ║         |    |    |    |    |    |    |    |                              ║
 * ║         ┌────┐    ┌────┐    ┌────┐    ┌──┐                               ║
 * ║   P1:   │████│    │████│    │████│    │██│ (Burst: 14)                   ║
 * ║         └────┘    └────┘    └────┘    └──┘                               ║
 * ║              ┌────┐    ┌────┐    ┌──┐                                     ║
 * ║   P2:        │████│    │████│    │██│      (Burst: 10)                   ║
 * ║              └────┘    └────┘    └──┘                                     ║
 * ║                   ┌────┐    ┌──┐                                          ║
 * ║   P3:             │████│    │██│           (Burst: 6)                    ║
 * ║                   └────┘    └──┘                                          ║
 * ║                                                                           ║
 * ║   (Quantum = 4, processes rotate until complete)                         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { SchedulingStrategy } from './SchedulingStrategy';

export class RoundRobinStrategy extends SchedulingStrategy {
  /**
   * Create Round Robin Strategy
   * 
   * @param {number} timeQuantum - Time slice for each process (default: 4)
   */
  constructor(timeQuantum = 4) {
    super();
    
    this.name = 'Round Robin';
    this.description = `Round Robin: Each process gets a fixed TIME QUANTUM (currently ${timeQuantum} units). 
When quantum expires, process moves to back of queue. This creates the ILLUSION OF PARALLELISM 
in time-sharing systems. Adjust the quantum slider to see the trade-off between 
responsiveness and context switching overhead.`;
    
    // Round Robin is PREEMPTIVE
    // Process is preempted when its quantum expires
    this.isPreemptive = true;
    this.timeQuantum = timeQuantum;
  }
  
  /**
   * Update the time quantum
   * Called when user adjusts the quantum slider
   * 
   * @param {number} quantum - New time quantum value
   */
  setTimeQuantum(quantum) {
    this.timeQuantum = Math.max(1, Math.floor(quantum));
    this.description = `Round Robin: Each process gets a fixed TIME QUANTUM (currently ${this.timeQuantum} units). 
When quantum expires, process moves to back of queue. This creates the ILLUSION OF PARALLELISM 
in time-sharing systems. Adjust the quantum slider to see the trade-off between 
responsiveness and context switching overhead.`;
  }
  
  /**
   * Select the next process in FIFO order
   * 
   * Round Robin doesn't pick "best" process - it just goes around in a circle.
   * The key is the PREEMPTION, not the selection.
   * 
   * @param {Process[]} readyQueue - Processes waiting for CPU
   * @param {number} currentTime - Current simulation time
   * @returns {Process|null} - First process in queue
   */
  selectNext(readyQueue, currentTime) {
    if (readyQueue.length === 0) {
      return null;
    }
    
    /**
     * ROUND ROBIN SELECTION:
     * ──────────────────────
     * Simply return the first process in the ready queue.
     * 
     * The "round robin" behavior comes from:
     * 1. Running process for its quantum
     * 2. Moving it to the BACK of the queue if not complete
     * 3. Next process gets its turn
     * 
     * This creates a circular pattern where every process gets fair time.
     */
    
    return readyQueue[0];
  }
  
  /**
   * Check if quantum has expired
   * 
   * @param {Process} runningProcess - Currently running process
   * @param {Process[]} readyQueue - Processes waiting for CPU
   * @param {number} quantumRemaining - Time remaining in current quantum
   * @returns {boolean} - True if quantum expired
   */
  shouldPreempt(runningProcess, readyQueue, quantumRemaining) {
    /**
     * PREEMPTION IN ROUND ROBIN:
     * ──────────────────────────
     * Preempt ONLY when:
     * 1. Quantum has expired (quantumRemaining <= 0)
     * 2. There are other processes waiting
     * 
     * If no other processes are waiting, let current process continue.
     * (Why waste time on context switch if no one else wants the CPU?)
     */
    
    if (quantumRemaining <= 0 && readyQueue.length > 0) {
      return true;
    }
    
    return false;
  }
}

export default RoundRobinStrategy;
