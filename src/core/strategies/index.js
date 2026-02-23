/**
 * Strategy Exports
 * 
 * Central export point for all scheduling strategies.
 * Import strategies from this file for convenience.
 */

export { SchedulingStrategy } from './SchedulingStrategy';
export { FCFSStrategy } from './FCFSStrategy';
export { SJFStrategy } from './SJFStrategy';
export { RoundRobinStrategy } from './RoundRobinStrategy';
export { MLFQStrategy } from './MLFQStrategy';

/**
 * Strategy Registry
 * 
 * Provides a way to get strategy instances by name.
 * Useful for UI dropdowns and configuration.
 */
export const STRATEGIES = {
  FCFS: {
    name: 'FCFS',
    fullName: 'First-Come, First-Served',
    create: () => new (require('./FCFSStrategy').FCFSStrategy)()
  },
  SJF: {
    name: 'SJF',
    fullName: 'Shortest Job First',
    create: () => new (require('./SJFStrategy').SJFStrategy)(false)
  },
  SRTF: {
    name: 'SRTF',
    fullName: 'Shortest Remaining Time First',
    create: () => new (require('./SJFStrategy').SJFStrategy)(true)
  },
  RR: {
    name: 'Round Robin',
    fullName: 'Round Robin',
    create: (quantum = 4) => new (require('./RoundRobinStrategy').RoundRobinStrategy)(quantum)
  },
  MLFQ: {
    name: 'MLFQ',
    fullName: 'Multi-Level Feedback Queue',
    create: () => new (require('./MLFQStrategy').MLFQStrategy)()
  }
};
