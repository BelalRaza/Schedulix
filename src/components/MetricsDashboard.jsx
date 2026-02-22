

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MetricCard Component - Individual metric display
 */
function MetricCard({ label, value, unit, description, trend, color }) {
  return (
    <motion.div
      className={`metric-card ${color || ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        {trend && (
          <span className={`metric-trend ${trend > 0 ? 'up' : 'down'}`}>
            {trend > 0 ? '↑' : '↓'}
          </span>
        )}
      </div>
      <div className="metric-value">
        <span className="value">{value}</span>
        {unit && <span className="unit">{unit}</span>}
      </div>
      {description && (
        <div className="metric-description">{description}</div>
      )}
    </motion.div>
  );
}

/**
 * ProcessTable Component - Shows all processes with their stats
 */
function ProcessTable({ processes }) {
  if (!processes || processes.length === 0) {
    return (
      <div className="process-table-empty">
        <span>No processes yet</span>
      </div>
    );
  }

  return (
    <div className="process-table">
      <table>
        <thead>
          <tr>
            <th>Process</th>
            <th>State</th>
            <th>Burst</th>
            <th>Remaining</th>
            <th>Wait</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {processes.map((process) => (
              <motion.tr
                key={process.id}
                className={`state-${process.state.toLowerCase()}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <td className="process-name">
                  <span
                    className="color-dot"
                    style={{ backgroundColor: process.color }}
                  />
                  {process.name}
                </td>
                <td className="process-state">
                  <span className={`state-badge ${process.state.toLowerCase()}`}>
                    {process.state}
                  </span>
                </td>
                <td>{process.burstTime}</td>
                <td>{process.remainingTime}</td>
                <td>{process.waitingTime.toFixed(1)}</td>
                <td>
                  <div className="mini-progress">
                    <div
                      className="mini-progress-bar"
                      style={{ width: `${process.progress}%` }}
                    />
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}

/**
 * CompletionLog Component - Shows recently completed processes
 */
function CompletionLog({ completions }) {
  return (
    <div className="completion-log">
      <h4>Recently Completed</h4>
      <AnimatePresence mode="popLayout">
        {completions.length > 0 ? (
          <ul>
            {completions.slice(-5).reverse().map((process, i) => (
              <motion.li
                key={`${process.id}-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
              >
                <span
                  className="color-dot"
                  style={{ backgroundColor: process.color }}
                />
                <span className="process-name">{process.name}</span>
                <span className="completion-stats">
                  WT: {process.waitingTime.toFixed(1)}
                </span>
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="no-completions">No completions yet</p>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * MetricsDashboard Component
 * 
 * @param {Object} props
 * @param {Object} props.metrics - Calculated scheduling metrics
 * @param {Array} props.processes - All processes
 * @param {Array} props.completedProcesses - Completed processes
 * @param {Array} props.recentCompletions - Recent completion notifications
 */
function MetricsDashboard({ metrics, processes, completedProcesses, recentCompletions }) {
  const cpuUtil = parseFloat(metrics.cpuUtilization) || 0;

  return (
    <div className="metrics-dashboard">
      <h2>Live Metrics</h2>

      {/* Primary Metrics */}
      <section className="metrics-grid">
        <MetricCard
          label="Avg Waiting Time"
          value={metrics.avgWaitingTime}
          unit="units"
          description="Time spent in ready queue"
          color="metric-waiting"
        />

        <MetricCard
          label="Avg Turnaround"
          value={metrics.avgTurnaroundTime}
          unit="units"
          description="Arrival to completion"
          color="metric-turnaround"
        />

        <MetricCard
          label="CPU Utilization"
          value={metrics.cpuUtilization}
          unit="%"
          description="How busy is the CPU"
          color={cpuUtil > 80 ? 'metric-good' : cpuUtil > 50 ? 'metric-ok' : 'metric-low'}
        />

        <MetricCard
          label="Throughput"
          value={metrics.throughput}
          unit="proc/unit"
          description="Completion rate"
          color="metric-throughput"
        />

        <MetricCard
          label="Context Switches"
          value={metrics.contextSwitches}
          description="CPU state changes"
          color="metric-switches"
        />

        <MetricCard
          label="Response Time"
          value={metrics.avgResponseTime}
          unit="units"
          description="Time to first execution"
          color="metric-response"
        />
      </section>

      {/* CPU Utilization Gauge */}
      <section className="utilization-gauge">
        <h3>CPU Utilization</h3>
        <div className="gauge-container">
          <svg viewBox="0 0 100 50" className="gauge-svg">
            {/* Background arc */}
            <path
              d="M 10 45 A 40 40 0 0 1 90 45"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Filled arc */}
            <motion.path
              d="M 10 45 A 40 40 0 0 1 90 45"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="126"
              initial={{ strokeDashoffset: 126 }}
              animate={{ strokeDashoffset: 126 - (cpuUtil / 100 * 126) }}
              transition={{ duration: 0.5 }}
            />
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
          </svg>
          <div className="gauge-value">{cpuUtil.toFixed(1)}%</div>
        </div>
      </section>

      {/* Process Overview Table */}
      <section className="process-overview">
        <h3>
          Process Overview
          <span className="count">({processes.length} total)</span>
        </h3>
        <ProcessTable processes={processes} />
      </section>

      {/* Completion Log */}
      <CompletionLog completions={recentCompletions} />

      {/* Legend */}
      <section className="state-legend">
        <h4>State Colors</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color running" />
            <span>Running</span>
          </div>
          <div className="legend-item">
            <span className="legend-color ready" />
            <span>Ready</span>
          </div>
          <div className="legend-item">
            <span className="legend-color waiting" />
            <span>Waiting</span>
          </div>
          <div className="legend-item">
            <span className="legend-color terminated" />
            <span>Terminated</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MetricsDashboard;
