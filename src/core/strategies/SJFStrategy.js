/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║              SHORTEST JOB FIRST (SJF) STRATEGY                            ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║ Schedule the process with the shortest remaining burst time first.        ║
 * ║ Provably OPTIMAL for minimizing average waiting time.                     ║
 * ║                                                                           ║
 * ║ CHARACTERISTICS:                                                          ║
 * ║ ────────────────                                                          ║
 * ║ ✓ Optimal average waiting time (mathematical proof exists!)              ║
 * ║ ✓ Good throughput                                                        ║
 * ║ ✗ REQUIRES KNOWING BURST TIME IN ADVANCE (impractical in reality)        ║
 * ║ ✗ Can cause STARVATION of long processes                                 ║
 * ║ ✗ Not suitable for interactive systems                                   ║
 * ║                                                                           ║
 * ║ ┌─────────────────────────────────────────────────────────────────────┐   ║
 * ║ │                          STARVATION                                 │   ║
 * ║ ├─────────────────────────────────────────────────────────────────────┤   ║
 * ║ │                                                                     │   ║
 * ║ │  Starvation occurs when a process waits indefinitely because        │   ║
 * ║ │  other processes keep "cutting in line."                            │   ║
 * ║ │                                                                     │   ║
 * ║ │  In SJF:                                                            │   ║
 * ║ │  - If short jobs keep arriving, long jobs may NEVER run             │   ║
 * ║ │  - A job with burst time 100 could wait forever if jobs with        │   ║
 * ║ │    burst time 1-10 keep arriving                                    │   ║
 * ║ │                                                                     │   ║
 * ║ │  SOLUTION: AGING                                                    │   ║
 * ║ │  ─────────────────                                                  │   ║
 * ║ │  Gradually increase the priority of waiting processes.              │   ║
 * ║ │  Eventually, even long jobs become "high priority" through aging.   │   ║
 * ║ │                                                                     │   ║
 * ║ └─────────────────────────────────────────────────────────────────────┘   ║
 * ║                                                                           ║
 * ║ VARIANTS:                                                                 ║
 * ║ ─────────                                                                 ║
 * ║ 1. Non-preemptive SJF: Once started, process runs to completion          ║
 * ║ 2. Preemptive SJF (SRTF): If shorter job arrives, preempt current        ║
 * ║                                                                           ║
 * ║ This implementation supports BOTH modes via a configuration option.       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { SchedulingStrategy } from './SchedulingStrategy';

export class SJFStrategy extends SchedulingStrategy {
  /**
   * Create SJF Strategy
   * 
   * @param {boolean} preemptive - If true, use Shortest Remaining Time First (SRTF)
   */
  constructor(preemptive = false) {
    super();
    
    this.isPreemptive = preemptive;
    
    this.name = preemptive ? 'SRTF' : 'SJF';
    this.description = preemptive
      ? `Shortest Remaining Time First: Preemptive version of SJF. 
If a new process arrives with shorter remaining time than the running process, 
preempt immediately. Optimal but can cause STARVATION of long processes.`
      : `Shortest Job First: Select the process with smallest burst time. 
Provably OPTIMAL for average waiting time, but requires knowing burst times 
in advance. Can cause STARVATION - long processes may never run!`;
    
    this.timeQuantum = null; // No fixed quantum, but may preempt for shorter job
  }
  
  /**
   * Select the process with shortest (remaining) burst time
   * 
   * @param {Process[]} readyQueue - Processes waiting for CPU
   * @param {number} currentTime - Current simulation time
   * @returns {Process|null} - Process with shortest remaining time
   */
  selectNext(readyQueue, currentTime) {
    if (readyQueue.length === 0) {
      return null;
    }
    
    /**
     * SJF Selection Logic:
     * ────────────────────
     * Find the process with the SHORTEST remaining burst time.
     * 
     * For non-preemptive SJF, we look at original burst time
     * (since we're selecting before any execution happens).
     * 
     * For preemptive SRTF, we look at remaining time
     * (since the process may have already partially executed).
     * 
     * We use remainingTime in both cases for simplicity,
     * as remainingTime == burstTime for processes that haven't started.
     * 
     * TIE-BREAKER: If two processes have same remaining time,
     * prefer the one that arrived earlier (FCFS for ties).
     */
    
    const sorted = [...readyQueue].sort((a, b) => {
      // Primary sort: remaining time (ascending)
      if (a.remainingTime !== b.remainingTime) {
        return a.remainingTime - b.remainingTime;
      }
      // Secondary sort: arrival time (ascending) - FCFS tie-breaker
      return a.arrivalTime - b.arrivalTime;
    });
    
    return sorted[0];
  }
  
  /**
   * Check if running process should be preempted
   * 
   * For SRTF: preempt if a process in ready queue has shorter remaining time
   * For non-preemptive SJF: never preempt
   * 
   * @param {Process} runningProcess - Currently running process
   * @param {Process[]} readyQueue - Processes waiting for CPU
   * @param {number} quantumRemaining - Not used for SJF
   * @returns {boolean} - True if should preempt
   */
  shouldPreempt(runningProcess, readyQueue, quantumRemaining) {
    // Non-preemptive SJF never preempts
    if (!this.isPreemptive) {
      return false;
    }
    
    // SRTF: Check if any waiting process has shorter remaining time
    if (readyQueue.length === 0) {
      return false;
    }
    
    // Find shortest job in ready queue
    const shortestWaiting = Math.min(...readyQueue.map(p => p.remainingTime));
    
    /**
     * PREEMPTION DECISION:
     * ────────────────────
     * Only preempt if waiting process has STRICTLY shorter remaining time.
     * If equal, keep running current process (don't incur context switch overhead).
     */
    return shortestWaiting < runningProcess.remainingTime;
  }
}

export default SJFStrategy;
