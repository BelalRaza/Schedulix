import { v4 as uuidv4 } from 'uuid';

export const ProcessState = {
  NEW: 'NEW',
  READY: 'READY',
  RUNNING: 'RUNNING',
  WAITING: 'WAITING',
  TERMINATED: 'TERMINATED'
};

export class Process {
  constructor({ name, arrivalTime = 0, burstTime, priority = 5, ioFrequency = 0 }) {
    this.id = uuidv4();
    this.name = name;
    this.arrivalTime = arrivalTime;
    this.burstTime = burstTime;
    this.remainingTime = burstTime;
    this.priority = priority;
    this.queueLevel = 0;
    this.state = ProcessState.NEW;
    this.ioFrequency = ioFrequency;
    this.ioRemaining = 0;

    this.startTime = null;
    this.completionTime = null;
    this.waitingTime = 0;
    this.currentWaitStart = null;
    this.turnaroundTime = null;
    this.responseTime = null;

    this.color = this.generateColor();
    this.quantumUsed = 0;
  }

  generateColor() {
    const hash = this.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = (hash * 137) % 360;
    return `hsl(${hue}, 70%, 55%)`;
  }

  setState(newState, currentTime) {
    const oldState = this.state;

    const validTransitions = {
      [ProcessState.NEW]: [ProcessState.READY],
      [ProcessState.READY]: [ProcessState.RUNNING, ProcessState.TERMINATED],
      [ProcessState.RUNNING]: [ProcessState.READY, ProcessState.WAITING, ProcessState.TERMINATED],
      [ProcessState.WAITING]: [ProcessState.READY],
      [ProcessState.TERMINATED]: []
    };

    if (!validTransitions[oldState].includes(newState)) {
      console.warn(`Invalid state transition: ${oldState} -> ${newState}`);
      return false;
    }

    switch (newState) {
      case ProcessState.READY:
        this.currentWaitStart = currentTime;
        this.quantumUsed = 0;
        break;

      case ProcessState.RUNNING:
        if (this.currentWaitStart !== null) {
          this.waitingTime += currentTime - this.currentWaitStart;
          this.currentWaitStart = null;
        }
        if (this.startTime === null) {
          this.startTime = currentTime;
          this.responseTime = currentTime - this.arrivalTime;
        }
        break;

      case ProcessState.WAITING:
        break;

      case ProcessState.TERMINATED:
        this.completionTime = currentTime;
        this.turnaroundTime = this.completionTime - this.arrivalTime;
        this.remainingTime = 0;
        break;

      default:
        break;
    }

    this.state = newState;
    return true;
  }

  execute(timeSlice) {
    const actualTime = Math.min(timeSlice, this.remainingTime);
    this.remainingTime -= actualTime;
    this.quantumUsed += actualTime;

    return {
      timeUsed: actualTime,
      completed: this.remainingTime === 0,
      requestsIO: this.ioFrequency > 0 && Math.random() < this.ioFrequency && this.remainingTime > 0
    };
  }

  startIO(ioDuration) {
    this.ioRemaining = ioDuration;
  }

  processIO(elapsed) {
    this.ioRemaining = Math.max(0, this.ioRemaining - elapsed);
    return this.ioRemaining === 0;
  }

  demote(maxQueueLevel) {
    if (this.queueLevel < maxQueueLevel) {
      this.queueLevel++;
      this.quantumUsed = 0;
    }
  }

  promote() {
    if (this.queueLevel > 0) {
      this.queueLevel--;
      this.quantumUsed = 0;
    }
  }

  reset() {
    this.remainingTime = this.burstTime;
    this.state = ProcessState.NEW;
    this.queueLevel = 0;
    this.startTime = null;
    this.completionTime = null;
    this.waitingTime = 0;
    this.currentWaitStart = null;
    this.turnaroundTime = null;
    this.responseTime = null;
    this.ioRemaining = 0;
    this.quantumUsed = 0;
  }

  toSnapshot() {
    return {
      id: this.id,
      name: this.name,
      state: this.state,
      arrivalTime: this.arrivalTime,
      burstTime: this.burstTime,
      remainingTime: this.remainingTime,
      priority: this.priority,
      queueLevel: this.queueLevel,
      waitingTime: this.waitingTime,
      color: this.color,
      progress: ((this.burstTime - this.remainingTime) / this.burstTime) * 100
    };
  }
}

export default Process;
