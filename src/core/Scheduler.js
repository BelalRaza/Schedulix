import { ProcessState } from './Process';

export class Scheduler {
  constructor(strategy = null) {
    this.strategy = strategy;
    this.processes = [];
    this.readyQueue = [];
    this.waitingQueue = [];
    this.runningProcess = null;
    this.completedProcesses = [];
    this.currentTime = 0;
    this.isRunning = false;
    this.contextSwitchOverhead = 1;
    this.isContextSwitching = false;
    this.ganttChart = [];
    this.metrics = {
      totalIdleTime: 0,
      totalContextSwitches: 0,
      processesCompleted: 0
    };
    this.onStateChange = null;
    this.onContextSwitch = null;
    this.onProcessComplete = null;
    this.quantumRemaining = 0;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
    // Reset quantum when changing strategies
    if (strategy && strategy.timeQuantum) {
      this.quantumRemaining = strategy.timeQuantum;
    }
  }

  addProcess(process) {
    this.processes.push(process);
    
    // If process has already arrived, add to ready queue
    if (process.arrivalTime <= this.currentTime) {
      this.admitProcess(process);
    }
  }

  admitProcess(process) {
    if (process.state === ProcessState.NEW) {
      process.setState(ProcessState.READY, this.currentTime);
      this.readyQueue.push(process);
      
      // Let strategy know about new process (for MLFQ queue assignment)
      if (this.strategy && this.strategy.onProcessAdmit) {
        this.strategy.onProcessAdmit(process);
      }
    }
  }

  killProcess(processId) {
    // Find and remove from all queues
    this.readyQueue = this.readyQueue.filter(p => p.id !== processId);
    this.waitingQueue = this.waitingQueue.filter(p => p.id !== processId);
    
    if (this.runningProcess && this.runningProcess.id === processId) {
      this.runningProcess.setState(ProcessState.TERMINATED, this.currentTime);
      this.runningProcess = null;
    }
    
    // Find in processes array and terminate
    const process = this.processes.find(p => p.id === processId);
    if (process && process.state !== ProcessState.TERMINATED) {
      process.setState(ProcessState.TERMINATED, this.currentTime);
      this.completedProcesses.push(process);
    }
    
    this.notifyStateChange();
  }

  injectIOInterrupt(ioDuration = 5) {
    if (this.runningProcess) {
      const process = this.runningProcess;
      process.setState(ProcessState.WAITING, this.currentTime);
      process.startIO(ioDuration);
      
      // In MLFQ, yielding for I/O is rewarded with promotion
      if (this.strategy && this.strategy.name === 'MLFQ') {
        process.promote();
      }
      
      this.waitingQueue.push(process);
      this.runningProcess = null;
      
      this.notifyStateChange();
    }
  }

  async performContextSwitch(nextProcess) {
    this.isContextSwitching = true;
    this.metrics.totalContextSwitches++;

    if (this.onContextSwitch) {
      this.onContextSwitch({
        from: this.runningProcess ? this.runningProcess.toSnapshot() : null,
        to: nextProcess.toSnapshot(),
        overhead: this.contextSwitchOverhead
      });
    }

    this.ganttChart.push({
      type: 'context_switch',
      startTime: this.currentTime,
      endTime: this.currentTime + this.contextSwitchOverhead
    });

    await this.delay(this.contextSwitchOverhead * 100);
    
    this.currentTime += this.contextSwitchOverhead;
    this.isContextSwitching = false;
    
    return true;
  }

  async step() {
    if (!this.strategy) {
      throw new Error('No scheduling strategy set!');
    }
    
    // 1. Check for newly arriving processes
    this.checkArrivals();
    
    // 2. Check for I/O completions
    this.checkIOCompletions();
    
    // 3. If nothing is running, select next process
    if (!this.runningProcess && this.readyQueue.length > 0) {
      const nextProcess = this.strategy.selectNext(this.readyQueue, this.currentTime);
      
      if (nextProcess) {
        // Remove from ready queue
        this.readyQueue = this.readyQueue.filter(p => p.id !== nextProcess.id);
        
        // Perform context switch
        await this.performContextSwitch(nextProcess);
        
        // Start running the process
        this.runningProcess = nextProcess;
        nextProcess.setState(ProcessState.RUNNING, this.currentTime);
        
        // Reset quantum for this process
        this.quantumRemaining = this.strategy.timeQuantum || Infinity;
      }
    }
    
    // 4. Execute running process for one time unit
    if (this.runningProcess) {
      const result = this.runningProcess.execute(1);
      
      // Record in Gantt chart
      this.ganttChart.push({
        type: 'execution',
        processId: this.runningProcess.id,
        processName: this.runningProcess.name,
        color: this.runningProcess.color,
        startTime: this.currentTime,
        endTime: this.currentTime + 1
      });
      
      this.currentTime += 1;
      this.quantumRemaining -= 1;
      
      // Check if process completed
      if (result.completed) {
        this.runningProcess.setState(ProcessState.TERMINATED, this.currentTime);
        this.completedProcesses.push(this.runningProcess);
        this.metrics.processesCompleted++;
        
        if (this.onProcessComplete) {
          this.onProcessComplete(this.runningProcess.toSnapshot());
        }
        
        this.runningProcess = null;
      }
      // Check if process requests I/O
      else if (result.requestsIO) {
        this.injectIOInterrupt(3 + Math.floor(Math.random() * 5));
      }
      // Check for preemption (quantum expired or higher priority arrived)
      else if (this.strategy.shouldPreempt(this.runningProcess, this.readyQueue, this.quantumRemaining)) {
        // Handle preemption based on strategy
        this.handlePreemption();
      }
    } else {
      // CPU is idle
      this.metrics.totalIdleTime++;
      this.ganttChart.push({
        type: 'idle',
        startTime: this.currentTime,
        endTime: this.currentTime + 1
      });
      this.currentTime += 1;
    }
    
    this.notifyStateChange();
    
    return this.getState();
  }

