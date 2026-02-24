import { SchedulingStrategy } from './SchedulingStrategy';

export class MLFQStrategy extends SchedulingStrategy {
  constructor(numQueues = 3, quantums = [4, 8, 16], boostInterval = 50) {
    super();

    this.name = 'MLFQ';
    this.description = `Multi-Level Feedback Queue: The most sophisticated scheduler. 
Processes start at highest priority. If they use full quantum, they're DEMOTED (CPU-bound penalty). 
If they yield for I/O, they may be PROMOTED (I/O-bound reward). 
Watch processes move between the 3 priority queues based on their behavior!`;

    this.isPreemptive = true;
    this.numQueues = numQueues;
    this.quantums = quantums;
    this.timeQuantum = quantums[0];
    this.boostInterval = boostInterval;
    this.timeSinceLastBoost = 0;
  }

  onProcessAdmit(process) {
    process.queueLevel = 0;
    process.quantumUsed = 0;
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

  selectNext(readyQueue, currentTime) {
    if (readyQueue.length === 0) {
      return null;
    }

    const queues = Array.from({ length: this.numQueues }, () => []);

    for (const process of readyQueue) {
      const level = Math.min(process.queueLevel || 0, this.numQueues - 1);
      queues[level].push(process);
    }

    for (let level = 0; level < this.numQueues; level++) {
      if (queues[level].length > 0) {
        queues[level].sort((a, b) => a.arrivalTime - b.arrivalTime);
        this.timeQuantum = this.quantums[level];
        return queues[level][0];
      }
    }

    return null;
  }

  shouldPreempt(runningProcess, readyQueue, quantumRemaining) {
    if (quantumRemaining <= 0) {
      return true;
    }
    const runningLevel = runningProcess.queueLevel || 0;
    const higherPriorityWaiting = readyQueue.some(p =>
      (p.queueLevel || 0) < runningLevel
    );
    return higherPriorityWaiting;
  }

  performBoost(allProcesses) {
    this.timeSinceLastBoost = 0;
    for (const process of allProcesses) {
      process.queueLevel = 0;
      process.quantumUsed = 0;
    }
  }

  isBoostDue() {
    return this.timeSinceLastBoost >= this.boostInterval;
  }

  updateTime(elapsed) {
    this.timeSinceLastBoost += elapsed;
  }

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
