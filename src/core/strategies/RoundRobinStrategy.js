
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

   * 
   * @param {Process[]} readyQueue - Processes waiting for CPU
   * @param {number} currentTime - Current simulation time
   * @returns {Process|null} - First process in queue
   */
  selectNext(readyQueue, currentTime) {
    if (readyQueue.length === 0) {
      return null;
    }
 
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
  
     */
    
    if (quantumRemaining <= 0 && readyQueue.length > 0) {
      return true;
    }
    
    return false;
  }
}

export default RoundRobinStrategy;
