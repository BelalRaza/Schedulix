/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                       useScheduler Custom Hook                            ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║ React hook that manages the CPU scheduling simulation state.              ║
 * ║ Provides a clean interface between the core scheduling logic              ║
 * ║ and the React UI components.                                             ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Scheduler } from '../core/Scheduler';
import { Process } from '../core/Process';
import { 
  FCFSStrategy, 
  SJFStrategy, 
  RoundRobinStrategy, 
  MLFQStrategy 
} from '../core/strategies';

/**
 * Custom hook for managing CPU scheduling simulation
 * 
 * @returns {Object} - Scheduler state and control functions
 */
export function useScheduler() {
  // Ref to hold scheduler instance (persists across renders)
  const schedulerRef = useRef(null);
  
  // Initialize scheduler on first use
  if (!schedulerRef.current) {
    schedulerRef.current = new Scheduler();
  }
  
  // Scheduler state (synced with React)
  const [state, setState] = useState(() => schedulerRef.current.getState());
  
  // Currently selected algorithm
  const [algorithm, setAlgorithmState] = useState('FCFS');
  
  // Time quantum for Round Robin (controlled by slider)
  const [timeQuantum, setTimeQuantumState] = useState(4);
  
  // MLFQ per-queue quantums (controlled by 3 sliders)
  const [mlfqQuantums, setMLFQQuantumsState] = useState([4, 8, 16]);
  
  // Simulation speed (ms between steps)
  const [speed, setSpeed] = useState(500);
  
  // Context switch animation state
  const [contextSwitchInfo, setContextSwitchInfo] = useState(null);
  
  // Process completion notifications
  const [recentCompletions, setRecentCompletions] = useState([]);
  
  // Animation interval ref
  const animationRef = useRef(null);
  
  /**
   * Subscribe to scheduler state changes
   */
  useEffect(() => {
    const scheduler = schedulerRef.current;
    
    // Set up callbacks
    scheduler.onStateChange = (newState) => {
      setState(newState);
    };
    
    scheduler.onContextSwitch = (info) => {
      setContextSwitchInfo(info);
      // Clear after animation
      setTimeout(() => setContextSwitchInfo(null), 800);
    };
    
    scheduler.onProcessComplete = (process) => {
      setRecentCompletions(prev => [...prev.slice(-4), process]);
    };
    
    // Initial state sync
    setState(scheduler.getState());
    
    return () => {
      // Cleanup
      scheduler.onStateChange = null;
      scheduler.onContextSwitch = null;
      scheduler.onProcessComplete = null;
    };
  }, []);
  
  /**
   * Change scheduling algorithm
   */
  const setAlgorithm = useCallback((algorithmName) => {
    const scheduler = schedulerRef.current;
    
    let strategy;
    switch (algorithmName) {
      case 'FCFS':
        strategy = new FCFSStrategy();
        break;
      case 'SJF':
        strategy = new SJFStrategy(false);
        break;
      case 'SRTF':
        strategy = new SJFStrategy(true);
        break;
      case 'RR':
        strategy = new RoundRobinStrategy(timeQuantum);
        break;
      case 'MLFQ':
        strategy = new MLFQStrategy(3, mlfqQuantums);
        break;
      default:
        strategy = new FCFSStrategy();
    }
    
    scheduler.setStrategy(strategy);
    setAlgorithmState(algorithmName);
    setState(scheduler.getState());
  }, [timeQuantum, mlfqQuantums]);
  
  /**
   * Update MLFQ per-queue quantums
   */
  const setMLFQQuantums = useCallback((quantums) => {
    const scheduler = schedulerRef.current;
    setMLFQQuantumsState(quantums);
    
    if (scheduler.strategy && scheduler.strategy.setQuantums) {
      scheduler.strategy.setQuantums(quantums);
      setState(scheduler.getState());
    }
  }, []);
  
  /**
   * Update time quantum (for Round Robin)
   */
  const setTimeQuantum = useCallback((quantum) => {
    const scheduler = schedulerRef.current;
    setTimeQuantumState(quantum);
    
    if (scheduler.strategy && scheduler.strategy.setTimeQuantum) {
      scheduler.strategy.setTimeQuantum(quantum);
      setState(scheduler.getState());
    }
  }, []);
  
  /**
   * Add a new process to the simulation
   */
  const addProcess = useCallback((config = {}) => {
    const scheduler = schedulerRef.current;
    const processCount = scheduler.processes.length;
    
    // Generate process with default or provided values
    const process = new Process({
      name: config.name || `P${processCount + 1}`,
      arrivalTime: config.arrivalTime ?? scheduler.currentTime,
      burstTime: config.burstTime ?? Math.floor(Math.random() * 10) + 3,
      priority: config.priority ?? Math.floor(Math.random() * 10) + 1,
      ioFrequency: config.ioFrequency ?? 0
    });
    
    scheduler.addProcess(process);
    setState(scheduler.getState());
    
    return process;
  }, []);
  
  /**
   * Add a long process (for Convoy Effect demo)
   */
  const addLongProcess = useCallback(() => {
    return addProcess({
      burstTime: 20 + Math.floor(Math.random() * 10),
      name: `Long-P${schedulerRef.current.processes.length + 1}`
    });
  }, [addProcess]);
  
  /**
   * Add a short process
   */
  const addShortProcess = useCallback(() => {
    return addProcess({
      burstTime: 2 + Math.floor(Math.random() * 3),
      name: `Short-P${schedulerRef.current.processes.length + 1}`
    });
  }, [addProcess]);
  
  /**
   * Inject I/O interrupt to running process
   */
  const injectIO = useCallback((duration = 5) => {
    const scheduler = schedulerRef.current;
    scheduler.injectIOInterrupt(duration);
    setState(scheduler.getState());
  }, []);
  
  /**
   * Kill a specific process
   */
  const killProcess = useCallback((processId) => {
    const scheduler = schedulerRef.current;
    scheduler.killProcess(processId);
    setState(scheduler.getState());
  }, []);
  
  /**
   * Execute a single simulation step
   */
  const step = useCallback(async () => {
    const scheduler = schedulerRef.current;
    if (!scheduler.strategy) {
      console.warn('No scheduling strategy set!');
      return;
    }
    await scheduler.step();
    setState(scheduler.getState());
  }, []);
  
  /**
   * Start continuous simulation
   */
  const play = useCallback(() => {
    if (animationRef.current) return; // Already running
    
    const scheduler = schedulerRef.current;
    scheduler.isRunning = true;
    
    const runStep = async () => {
      if (!scheduler.isRunning || scheduler.isComplete()) {
        scheduler.isRunning = false;
        animationRef.current = null;
        setState(scheduler.getState());
        return;
      }
      
      await scheduler.step();
      setState(scheduler.getState());
      
      animationRef.current = setTimeout(runStep, speed);
    };
    
    runStep();
  }, [speed]);
  
  /**
   * Pause simulation
   */
  const pause = useCallback(() => {
    const scheduler = schedulerRef.current;
    scheduler.isRunning = false;
    
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
    
    setState(scheduler.getState());
  }, []);
  
  /**
   * Reset simulation
   */
  const reset = useCallback(() => {
    pause();
    const scheduler = schedulerRef.current;
    scheduler.reset();
    setRecentCompletions([]);
    setState(scheduler.getState());
  }, [pause]);
  
  /**
   * Clear all processes and reset
   */
  const clear = useCallback(() => {
    pause();
    const scheduler = schedulerRef.current;
    scheduler.clear();
    setRecentCompletions([]);
    setState(scheduler.getState());
  }, [pause]);
  
  /**
   * Load demo scenario
   */
  const loadDemo = useCallback((demoType) => {
    clear();
    const scheduler = schedulerRef.current;
    
    switch (demoType) {
      case 'convoy':
        // Convoy Effect demo - long process followed by short ones
        addProcess({ name: 'LongJob', burstTime: 24, arrivalTime: 0 });
        addProcess({ name: 'Quick1', burstTime: 3, arrivalTime: 1 });
        addProcess({ name: 'Quick2', burstTime: 2, arrivalTime: 2 });
        addProcess({ name: 'Quick3', burstTime: 4, arrivalTime: 3 });
        break;
        
      case 'starvation':
        // Starvation demo - continuous short jobs
        addProcess({ name: 'LongWait', burstTime: 15, arrivalTime: 0 });
        addProcess({ name: 'Short1', burstTime: 2, arrivalTime: 1 });
        addProcess({ name: 'Short2', burstTime: 2, arrivalTime: 4 });
        addProcess({ name: 'Short3', burstTime: 2, arrivalTime: 7 });
        addProcess({ name: 'Short4', burstTime: 2, arrivalTime: 10 });
        break;
        
      case 'balanced':
        // Balanced workload
        addProcess({ name: 'P1', burstTime: 8, arrivalTime: 0 });
        addProcess({ name: 'P2', burstTime: 4, arrivalTime: 1 });
        addProcess({ name: 'P3', burstTime: 9, arrivalTime: 2 });
        addProcess({ name: 'P4', burstTime: 5, arrivalTime: 3 });
        break;
        
      case 'io-bound':
        // I/O-bound processes for MLFQ demo
        addProcess({ name: 'Interactive1', burstTime: 12, arrivalTime: 0, ioFrequency: 0.3 });
        addProcess({ name: 'Interactive2', burstTime: 10, arrivalTime: 1, ioFrequency: 0.25 });
        addProcess({ name: 'CPUBound', burstTime: 20, arrivalTime: 2, ioFrequency: 0 });
        break;
        
      default:
        // Random workload
        for (let i = 0; i < 5; i++) {
          addProcess({
            name: `P${i + 1}`,
            burstTime: Math.floor(Math.random() * 12) + 3,
            arrivalTime: i * 2
          });
        }
    }
    
    setState(scheduler.getState());
  }, [clear, addProcess]);
  
  // Initialize with FCFS strategy
  useEffect(() => {
    if (!schedulerRef.current.strategy) {
      setAlgorithm('FCFS');
    }
  }, [setAlgorithm]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);
  
  return {
    // State
    state,
    algorithm,
    timeQuantum,
    speed,
    contextSwitchInfo,
    recentCompletions,
    
    // Algorithm controls
    setAlgorithm,
    setTimeQuantum,
    setSpeed,
    mlfqQuantums,
    setMLFQQuantums,
    
    // Process controls
    addProcess,
    addLongProcess,
    addShortProcess,
    killProcess,
    injectIO,
    
    // Simulation controls
    step,
    play,
    pause,
    reset,
    clear,
    loadDemo,
    
    // Computed values
    isRunning: state.isRunning,
    isComplete: state.allProcesses.length > 0 && 
                state.allProcesses.every(p => p.state === 'TERMINATED'),
    hasProcesses: state.allProcesses.length > 0
  };
}

export default useScheduler;
