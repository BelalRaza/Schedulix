export class SchedulingStrategy {
  constructor() {
    this.name = 'Unknown Strategy';
    this.description = '';
    this.timeQuantum = null;
    this.isPreemptive = false;
  }

  selectNext(readyQueue, currentTime) {
    throw new Error('selectNext() must be implemented by concrete strategy');
  }

  shouldPreempt(runningProcess, readyQueue, quantumRemaining) {
    return false;
  }

  onProcessAdmit(process) {}

  getQuantum(process) {
    return this.timeQuantum || Infinity;
  }

  getInfo() {
    return {
      name: this.name,
      description: this.description,
      isPreemptive: this.isPreemptive,
      timeQuantum: this.timeQuantum
    };
  }
}

export default SchedulingStrategy;
