
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScheduler } from './hooks/useScheduler';
import CPUVisualizer from './components/CPUVisualizer';
import ReadyQueue from './components/ReadyQueue';
import WaitingQueue from './components/WaitingQueue';
import ControlPanel from './components/ControlPanel';
import MetricsDashboard from './components/MetricsDashboard';
import GanttChart from './components/GanttChart';
import AlgorithmInfo from './components/AlgorithmInfo';
import ContextSwitchOverlay from './components/ContextSwitchOverlay';

/**
 * Completion Notification Component
 */
function CompletionNotification({ metrics, processCount, onDismiss }) {
  return (
    <motion.div 
      className="completion-notification"
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 50 }}
    >
      <div className="completion-content">
        <div className="completion-icon">✓</div>
        <h2>Simulation Complete!</h2>
        <p>All {processCount} processes have finished execution</p>
        
        <div className="completion-stats">
          <div className="stat-item">
            <span className="stat-label">Avg Waiting Time</span>
            <span className="stat-value">{metrics.avgWaitingTime} units</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg Turnaround</span>
            <span className="stat-value">{metrics.avgTurnaroundTime} units</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">CPU Utilization</span>
            <span className="stat-value">{metrics.cpuUtilization}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Context Switches</span>
            <span className="stat-value">{metrics.contextSwitches}</span>
          </div>
        </div>
        
        <button className="dismiss-btn" onClick={onDismiss}>
          Got it!
        </button>
      </div>
    </motion.div>
  );
}

/**
 * Main Application Component
 * 
 * Orchestrates all visualization components and manages the simulation.
 */
function App() {
  const scheduler = useScheduler();
  const [showCompletion, setShowCompletion] = useState(false);
  const completionShownRef = useRef(false);
  
  // Show completion notification when all processes finish
  useEffect(() => {
    if (scheduler.isComplete && scheduler.hasProcesses && !completionShownRef.current) {
      completionShownRef.current = true;
      // Small delay to let final animations complete
      setTimeout(() => setShowCompletion(true), 500);
    }
    
    // Reset when processes are cleared or reset
    if (!scheduler.hasProcesses || !scheduler.isComplete) {
      completionShownRef.current = false;
      setShowCompletion(false);
    }
  }, [scheduler.isComplete, scheduler.hasProcesses]);
  
  const handleDismissCompletion = () => {
    setShowCompletion(false);
  };
  
  return (
    <div className="app">
      {/* Animated background */}
      <div className="background-grid" />
      <div className="background-glow" />
      
      {/* Header */}
      <motion.header 
        className="header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-content">
          <div className="logo">
            <h1>CPU Scheduler</h1>
          </div>
          <p className="tagline">
            Visualizing the <span className="highlight">Illusion of Parallelism</span>
          </p>
        </div>
        <div className="header-meta">
          <span className="time-badge">
            <span className="label">Time</span>
            <span className="value">{scheduler.state.currentTime}</span>
          </span>
          <span className={`status-badge ${scheduler.isRunning ? 'running' : scheduler.isComplete ? 'complete' : 'paused'}`}>
            {scheduler.isRunning ? '● Running' : scheduler.isComplete ? '✓ Complete' : '○ Paused'}
          </span>
        </div>
      </motion.header>
      
      {/* Main Content */}
      <main className="main-content">
        {/* Left Panel - Control & Info */}
        <motion.aside 
          className="left-panel"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <ControlPanel 
            scheduler={scheduler}
          />
          <AlgorithmInfo 
            algorithm={scheduler.algorithm}
            strategy={scheduler.state.strategy}
          />
        </motion.aside>
        
        {/* Center - Main Visualization */}
        <motion.section 
          className="center-panel"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {/* CPU Visualization */}
          <CPUVisualizer 
            runningProcess={scheduler.state.runningProcess}
            isContextSwitching={scheduler.state.isContextSwitching}
            quantumRemaining={scheduler.state.quantumRemaining}
            algorithm={scheduler.algorithm}
          />
          
          {/* Queue Visualizations */}
          <div className="queues-container">
            <ReadyQueue 
              processes={scheduler.state.readyQueue}
              algorithm={scheduler.algorithm}
              onKillProcess={scheduler.killProcess}
            />
            <WaitingQueue 
              processes={scheduler.state.waitingQueue}
            />
          </div>
          
          {/* Gantt Chart */}
          <GanttChart 
            data={scheduler.state.ganttChart}
            currentTime={scheduler.state.currentTime}
            processes={scheduler.state.allProcesses}
          />
        </motion.section>
        
        {/* Right Panel - Metrics */}
        <motion.aside 
          className="right-panel"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <MetricsDashboard 
            metrics={scheduler.state.metrics}
            processes={scheduler.state.allProcesses}
            completedProcesses={scheduler.state.completedProcesses}
            recentCompletions={scheduler.recentCompletions}
          />
        </motion.aside>
      </main>
      
      {/* Context Switch Overlay */}
      <AnimatePresence>
        {scheduler.contextSwitchInfo && (
          <ContextSwitchOverlay info={scheduler.contextSwitchInfo} />
        )}
      </AnimatePresence>
      
      {/* Completion Notification */}
      <AnimatePresence>
        {showCompletion && (
          <CompletionNotification 
            metrics={scheduler.state.metrics}
            processCount={scheduler.state.allProcesses.length}
            onDismiss={handleDismissCompletion}
          />
        )}
      </AnimatePresence>
      
      {/* Footer with educational note */}
      <motion.footer 
        className="footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <p>
          <strong>Educational Note:</strong> In real systems, context switches happen thousands of times per second. 
          The animations here are slowed down for learning purposes.
        </p>
      </motion.footer>
    </div>
  );
}

export default App;
