/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║              FIRST-COME, FIRST-SERVED (FCFS) STRATEGY                     ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║ The simplest scheduling algorithm: processes are executed in the order    ║
 * ║ they arrive. Like a queue at a bank - first in line, first served.       ║
 * ║                                                                           ║
 * ║ CHARACTERISTICS:                                                          ║
 * ║ ────────────────                                                          ║
 * ║ ✓ Simple to implement (just a FIFO queue)                                ║
 * ║ ✓ No starvation (every process eventually runs)                          ║
 * ║ ✓ No preemption overhead                                                 ║
 * ║ ✗ Poor average waiting time                                              ║
 * ║ ✗ CONVOY EFFECT - short processes stuck behind long ones                 ║
 * ║ ✗ Not suitable for interactive systems                                   ║
 * ║                                                                           ║
 * ║ ┌─────────────────────────────────────────────────────────────────────┐   ║
 * ║ │                      THE CONVOY EFFECT                              │   ║
 * ║ ├─────────────────────────────────────────────────────────────────────┤   ║
 * ║ │                                                                     │   ║
 * ║ │  Imagine this scenario:                                            │   ║
 * ║ │                                                                     │   ║
 * ║ │  Process A: Burst Time = 100 (CPU-intensive)                       │   ║
 * ║ │  Process B: Burst Time = 2   (Quick I/O operation)                 │   ║
 * ║ │  Process C: Burst Time = 3   (Quick computation)                   │   ║
 * ║ │  Process D: Burst Time = 1   (Very short task)                     │   ║
 * ║ │                                                                     │   ║
 * ║ │  If A arrives first:                                               │   ║
 * ║ │  - B, C, D must wait 100 time units!                               │   ║
 * ║ │  - Average waiting time = (0 + 100 + 102 + 105) / 4 = 76.75        │   ║
 * ║ │                                                                     │   ║
 * ║ │  Like a convoy of slow trucks blocking a highway.                  │   ║
 * ║ │                                                                     │   ║
 * ║ └─────────────────────────────────────────────────────────────────────┘   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { SchedulingStrategy } from './SchedulingStrategy';

export class FCFSStrategy extends SchedulingStrategy {
  constructor() {
    super();
    
    this.name = 'FCFS';
    this.description = `First-Come, First-Served: The simplest scheduling algorithm. 
Processes are executed in order of arrival. Non-preemptive - once a process starts, 
it runs to completion. Watch for the CONVOY EFFECT when a long process arrives first!`;
    
    // FCFS is NON-PREEMPTIVE
    // Once a process starts, it runs until completion or I/O block
    this.isPreemptive = false;
    this.timeQuantum = null; // No time slicing
  }
  
  /**
   * Select the process that arrived earliest
   * 
   * @param {Process[]} readyQueue - Processes waiting for CPU
   * @param {number} currentTime - Current simulation time
   * @returns {Process|null} - First process in queue (by arrival time)
   */
  selectNext(readyQueue, currentTime) {
    if (readyQueue.length === 0) {
      return null;
    }
    
    /**
     * FCFS Selection Logic:
     * ─────────────────────
     * Simply return the process that has been waiting the longest
     * (i.e., the one that arrived first and hasn't been served yet)
     * 
     * Since we add processes to readyQueue in arrival order,
     * we can just return the first element.
     * 
     * However, to be safe and handle edge cases, we sort by arrival time.
     */
    
    // Sort by arrival time (ascending) - earliest arrival first
    const sorted = [...readyQueue].sort((a, b) => a.arrivalTime - b.arrivalTime);
    
    return sorted[0];
  }
  
  /**
   * FCFS never preempts - process runs until completion or voluntary yield
   * 
   * @returns {boolean} - Always false for FCFS
   */
  shouldPreempt(runningProcess, readyQueue, quantumRemaining) {
    // FCFS is non-preemptive: once a process starts, it keeps running
    // until it completes or voluntarily blocks for I/O
    return false;
  }
}

export default FCFSStrategy;
