

import React, { useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * GanttChart Component
 * 
 * @param {Object} props
 * @param {Array} props.data - Gantt chart entries (execution, context_switch, idle)
 * @param {number} props.currentTime - Current simulation time
 * @param {Array} props.processes - All processes for row display
 */
function GanttChart({ data, currentTime, processes = [] }) {
  const containerRef = useRef(null);
  
  // Get unique processes from data for row display
  const processRows = useMemo(() => {
    const processMap = new Map();
    
    // Add all processes first (to maintain order)
    processes.forEach(p => {
      if (!processMap.has(p.id)) {
        processMap.set(p.id, {
          id: p.id,
          name: p.name,
          color: p.color,
          executions: [],
          state: p.state
        });
      }
    });
    
    // Add execution data
    if (data) {
      data.forEach(entry => {
        if (entry.type === 'execution' && processMap.has(entry.processId)) {
          const process = processMap.get(entry.processId);
          process.executions.push({
            startTime: entry.startTime,
            endTime: entry.endTime
          });
        }
      });
    }
    
    return Array.from(processMap.values());
  }, [data, processes]);
  
  // Get context switches for visual indicators
  const contextSwitches = useMemo(() => {
    if (!data) return [];
    return data.filter(entry => entry.type === 'context_switch');
  }, [data]);
  
  // Get idle periods
  const idlePeriods = useMemo(() => {
    if (!data) return [];
    return data.filter(entry => entry.type === 'idle');
  }, [data]);
  
  // Calculate max time for timeline (at least 20 units for visibility)
  const maxTime = Math.max(currentTime + 5, 20);
  
  // Generate time markers
  const timeMarkers = useMemo(() => {
    const markers = [];
    const step = maxTime > 50 ? 5 : maxTime > 30 ? 2 : 1;
    for (let i = 0; i <= maxTime; i += step) {
      markers.push(i);
    }
    return markers;
  }, [maxTime]);
  
  // Auto-scroll to current time
  useEffect(() => {
    if (containerRef.current && currentTime > 0) {
      const scrollPercentage = currentTime / maxTime;
      const maxScroll = containerRef.current.scrollWidth - containerRef.current.clientWidth;
      containerRef.current.scrollLeft = Math.min(scrollPercentage * maxScroll, maxScroll);
    }
  }, [currentTime, maxTime]);
  
  return (
    <div className="gantt-chart-v2">
      <div className="gantt-header-v2">
        <div className="gantt-title">
          <h3>Process Execution Timeline</h3>
        </div>
        <div className="gantt-stats">
          <span className="stat">
            <span className="stat-label">Time:</span>
            <span className="stat-value">{currentTime}</span>
          </span>
          <span className="stat">
            <span className="stat-label">Processes:</span>
            <span className="stat-value">{processRows.length}</span>
          </span>
        </div>
      </div>
      
      {/* Legend */}
      <div className="gantt-legend-v2">
        <span className="legend-item">
          <span className="legend-color execution" />
          Executing
        </span>
        <span className="legend-item">
          <span className="legend-color context-switch" />
          Context Switch
        </span>
        <span className="legend-item">
          <span className="legend-color idle" />
          CPU Idle
        </span>
        <span className="legend-item">
          <span className="legend-marker current" />
          Current Time
        </span>
      </div>
      
      {/* Main Chart Area */}
      <div className="gantt-body" ref={containerRef}>
        {processRows.length === 0 ? (
          <div className="gantt-empty-v2">
            <div className="empty-content">
              <span className="empty-icon">—</span>
              <p>Add processes and start the simulation</p>
              <p className="empty-hint">The timeline will show which process runs at each time unit</p>
            </div>
          </div>
        ) : (
          <div className="gantt-grid">
            {/* Process Labels Column */}
            <div className="process-labels">
              <div className="label-header">Process</div>
              {processRows.map(process => (
                <div 
                  key={process.id} 
                  className={`process-label ${process.state?.toLowerCase() || ''}`}
                >
                  <span 
                    className="process-dot"
                    style={{ backgroundColor: process.color }}
                  />
                  <span className="process-name">{process.name}</span>
                </div>
              ))}
              {/* Idle row */}
              <div className="process-label idle-label">
                <span className="process-dot idle" />
                <span className="process-name">CPU Idle</span>
              </div>
            </div>
            
            {/* Timeline Area */}
            <div className="timeline-area">
              {/* Time Axis */}
              <div className="time-axis-v2">
                {timeMarkers.map(time => (
                  <div 
                    key={time} 
                    className="time-marker"
                    style={{ left: `${(time / maxTime) * 100}%` }}
                  >
                    <span className="marker-tick" />
                    <span className="marker-label">{time}</span>
                  </div>
                ))}
              </div>
              
              {/* Process Rows */}
              <div className="process-rows">
                {processRows.map(process => (
                  <div key={process.id} className="process-row">
                    {/* Execution blocks */}
                    <AnimatePresence>
                      {process.executions.map((exec, idx) => {
                        const left = (exec.startTime / maxTime) * 100;
                        const width = ((exec.endTime - exec.startTime) / maxTime) * 100;
                        
                        return (
                          <motion.div
                            key={`${process.id}-${exec.startTime}-${idx}`}
                            className="execution-block"
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                              backgroundColor: process.color
                            }}
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ 
                              duration: 0.3,
                              ease: "easeOut"
                            }}
                            title={`${process.name}: ${exec.startTime} → ${exec.endTime}`}
                          >
                            {width > 5 && (
                              <span className="block-time">
                                {exec.endTime - exec.startTime}
                              </span>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                ))}
                
                {/* Idle Row */}
                <div className="process-row idle-row">
                  <AnimatePresence>
                    {idlePeriods.map((idle, idx) => {
                      const left = (idle.startTime / maxTime) * 100;
                      const width = ((idle.endTime - idle.startTime) / maxTime) * 100;
                      
                      return (
                        <motion.div
                          key={`idle-${idle.startTime}-${idx}`}
                          className="execution-block idle-block"
                          style={{
                            left: `${left}%`,
                            width: `${width}%`
                          }}
                          initial={{ scaleX: 0, opacity: 0 }}
                          animate={{ scaleX: 1, opacity: 0.5 }}
                          transition={{ duration: 0.3 }}
                          title={`CPU Idle: ${idle.startTime} → ${idle.endTime}`}
                        />
                      );
                    })}
                  </AnimatePresence>
                </div>
                
                {/* Context Switch Indicators */}
                {contextSwitches.map((cs, idx) => {
                  const left = (cs.startTime / maxTime) * 100;
                  
                  return (
                    <motion.div
                      key={`cs-${cs.startTime}-${idx}`}
                      className="context-switch-marker"
                      style={{ left: `${left}%` }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      title={`Context Switch at t=${cs.startTime}`}
                    >
                      ⟳
                    </motion.div>
                  );
                })}
                
                {/* Current Time Indicator */}
                <motion.div 
                  className="current-time-line"
                  style={{ left: `${(currentTime / maxTime) * 100}%` }}
                  animate={{ 
                    opacity: [0.7, 1, 0.7],
                    boxShadow: [
                      '0 0 10px rgba(0, 187, 255, 0.5)',
                      '0 0 20px rgba(0, 187, 255, 0.8)',
                      '0 0 10px rgba(0, 187, 255, 0.5)'
                    ]
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <span className="time-label">t={currentTime}</span>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Summary Stats */}
      {processRows.length > 0 && (
        <div className="gantt-summary">
          <div className="summary-item">
            <span className="summary-icon">•</span>
            <span className="summary-text">
              {data?.filter(d => d.type === 'execution').length || 0} execution blocks
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-icon">🔄</span>
            <span className="summary-text">
              {contextSwitches.length} context switches
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-icon">💤</span>
            <span className="summary-text">
              {idlePeriods.length} idle periods
            </span>
          </div>
        </div>
      )}
      
      {/* Educational Note */}
      <div className="gantt-education-v2">
        <p>
          <strong>How to read:</strong> Each row shows when a process was running. 
          Colored blocks indicate CPU execution time. The vertical line marks the current simulation time.
        </p>
      </div>
    </div>
  );
}

export default GanttChart;
