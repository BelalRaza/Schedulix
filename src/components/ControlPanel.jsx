/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                       CONTROL PANEL COMPONENT                             ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║ User interface for controlling the simulation.                             ║
 * ║                                                                           ║
 * ║ Features:                                                                  ║
 * ║ - Algorithm selection                                                      ║
 * ║ - Time quantum slider (for Round Robin)                                   ║
 * ║ - Process management (Add, I/O Interrupt, Kill)                           ║
 * ║ - Simulation controls (Play, Pause, Step, Reset)                          ║
 * ║ - Demo scenarios                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * ControlPanel Component
 * 
 * @param {Object} props
 * @param {Object} props.scheduler - Scheduler hook instance
 */
function ControlPanel({ scheduler }) {
  const [showAddProcess, setShowAddProcess] = useState(false);
  const [newProcess, setNewProcess] = useState({
    name: '',
    burstTime: 5,
    arrivalTime: 0,
    priority: 5
  });
  
  // Algorithm options with descriptions
  const algorithms = [
    { id: 'FCFS', name: 'FCFS', desc: 'First-Come, First-Served' },
    { id: 'SJF', name: 'SJF', desc: 'Shortest Job First' },
    { id: 'SRTF', name: 'SRTF', desc: 'Shortest Remaining Time' },
    { id: 'RR', name: 'Round Robin', desc: 'Time-Sliced Execution' },
    { id: 'MLFQ', name: 'MLFQ', desc: 'Multi-Level Feedback Queue' }
  ];
  
  // Demo scenarios
  const demos = [
    { id: 'convoy', name: 'Convoy Effect', desc: 'Long process blocks short ones' },
    { id: 'starvation', name: 'Starvation', desc: 'Long process never runs' },
    { id: 'balanced', name: 'Balanced Load', desc: 'Mixed process sizes' },
    { id: 'io-bound', name: 'I/O Bound', desc: 'Interactive vs CPU-bound' }
  ];
  
  const handleAddProcess = () => {
    scheduler.addProcess({
      name: newProcess.name || undefined,
      burstTime: parseInt(newProcess.burstTime),
      arrivalTime: parseInt(newProcess.arrivalTime),
      priority: parseInt(newProcess.priority)
    });
    setShowAddProcess(false);
    setNewProcess({ name: '', burstTime: 5, arrivalTime: 0, priority: 5 });
  };
  
  return (
    <div className="control-panel">
      <h2>
        <span className="panel-icon">🎛️</span>
        Control Panel
      </h2>
      
      {/* Algorithm Selection */}
      <section className="control-section">
        <h3>Scheduling Algorithm</h3>
        <div className="algorithm-grid">
          {algorithms.map((algo) => (
            <motion.button
              key={algo.id}
              className={`algo-button ${scheduler.algorithm === algo.id ? 'active' : ''}`}
              onClick={() => scheduler.setAlgorithm(algo.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="algo-name">{algo.name}</span>
              <span className="algo-desc">{algo.desc}</span>
            </motion.button>
          ))}
        </div>
      </section>
      
      {/* Time Quantum Slider (for Round Robin) */}
      {(scheduler.algorithm === 'RR' || scheduler.algorithm === 'MLFQ') && (
        <motion.section 
          className="control-section"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h3>
            Time Quantum
            <span className="quantum-value">{scheduler.timeQuantum}</span>
          </h3>
          <div className="slider-container">
            <input
              type="range"
              min="1"
              max="15"
              value={scheduler.timeQuantum}
              onChange={(e) => scheduler.setTimeQuantum(parseInt(e.target.value))}
              className="quantum-slider"
            />
            <div className="slider-labels">
              <span>1 (Fast switches)</span>
              <span>15 (Fewer switches)</span>
            </div>
          </div>
          <p className="slider-hint">
            💡 Lower quantum = more responsive but higher overhead
          </p>
        </motion.section>
      )}
      
      {/* Simulation Speed */}
      <section className="control-section">
        <h3>
          Simulation Speed
          <span className="speed-value">{scheduler.speed}ms</span>
        </h3>
        <div className="slider-container">
          <input
            type="range"
            min="100"
            max="1500"
            step="100"
            value={scheduler.speed}
            onChange={(e) => scheduler.setSpeed(parseInt(e.target.value))}
            className="speed-slider"
          />
          <div className="slider-labels">
            <span>Fast</span>
            <span>Slow</span>
          </div>
        </div>
      </section>
      
      {/* Simulation Controls */}
      <section className="control-section">
        <h3>Simulation</h3>
        <div className="sim-controls">
          <motion.button
            className="sim-button step"
            onClick={scheduler.step}
            disabled={scheduler.isRunning || scheduler.isComplete}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="btn-icon">⏭️</span>
            Step
          </motion.button>
          
          {scheduler.isRunning ? (
            <motion.button
              className="sim-button pause"
              onClick={scheduler.pause}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="btn-icon">⏸️</span>
              Pause
            </motion.button>
          ) : (
            <motion.button
              className="sim-button play"
              onClick={scheduler.play}
              disabled={scheduler.isComplete || !scheduler.hasProcesses}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="btn-icon">▶️</span>
              Play
            </motion.button>
          )}
          
          <motion.button
            className="sim-button reset"
            onClick={scheduler.reset}
            disabled={scheduler.isRunning}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="btn-icon">🔄</span>
            Reset
          </motion.button>
          
          <motion.button
            className="sim-button clear"
            onClick={scheduler.clear}
            disabled={scheduler.isRunning}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="btn-icon">🗑️</span>
            Clear
          </motion.button>
        </div>
      </section>
      
      {/* Process Controls */}
      <section className="control-section">
        <h3>Process Management</h3>
        <div className="process-controls">
          <motion.button
            className="process-button add"
            onClick={() => setShowAddProcess(!showAddProcess)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="btn-icon">➕</span>
            Add Process
          </motion.button>
          
          <motion.button
            className="process-button quick-add"
            onClick={() => scheduler.addProcess()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="btn-icon">⚡</span>
            Quick Add
          </motion.button>
          
          <motion.button
            className="process-button io"
            onClick={() => scheduler.injectIO()}
            disabled={!scheduler.state.runningProcess}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="btn-icon">💾</span>
            Inject I/O
          </motion.button>
        </div>
        
        {/* Add Process Form */}
        {showAddProcess && (
          <motion.div 
            className="add-process-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="form-row">
              <label>Name</label>
              <input
                type="text"
                placeholder="Auto"
                value={newProcess.name}
                onChange={(e) => setNewProcess({ ...newProcess, name: e.target.value })}
              />
            </div>
            <div className="form-row">
              <label>Burst Time</label>
              <input
                type="number"
                min="1"
                max="50"
                value={newProcess.burstTime}
                onChange={(e) => setNewProcess({ ...newProcess, burstTime: e.target.value })}
              />
            </div>
            <div className="form-row">
              <label>Arrival Time</label>
              <input
                type="number"
                min="0"
                value={newProcess.arrivalTime}
                onChange={(e) => setNewProcess({ ...newProcess, arrivalTime: e.target.value })}
              />
            </div>
            <div className="form-row">
              <label>Priority</label>
              <input
                type="number"
                min="1"
                max="10"
                value={newProcess.priority}
                onChange={(e) => setNewProcess({ ...newProcess, priority: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button className="btn-confirm" onClick={handleAddProcess}>
                Add Process
              </button>
              <button className="btn-cancel" onClick={() => setShowAddProcess(false)}>
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </section>
      
      {/* Demo Scenarios */}
      <section className="control-section">
        <h3>Demo Scenarios</h3>
        <div className="demo-grid">
          {demos.map((demo) => (
            <motion.button
              key={demo.id}
              className="demo-button"
              onClick={() => scheduler.loadDemo(demo.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="demo-name">{demo.name}</span>
              <span className="demo-desc">{demo.desc}</span>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ControlPanel;
