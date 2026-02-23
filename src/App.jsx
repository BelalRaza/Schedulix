

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScheduler } from './hooks/useScheduler';
import CPUVisualizer from './components/CPUVisualizer';
import ReadyQueue from './components/ReadyQueue';
import WaitingQueue from './components/WaitingQueue';
import ControlPanel from './components/ControlPanel';
import MetricsDashboard from './components/MetricsDashboard';
import GanttChart from './components/GanttChart';
import AlgorithmComparison from './components/AlgorithmComparison';
import ContextSwitchOverlay from './components/ContextSwitchOverlay';



function App() {
  const scheduler = useScheduler();
  const [centerTab, setCenterTab] = useState('live'); // 'live' | 'compare'

  return (
    <div className="app">
      <div className="background-grid" />
      <div className="background-glow" />

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
            {scheduler.isRunning ? 'Running' : scheduler.isComplete ? 'Complete' : 'Paused'}
          </span>
        </div>
      </motion.header>

      <main className="main-content">

        <motion.aside
          className="left-panel"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <ControlPanel
            scheduler={scheduler}
          />
        </motion.aside>


        <motion.section
          className="center-panel"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <CPUVisualizer
            runningProcess={scheduler.state.runningProcess}
            isContextSwitching={scheduler.state.isContextSwitching}
            quantumRemaining={scheduler.state.quantumRemaining}
            algorithm={scheduler.algorithm}
          />


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


          <div className="center-tabs">
            <button
              className={`center-tab-btn ${centerTab === 'live' ? 'active' : ''}`}
              onClick={() => setCenterTab('live')}
            >
              Live Gantt Chart
            </button>
            <button
              className={`center-tab-btn ${centerTab === 'compare' ? 'active' : ''}`}
              onClick={() => setCenterTab('compare')}
            >
              Compare Algorithms
            </button>
          </div>


          <AnimatePresence mode="wait">
            {centerTab === 'live' ? (
              <motion.div
                key="live"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <GanttChart
                  data={scheduler.state.ganttChart}
                  currentTime={scheduler.state.currentTime}
                  processes={scheduler.state.allProcesses}
                />
              </motion.div>
            ) : (
              <motion.div
                key="compare"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="compare-panel"
              >
                <div className="compare-panel-header">
                  <h3>Algorithm Comparison</h3>
                  <p className="compare-subtitle">
                    All algorithms run against your current process set.
                    {!scheduler.hasProcesses && ' Add processes to see the comparison.'}
                  </p>
                </div>
                <AlgorithmComparison
                  processes={scheduler.state.allProcesses}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

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


      <AnimatePresence>
        {scheduler.contextSwitchInfo && (
          <ContextSwitchOverlay info={scheduler.contextSwitchInfo} />
        )}
      </AnimatePresence>


      <footer className="footer">
        <p>In real systems, context switches happen thousands of times per second. Animations are slowed for educational purposes.</p>
      </footer>
    </div>
  );
}

export default App;


