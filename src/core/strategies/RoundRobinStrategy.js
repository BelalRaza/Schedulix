import { SchedulingStrategy } from './SchedulingStrategy';

export class RoundRobinStrategy extends SchedulingStrategy {
  constructor(timeQuantum = 4) {
    super();

    this.name = 'Round Robin';
    this.description = `Round Robin: Each process gets a fixed TIME QUANTUM (currently ${timeQuantum} units). 
When quantum expires, process moves to back of queue. This creates the ILLUSION OF PARALLELISM 
in time-sharing systems. Adjust the quantum slider to see the trade-off between 
responsiveness and context switching overhead.`;

    this.isPreemptive = true;
    this.timeQuantum = timeQuantum;
  }

  setTimeQuantum(quantum) {
    this.timeQuantum = Math.max(1, Math.floor(quantum));
    this.description = `Round Robin: Each process gets a fixed TIME QUANTUM (currently ${this.timeQuantum} units). 
When quantum expires, process moves to back of queue. This creates the ILLUSION OF PARALLELISM 
in time-sharing systems. Adjust the quantum slider to see the trade-off between 
responsiveness and context switching overhead.`;
  }

  selectNext(readyQueue, currentTime) {
    if (readyQueue.length === 0) {
      return null;
    }
    return readyQueue[0];
  }

  shouldPreempt(runningProcess, readyQueue, quantumRemaining) {
    if (quantumRemaining <= 0 && readyQueue.length > 0) {
      return true;
    }
    return false;
  }
}

export default RoundRobinStrategy;
