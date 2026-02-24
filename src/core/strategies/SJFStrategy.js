import { SchedulingStrategy } from './SchedulingStrategy';

export class SJFStrategy extends SchedulingStrategy {
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

    this.timeQuantum = null;
  }

  selectNext(readyQueue, currentTime) {
    if (readyQueue.length === 0) {
      return null;
    }
    const sorted = [...readyQueue].sort((a, b) => {
      if (a.remainingTime !== b.remainingTime) {
        return a.remainingTime - b.remainingTime;
      }
      return a.arrivalTime - b.arrivalTime;
    });
    return sorted[0];
  }

  shouldPreempt(runningProcess, readyQueue, quantumRemaining) {
    if (!this.isPreemptive) {
      return false;
    }
    if (readyQueue.length === 0) {
      return false;
    }
    const shortestWaiting = Math.min(...readyQueue.map(p => p.remainingTime));
    return shortestWaiting < runningProcess.remainingTime;
  }
}

export default SJFStrategy;
