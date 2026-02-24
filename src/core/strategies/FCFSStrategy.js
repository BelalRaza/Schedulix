import { SchedulingStrategy } from './SchedulingStrategy';

export class FCFSStrategy extends SchedulingStrategy {
  constructor() {
    super();

    this.name = 'FCFS';
    this.description = `First-Come, First-Served: The simplest scheduling algorithm. 
Processes are executed in order of arrival. Non-preemptive - once a process starts, 
it runs to completion. Watch for the CONVOY EFFECT when a long process arrives first!`;

    this.isPreemptive = false;
    this.timeQuantum = null;
  }

  selectNext(readyQueue, currentTime) {
    if (readyQueue.length === 0) {
      return null;
    }
    const sorted = [...readyQueue].sort((a, b) => a.arrivalTime - b.arrivalTime);
    return sorted[0];
  }

  shouldPreempt(runningProcess, readyQueue, quantumRemaining) {
    return false;
  }
}

export default FCFSStrategy;
