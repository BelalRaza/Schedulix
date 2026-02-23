/**
 * AlgorithmComparison.jsx
 *
 * Side-by-side Gantt chart comparison of user-selected scheduling algorithms.
 * Users toggle which algorithms to include; each is simulated synchronously
 * against the user's current process set.
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { runSimulationSync } from '../core/runSimulationSync';
import {
    FCFSStrategy,
    SJFStrategy,
    RoundRobinStrategy,
    MLFQStrategy,
} from '../core/strategies';

// ── All available algorithms ─────────────────────────────────────────────────
const ALL_ALGORITHMS = [
    { key: 'FCFS', label: 'FCFS', subtitle: 'First-Come, First-Served', color: '#60a5fa', factory: () => new FCFSStrategy() },
    { key: 'SJF', label: 'SJF', subtitle: 'Shortest Job First', color: '#34d399', factory: () => new SJFStrategy(false) },
    { key: 'SRTF', label: 'SRTF', subtitle: 'Shortest Remaining Time First', color: '#a78bfa', factory: () => new SJFStrategy(true) },
    { key: 'RR', label: 'RR (q=4)', subtitle: 'Round Robin (quantum = 4)', color: '#fb923c', factory: () => new RoundRobinStrategy(4) },
    { key: 'MLFQ', label: 'MLFQ', subtitle: 'Multi-Level Feedback Queue', color: '#f472b6', factory: () => new MLFQStrategy() },
];

const MINI_UNIT = 14;
const MINI_HEIGHT = 22;

// ── Mini Gantt ────────────────────────────────────────────────────────────────
function MiniGantt({ ganttChart, totalTime, processes }) {
    const procById = useMemo(() => {
        const m = {};
        for (const p of processes) m[p.id] = p;
        return m;
    }, [processes]);

    const rows = useMemo(() => {
        const map = {};
        for (const entry of ganttChart) {
            if (entry.type !== 'execution') continue;
            if (!map[entry.processId]) {
                map[entry.processId] = { proc: procById[entry.processId], segments: [] };
            }
            const segs = map[entry.processId].segments;
            const last = segs[segs.length - 1];
            if (last && last.endTime === entry.startTime) {
                last.endTime = entry.endTime;
            } else {
                segs.push({ startTime: entry.startTime, endTime: entry.endTime });
            }
        }
        return Object.values(map);
    }, [ganttChart, procById]);

    const chartWidth = Math.max(totalTime * MINI_UNIT, 200);
    const chartHeight = rows.length * MINI_HEIGHT;
    const ticks = Array.from({ length: Math.ceil(totalTime) + 1 }, (_, i) => i)
        .filter(t => t % 5 === 0 || t === Math.ceil(totalTime));

    return (
        <div className="mini-gantt-wrapper">
            <div className="mini-gantt-labels" style={{ height: `${chartHeight}px` }}>
                {rows.map(({ proc }) => (
                    <div key={proc?.id} className="mini-row-label" style={{ height: `${MINI_HEIGHT}px` }}>
                        <span className="mini-label-dot" style={{ background: proc?.color ?? '#888' }} />
                        <span className="mini-label-text">{proc?.name ?? '?'}</span>
                    </div>
                ))}
            </div>
            <div className="mini-gantt-scroll">
                <div className="mini-gantt-canvas" style={{ width: `${chartWidth}px`, height: `${chartHeight + 18}px` }}>
                    {ticks.map(t => (
                        <div key={t} className="mini-grid-line" style={{ left: `${t * MINI_UNIT}px`, height: `${chartHeight}px` }} />
                    ))}
                    {rows.map(({ proc, segments }, ri) => (
                        <div key={proc?.id} className="mini-row" style={{ top: `${ri * MINI_HEIGHT}px`, height: `${MINI_HEIGHT}px` }}>
                            <div className="mini-row-bg" style={{ width: `${chartWidth}px` }} />
                            {segments.map((seg, si) => {
                                const left = seg.startTime * MINI_UNIT;
                                const width = (seg.endTime - seg.startTime) * MINI_UNIT;
                                return (
                                    <div
                                        key={si}
                                        className="mini-exec-bar"
                                        title={`${proc?.name}: T${seg.startTime}→T${seg.endTime}`}
                                        style={{ left: `${left}px`, width: `${width}px`, background: proc?.color ?? '#888', boxShadow: `0 0 6px ${proc?.color ?? '#888'}55` }}
                                    >
                                        {width >= 22 && <span className="mini-bar-label">{proc?.name}</span>}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                    <div className="mini-time-axis" style={{ top: `${chartHeight}px` }}>
                        {ticks.map(t => (
                            <div key={t} className="mini-tick" style={{ left: `${t * MINI_UNIT}px` }}>
                                <div className="mini-tick-line" />
                                <div className="mini-tick-label">{t}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Metric bar ────────────────────────────────────────────────────────────────
function MetricBar({ label, value, maxValue, unit, lowerIsBetter }) {
    const pct = maxValue > 0 ? Math.min((parseFloat(value) / maxValue) * 100, 100) : 0;
    const good = lowerIsBetter ? pct < 40 : pct > 60;
    const warn = lowerIsBetter ? pct >= 40 && pct < 70 : pct >= 30 && pct <= 60;

    return (
        <div className="cmp-metric-bar">
            <div className="cmp-metric-top">
                <span className="cmp-metric-label">{label}</span>
                <span className={`cmp-metric-value ${good ? 'good' : warn ? 'warn' : 'bad'}`}>
                    {value}{unit}
                </span>
            </div>
            <div className="cmp-bar-track">
                <div className={`cmp-bar-fill ${good ? 'good' : warn ? 'warn' : 'bad'}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
function AlgorithmComparison({ processes }) {
    const hasProcesses = processes && processes.length > 0;

    // Which algorithms are currently selected
    const [selected, setSelected] = useState(new Set(['FCFS', 'SJF']));

    const toggleAlgo = (key) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                if (next.size === 1) return prev; // always keep at least 1
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const activeAlgos = ALL_ALGORITHMS.filter(a => selected.has(a.key));

    const results = useMemo(() => {
        if (!hasProcesses) return null;
        const defs = processes.map(p => ({
            id: p.id,
            name: p.name,
            burstTime: p.burstTime,
            arrivalTime: p.arrivalTime ?? 0,
            priority: p.priority ?? 5,
            color: p.color,
        }));
        return activeAlgos.map(algo => {
            try {
                const result = runSimulationSync(algo.factory(), defs);
                return { ...algo, ...result };
            } catch (e) {
                return { ...algo, error: e.message, ganttChart: [], metrics: {}, processes: [] };
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [processes, hasProcesses, selected]);

    const maxValues = useMemo(() => {
        if (!results) return {};
        const m = results.map(r => r.metrics);
        return {
            avgWaitingTime: Math.max(...m.map(x => parseFloat(x.avgWaitingTime) || 0)),
            avgTurnaroundTime: Math.max(...m.map(x => parseFloat(x.avgTurnaroundTime) || 0)),
            avgResponseTime: Math.max(...m.map(x => parseFloat(x.avgResponseTime) || 0)),
            contextSwitches: Math.max(...m.map(x => parseFloat(x.contextSwitches) || 0)),
        };
    }, [results]);

    return (
        <div className="algo-cmp-root">

            {/* ── Selector bar ─────────────────────────────────────────────────── */}
            <div className="algo-selector-bar">
                <span className="algo-selector-label">Select algorithms:</span>
                <div className="algo-selector-pills">
                    {ALL_ALGORITHMS.map(algo => {
                        const isOn = selected.has(algo.key);
                        return (
                            <button
                                key={algo.key}
                                className={`algo-pill ${isOn ? 'on' : 'off'}`}
                                style={isOn
                                    ? { borderColor: algo.color, color: algo.color, background: `${algo.color}18` }
                                    : {}}
                                onClick={() => toggleAlgo(algo.key)}
                                title={algo.subtitle}
                            >
                                {isOn && <span className="algo-pill-check">✓</span>}
                                {algo.label}
                            </button>
                        );
                    })}
                </div>
                <span className="algo-selector-hint">
                    {selected.size} selected
                </span>
            </div>

            {/* ── Cards ────────────────────────────────────────────────────────── */}
            {!hasProcesses ? (
                <div className="algo-cmp-empty">
                    <div className="algo-cmp-empty-icon">⚖</div>
                    <p>Add processes to see the comparison.</p>
                </div>
            ) : (
                <div className="algo-cmp-grid">
                    <AnimatePresence mode="popLayout">
                        {results && results.map((res, i) => (
                            <motion.div
                                key={res.key}
                                className="algo-cmp-card"
                                layout
                                initial={{ opacity: 0, scale: 0.94 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2, delay: i * 0.04 }}
                            >
                                <div className="algo-cmp-card-header">
                                    <div className="algo-cmp-badge" style={{ background: `${res.color}18`, borderColor: `${res.color}55` }}>
                                        <span className="algo-cmp-badge-name" style={{ color: res.color }}>{res.label}</span>
                                    </div>
                                    <span className="algo-cmp-subtitle">{res.subtitle}</span>
                                </div>

                                <div className="algo-cmp-gantt-wrap">
                                    <MiniGantt
                                        ganttChart={res.ganttChart}
                                        totalTime={res.totalTime}
                                        processes={res.processes}
                                    />
                                </div>

                                <div className="algo-cmp-metrics">
                                    <MetricBar label="Avg Wait" value={res.metrics.avgWaitingTime} maxValue={maxValues.avgWaitingTime} unit=" t" lowerIsBetter />
                                    <MetricBar label="Avg Turnaround" value={res.metrics.avgTurnaroundTime} maxValue={maxValues.avgTurnaroundTime} unit=" t" lowerIsBetter />
                                    <MetricBar label="Avg Response" value={res.metrics.avgResponseTime} maxValue={maxValues.avgResponseTime} unit=" t" lowerIsBetter />
                                    <MetricBar label="CPU Util" value={res.metrics.cpuUtilization} maxValue={100} unit="%" lowerIsBetter={false} />
                                    <MetricBar label="Context Switches" value={res.metrics.contextSwitches} maxValue={maxValues.contextSwitches} unit="" lowerIsBetter />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

export default AlgorithmComparison;
