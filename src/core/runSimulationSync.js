/**
 * runSimulationSync.js
 *
 * Runs a FULL scheduling simulation synchronously (no animation delays).
 * Used for the Algorithm Comparison panel to compute results for all algorithms
 * against the same set of processes instantly.
 */

import { ProcessState } from '../core/Process';

/**
 * Synchronously simulate a scheduling algorithm given:
 * @param {Object} strategy - A SchedulingStrategy instance
 * @param {Array}  processDefs - Array of plain process-definition objects with
 *                               { name, burstTime, arrivalTime, priority, color, id }
 * @returns {{ ganttChart, metrics, processes }}
 */
export function runSimulationSync(strategy, processDefs) {
    // ── clone processes so we don't mutate the originals ───────────────────────
    const processes = processDefs.map(def => ({
        id: def.id,
        name: def.name,
        burstTime: def.burstTime,
        remainingTime: def.burstTime,
        arrivalTime: def.arrivalTime ?? 0,
        priority: def.priority ?? 5,
        color: def.color ?? '#888',
        state: ProcessState.NEW,
        startTime: null,
        completionTime: null,
        waitingTime: 0,
        turnaroundTime: null,
        responseTime: null,
        currentWaitStart: null,
        queueLevel: 0,
        quantumUsed: 0,
        ioFrequency: 0,
        ioRemaining: 0,
        // Helpers
        setState(newState, t) {
            switch (newState) {
                case ProcessState.READY:
                    this.currentWaitStart = t;
                    this.quantumUsed = 0;
                    break;
                case ProcessState.RUNNING:
                    if (this.currentWaitStart !== null) {
                        this.waitingTime += t - this.currentWaitStart;
                        this.currentWaitStart = null;
                    }
                    if (this.startTime === null) {
                        this.startTime = t;
                        this.responseTime = t - this.arrivalTime;
                    }
                    break;
                case ProcessState.TERMINATED:
                    this.completionTime = t;
                    this.turnaroundTime = t - this.arrivalTime;
                    this.remainingTime = 0;
                    break;
                default:
                    break;
            }
            this.state = newState;
        },
        toSnapshot() {
            return { ...this };
        }
    }));

    const ganttChart = [];
    let currentTime = 0;
    let readyQueue = [];
    let runningProcess = null;
    let quantumRemaining = Infinity;
    const contextSwitchOverhead = 1;
    let totalIdleTime = 0;
    let totalContextSwitches = 0;
    const MAX_TIME = 200; // safeguard

    const admitArrivals = () => {
        for (const p of processes) {
            if (p.state === ProcessState.NEW && p.arrivalTime <= currentTime) {
                p.setState(ProcessState.READY, currentTime);
                readyQueue.push(p);
                if (strategy.onProcessAdmit) strategy.onProcessAdmit(p);
            }
        }
    };

    // Initial admissions
    admitArrivals();

    while (currentTime < MAX_TIME) {
        // Check if all done
        if (processes.every(p => p.state === ProcessState.TERMINATED)) break;

        // Admit new arrivals
        admitArrivals();

        // Select next if idle
        if (!runningProcess && readyQueue.length > 0) {
            const next = strategy.selectNext(readyQueue, currentTime);
            if (next) {
                readyQueue = readyQueue.filter(p => p.id !== next.id);
                totalContextSwitches++;
                // Record context switch
                ganttChart.push({
                    type: 'context_switch',
                    startTime: currentTime,
                    endTime: currentTime + contextSwitchOverhead,
                });
                currentTime += contextSwitchOverhead;
                runningProcess = next;
                next.setState(ProcessState.RUNNING, currentTime);
                quantumRemaining = strategy.timeQuantum || Infinity;
            }
        }

        if (runningProcess) {
            // Execute 1 unit
            runningProcess.remainingTime -= 1;
            runningProcess.quantumUsed += 1;
            ganttChart.push({
                type: 'execution',
                processId: runningProcess.id,
                processName: runningProcess.name,
                color: runningProcess.color,
                startTime: currentTime,
                endTime: currentTime + 1,
            });
            currentTime += 1;
            quantumRemaining -= 1;

            if (runningProcess.remainingTime <= 0) {
                runningProcess.setState(ProcessState.TERMINATED, currentTime);
                runningProcess = null;
            } else if (strategy.shouldPreempt && strategy.shouldPreempt(runningProcess, readyQueue, quantumRemaining)) {
                // MLFQ demotion
                if (strategy.name === 'MLFQ' && quantumRemaining <= 0) {
                    runningProcess.queueLevel = Math.min(runningProcess.queueLevel + 1, 2);
                }
                runningProcess.setState(ProcessState.READY, currentTime);
                readyQueue.push(runningProcess);
                runningProcess = null;
            }
        } else {
            // Idle
            totalIdleTime++;
            ganttChart.push({ type: 'idle', startTime: currentTime, endTime: currentTime + 1 });
            currentTime += 1;
        }

        admitArrivals();
    }

    // ── Compute metrics ─────────────────────────────────────────────────────────
    const completed = processes.filter(p => p.state === ProcessState.TERMINATED);
    const n = completed.length || 1;
    const avgWaitingTime = (completed.reduce((s, p) => s + p.waitingTime, 0) / n).toFixed(2);
    const avgTurnaroundTime = (completed.reduce((s, p) => s + p.turnaroundTime, 0) / n).toFixed(2);
    const avgResponseTime = (completed.reduce((s, p) => s + (p.responseTime || 0), 0) / n).toFixed(2);
    const busyTime = Math.max(0, currentTime - totalIdleTime - totalContextSwitches * contextSwitchOverhead);
    const cpuUtilization = ((busyTime / (currentTime || 1)) * 100).toFixed(1);
    const throughput = (completed.length / (currentTime || 1)).toFixed(3);

    return {
        ganttChart,
        totalTime: currentTime,
        processes,
        metrics: {
            avgWaitingTime,
            avgTurnaroundTime,
            avgResponseTime,
            cpuUtilization,
            throughput,
            contextSwitches: totalContextSwitches,
        },
    };
}