  handlePreemption() {
    if (!this.runningProcess) return;
    
    const process = this.runningProcess;
    
    // In MLFQ, using full quantum = demotion
    if (this.strategy.name === 'MLFQ' && this.quantumRemaining <= 0) {
      process.demote(2); // Max 3 queues (0, 1, 2)
    }
    
    // Move back to ready queue
    process.setState(ProcessState.READY, this.currentTime);
    this.readyQueue.push(process);
    this.runningProcess = null;
  }

  checkArrivals() {
    for (const process of this.processes) {
      if (process.state === ProcessState.NEW && process.arrivalTime <= this.currentTime) {
        this.admitProcess(process);
      }
    }
  }

  checkIOCompletions() {
    const completedIO = [];
    
    for (const process of this.waitingQueue) {
      if (process.processIO(1)) {
        completedIO.push(process);
      }
    }
    
    // Move completed I/O processes back to ready queue
    for (const process of completedIO) {
      this.waitingQueue = this.waitingQueue.filter(p => p.id !== process.id);
      process.setState(ProcessState.READY, this.currentTime);
      this.readyQueue.push(process);
    }
  }

  async run(stepDelay = 500) {
    this.isRunning = true;
    
    while (this.isRunning && !this.isComplete()) {
      await this.step();
      await this.delay(stepDelay);
    }
    
    this.isRunning = false;
  }

  pause() {
    this.isRunning = false;
  }

  isComplete() {
    return this.processes.length > 0 && 
           this.processes.every(p => p.state === ProcessState.TERMINATED);
  }

  reset() {
    this.currentTime = 0;
    this.isRunning = false;
    this.isContextSwitching = false;
    this.runningProcess = null;
    this.readyQueue = [];
    this.waitingQueue = [];
    this.completedProcesses = [];
    this.ganttChart = [];
    this.quantumRemaining = 0;
    
    this.metrics = {
      totalIdleTime: 0,
      totalContextSwitches: 0,
      processesCompleted: 0
    };
    
    // Reset all processes
    for (const process of this.processes) {
      process.reset();
    }
    
    // Re-admit processes that have arrived at time 0
    this.checkArrivals();
    
    this.notifyStateChange();
  }

  clear() {
    this.processes = [];
    this.reset();
  }

  calculateMetrics() {
    const completed = this.processes.filter(p => p.state === ProcessState.TERMINATED);
    
    if (completed.length === 0) {
      return {
        avgWaitingTime: 0,
        avgTurnaroundTime: 0,
        avgResponseTime: 0,
        cpuUtilization: 0,
        throughput: 0,
        contextSwitches: this.metrics.totalContextSwitches
      };
    }

    const avgWaitingTime = completed.reduce((sum, p) => sum + p.waitingTime, 0) / completed.length;
    const avgTurnaroundTime = completed.reduce((sum, p) => sum + p.turnaroundTime, 0) / completed.length;
    const avgResponseTime = completed.reduce((sum, p) => sum + (p.responseTime || 0), 0) / completed.length;
    const totalTime = this.currentTime || 1;
    const busyTime = totalTime - this.metrics.totalIdleTime -
                     (this.metrics.totalContextSwitches * this.contextSwitchOverhead);
    const cpuUtilization = Math.max(0, (busyTime / totalTime) * 100);
    const throughput = completed.length / (totalTime || 1);
    
    return {
      avgWaitingTime: avgWaitingTime.toFixed(2),
      avgTurnaroundTime: avgTurnaroundTime.toFixed(2),
      avgResponseTime: avgResponseTime.toFixed(2),
      cpuUtilization: cpuUtilization.toFixed(1),
      throughput: throughput.toFixed(3),
      contextSwitches: this.metrics.totalContextSwitches
    };
  }

  getState() {
    return {
      currentTime: this.currentTime,
      isRunning: this.isRunning,
      isContextSwitching: this.isContextSwitching,
      runningProcess: this.runningProcess ? this.runningProcess.toSnapshot() : null,
      readyQueue: this.readyQueue.map(p => p.toSnapshot()),
      waitingQueue: this.waitingQueue.map(p => p.toSnapshot()),
      completedProcesses: this.completedProcesses.map(p => p.toSnapshot()),
      allProcesses: this.processes.map(p => p.toSnapshot()),
      ganttChart: this.ganttChart,
      metrics: this.calculateMetrics(),
      strategy: this.strategy ? {
        name: this.strategy.name,
        description: this.strategy.description,
        timeQuantum: this.strategy.timeQuantum
      } : null,
      quantumRemaining: this.quantumRemaining
    };
  }

  notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default Scheduler;
