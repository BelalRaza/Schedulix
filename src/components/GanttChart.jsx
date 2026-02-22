/**
 * GanttChart Component — Multi-Row Live Gantt Chart
 *
 * Classic OS textbook-style Gantt chart.
 * Each process gets its own horizontal row.
 * Execution segments appear as colored bars spanning exact time units.
 * A live playhead sweeps in real time.
 */

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ROW_HEIGHT = 38;   // px per process row
const UNIT_WIDTH = 48;   // px per time unit
const LABEL_WIDTH = 52;  // px for the process label column

function GanttChart({ data, currentTime, processes }) {
  const scrollRef = useRef(null);

  // Auto-scroll to follow the playhead
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [currentTime]);

  const isEmpty = !data || data.length === 0;

  // Build per-process segment map
  const processRowMap = React.useMemo(() => {
    const map = {}; // pid -> { process, segments: [] }
    if (!data || !processes) return map;

    const procById = {};
    for (const p of processes) {
      procById[p.id] = p;
    }

    for (const entry of data) {
      if (entry.type !== 'execution') continue;
      if (!map[entry.processId]) {
        map[entry.processId] = {
          process: procById[entry.processId] || { id: entry.processId, name: entry.processName, color: '#888' },
          segments: [],
        };
      }
      // Merge adjacent segments for same process
      const segs = map[entry.processId].segments;
      const last = segs[segs.length - 1];
      if (last && last.endTime === entry.startTime) {
        last.endTime = entry.endTime;
      } else {
        segs.push({ startTime: entry.startTime, endTime: entry.endTime });
      }
    }
    return map;
  }, [data, processes]);

  // Ordered rows: same order as processes array
  const rows = React.useMemo(() => {
    if (!processes) return Object.values(processRowMap);
    return processes
      .filter(p => processRowMap[p.id])
      .map(p => processRowMap[p.id]);
  }, [processes, processRowMap]);

  // Context switch/idle entries for the overhead row
  const overheadEntries = React.useMemo(() => {
    if (!data) return [];
    return data.filter(e => e.type === 'context_switch' || e.type === 'idle');
  }, [data]);

  const chartEndTime = Math.max(currentTime, 1);
  const chartWidth = chartEndTime * UNIT_WIDTH + 60;
  const totalRows = rows.length + (overheadEntries.length > 0 ? 1 : 0);
  const chartHeight = totalRows * ROW_HEIGHT;

  const ticks = Array.from({ length: Math.ceil(chartEndTime) + 1 }, (_, i) => i);

  return (
    <div className="gantt-chart">
      {/* Header */}
      <div className="gantt-header">
        <h3>Live Gantt Chart</h3>
        <div className="gantt-legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: 'var(--color-running)' }} />
            Running
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: 'var(--color-accent)', opacity: 0.8 }} />
            Context Switch
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: 'rgba(255,255,255,0.12)' }} />
            Idle
          </span>
        </div>
      </div>

      {isEmpty ? (
        <div className="gantt-empty">
          <div className="gantt-empty-inner">
            <div className="gantt-empty-icon">▶</div>
            <span>Start the simulation to see the live Gantt chart</span>
          </div>
        </div>
      ) : (
        <div className="gantt-scroll-wrapper">
          {/* Fixed label column */}
          <div className="gantt-labels" style={{ height: `${chartHeight}px` }}>
            {rows.map(({ process }) => (
              <div key={process.id} className="gantt-row-label" style={{ height: `${ROW_HEIGHT}px` }}>
                <span className="row-label-dot" style={{ background: process.color }} />
                <span className="row-label-text">{process.name}</span>
              </div>
            ))}
            {overheadEntries.length > 0 && (
              <div className="gantt-row-label overhead-label" style={{ height: `${ROW_HEIGHT}px` }}>
                <span className="row-label-text muted">CPU</span>
              </div>
            )}
          </div>

          {/* Scrollable chart area */}
          <div className="gantt-scroll-area" ref={scrollRef}>
            <div className="gantt-canvas" style={{ width: `${chartWidth}px`, height: `${chartHeight + 28}px` }}>

              {/* Grid lines (vertical per tick) */}
              <div className="gantt-grid" style={{ height: `${chartHeight}px` }}>
                {ticks.map(t => (
                  <div
                    key={t}
                    className="gantt-grid-line"
                    style={{ left: `${t * UNIT_WIDTH}px`, height: `${chartHeight}px` }}
                  />
                ))}
              </div>

              {/* Process rows */}
              {rows.map(({ process, segments }, rowIdx) => (
                <div
                  key={process.id}
                  className="gantt-row"
                  style={{ top: `${rowIdx * ROW_HEIGHT}px`, height: `${ROW_HEIGHT}px` }}
                >
                  {/* Row background stripe */}
                  <div className="gantt-row-bg" style={{ width: `${chartWidth}px` }} />

                  {/* Execution segments */}
                  <AnimatePresence>
                    {segments.map((seg, si) => {
                      const left = seg.startTime * UNIT_WIDTH;
                      const width = (seg.endTime - seg.startTime) * UNIT_WIDTH;
                      return (
                        <motion.div
                          key={`${process.id}-${seg.startTime}`}
                          className="gantt-exec-bar"
                          style={{
                            left: `${left}px`,
                            width: `${width}px`,
                            background: process.color,
                            boxShadow: `0 0 12px ${process.color}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
                          }}
                          initial={{ scaleX: 0, originX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          title={`${process.name}: T${seg.startTime} → T${seg.endTime}`}
                        >
                          {/* Start time badge */}
                          <span className="bar-time-badge bar-time-start">{seg.startTime}</span>

                          {/* Name label (center) */}
                          {width >= 36 && (
                            <span className="bar-name-label">{process.name}</span>
                          )}

                          {/* End time badge */}
                          {width >= 32 && (
                            <span className="bar-time-badge bar-time-end">{seg.endTime}</span>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ))}

              {/* Overhead row (context switches + idle) */}
              {overheadEntries.length > 0 && (
                <div
                  className="gantt-row gantt-overhead-row"
                  style={{ top: `${rows.length * ROW_HEIGHT}px`, height: `${ROW_HEIGHT}px` }}
                >
                  <div className="gantt-row-bg" style={{ width: `${chartWidth}px` }} />
                  {overheadEntries.map((entry, i) => {
                    const left = entry.startTime * UNIT_WIDTH;
                    const width = (entry.endTime - entry.startTime) * UNIT_WIDTH;
                    return (
                      <motion.div
                        key={`overhead-${i}`}
                        className={`gantt-overhead-bar ${entry.type}`}
                        style={{ left: `${left}px`, width: `${width}px` }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        title={`${entry.type === 'context_switch' ? 'Context Switch' : 'Idle'}: T${entry.startTime}→T${entry.endTime}`}
                      >
                        {width >= 20 && (
                          <span className="overhead-label-text">
                            {entry.type === 'context_switch' ? 'CS' : 'IDLE'}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Time axis */}
              <div className="gantt-time-axis" style={{ top: `${chartHeight}px` }}>
                {ticks.map(t => (
                  <div key={t} className="gantt-tick" style={{ left: `${t * UNIT_WIDTH}px` }}>
                    <div className="gantt-tick-line" />
                    <div className="gantt-tick-label">{t}</div>
                  </div>
                ))}
              </div>

              {/* Live playhead */}
              <motion.div
                className="gantt-playhead"
                style={{ left: `${currentTime * UNIT_WIDTH}px`, height: `${chartHeight}px` }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <div className="playhead-line" />
                <div className="playhead-arrow" />
                <div className="playhead-label">{currentTime.toFixed(0)}</div>
              </motion.div>

            </div>
          </div>
        </div>
      )}

      <div className="gantt-education">
        <p>
          <strong>Gantt Chart:</strong> Each row shows one process. Colored bars indicate when it was running.
          Gaps between bars mean the process was preempted or waiting.
          Numbers on bars show exact start and end time.
        </p>
      </div>
    </div>
  );
}

export default GanttChart;
