# CPU Scheduling Visualizer

An educational, interactive visualization tool demonstrating CPU scheduling algorithms and the **Illusion of Parallelism** in operating systems.

## Educational Objectives

This visualizer helps students understand:
- **The Illusion of Parallelism**: How a single CPU creates the appearance of running multiple processes simultaneously through rapid context switching
- **Scheduling Algorithms**: FCFS, SJF, SRTF, Round Robin, and Multi-Level Feedback Queue (MLFQ)
- **Process States**: New, Ready, Running, Waiting, and Terminated
- **Key Concepts**: Preemption, Context Switching Overhead, Starvation, and the Convoy Effect
- **Algorithm Comparison**: Side-by-side comparison of how different algorithms perform on the same workload

## Architecture

### Strategy Design Pattern
The scheduler uses the **Strategy Pattern**, allowing different scheduling algorithms to be plugged in dynamically:

```
┌─────────────────┐
│   Scheduler     │ (Context)
│                 │
│ - strategy      │────────┐
│ - processes[]   │        │
│ + step()        │        │
│ + schedule()    │        │
└─────────────────┘        │
                           ▼
              ┌────────────────────────┐
              │  SchedulingStrategy    │ (Interface)
              │                        │
              │  + selectNext()        │
              │  + shouldPreempt()     │
              │  + getName()           │
              │  + getDescription()    │
              └────────────────────────┘
                           △
        ┌──────────┬───────┼───────┬──────────┐
        │          │       │       │          │
  ┌─────┴─────┐ ┌─┴───┐ ┌─┴──┐ ┌──┴───┐ ┌───┴────┐
  │   FCFS    │ │ SJF │ │SRTF│ │  RR  │ │  MLFQ  │
  └───────────┘ └─────┘ └────┘ └──────┘ └────────┘
```

### Core Architecture Flow

```
React UI  -->  useScheduler hook  -->  Scheduler engine  -->  Strategy plugin  -->  Process entities
                                           │
                                    callbacks (onStateChange,
                                     onContextSwitch,
                                     onProcessComplete)
                                           │
                                           ▼
                                    React state update & re-render
```

## Tech Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| Framework | React | 18.2.0 |
| Animation | Framer Motion | 11.0.0 |
| Unique IDs | uuid | 9.0.0 |
| Build Tool | Create React App | react-scripts 5.0.1 |
| Language | JavaScript (JSX) | ES6+ with modules |
| Styling | Plain CSS | Custom properties, dark cyberpunk theme |
| Fonts | Google Fonts | JetBrains Mono, Outfit |

Entirely client-side -- no backend, no database, no API calls.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the visualizer.

## Features

### Control Panel
- **Add Process**: Create new processes with custom name, burst time, arrival time, and priority
- **Quick Add**: Add a process with random burst time (3-12) instantly
- **Add Long Process**: Add a CPU-bound process (burst 20-29) for convoy effect demos
- **Add Short Process**: Add a short process (burst 2-4)
- **Inject I/O Interrupt**: Simulate I/O operations (moves running process to Waiting queue)
- **Kill Process**: Force-terminate any non-terminated process

### Simulation Controls
- **Step**: Advance one time unit manually for granular inspection
- **Play**: Continuous auto-stepping at configurable speed (100ms to 1500ms delay)
- **Pause**: Stop auto-stepping
- **Reset**: Rewind clock to 0, reset all process states, keep process definitions
- **Clear**: Remove all processes and reset entirely

### Scheduling Algorithms

| Algorithm | Preemptive | Selection Logic | Key Concept |
|-----------|-----------|-----------------|-------------|
| **FCFS** (First-Come-First-Serve) | No | Earliest arrival time | Convoy Effect |
| **SJF** (Shortest Job First) | No | Shortest remaining time; ties broken by arrival | Starvation risk |
| **SRTF** (Shortest Remaining Time First) | Yes | Shortest remaining time; preempts if new arrival is shorter | Optimal avg waiting time |
| **Round Robin** | Yes | FIFO with configurable time quantum | Fair time-sharing |
| **MLFQ** (Multi-Level Feedback Queue) | Yes | 3 priority queues with adaptive demotion/promotion | Feedback-based adaptation |

#### MLFQ Details
- 3 priority levels (Q0 = highest, Q2 = lowest)
- Quantum per level: Q0=4, Q1=8, Q2=16
- New processes start at Q0 (highest priority)
- Exhausting quantum = demotion to lower queue (penalizes CPU-bound)
- Yielding for I/O = promotion to higher queue (rewards I/O-bound)
- Periodic priority boost to prevent starvation (interval = 50)

### Algorithm Comparison

A dedicated **Compare Algorithms** tab allows side-by-side comparison of all scheduling algorithms on the same process workload:

- **Toggle any combination** of algorithms (FCFS, SJF, SRTF, Round Robin, MLFQ) for comparison
- Runs a **complete synchronous simulation** for each selected algorithm against the current process set
- Displays **comparison cards** for each algorithm, each containing:
  - A **mini Gantt chart** showing per-process execution timeline
  - **Metric bars** for Average Waiting Time, Average Turnaround Time, Average Response Time, CPU Utilization, and Context Switches
- Metrics are **color-coded** (green/yellow/red) relative to the best and worst values across all selected algorithms
- Results update reactively whenever the process set or selection changes

This feature is powered by `runSimulationSync.js`, which clones the process definitions and runs the full step loop synchronously (no animation delays) with a safety cap of 200 time units, returning the Gantt chart, metrics, and completed process data.

### Pre-Built Demo Scenarios

| Demo | Description | What It Teaches |
|------|-------------|-----------------|
| Convoy Effect | 1 long job (burst 24) + 3 short jobs | FCFS weakness with mixed workloads |
| Starvation | 1 long job + 4 short jobs arriving over time | SJF weakness with continuous short arrivals |
| Balanced Load | 4 processes with mixed burst times | Fair comparison baseline |
| I/O Bound | 2 interactive + 1 CPU-bound process | MLFQ advantage for interactive workloads |

### Live Metrics Dashboard
- **Average Waiting Time** -- time spent in the ready queue
- **Average Turnaround Time** -- arrival to completion
- **Average Response Time** -- arrival to first execution
- **CPU Utilization** -- percentage of time CPU is busy (SVG arc gauge with color gradient)
- **Throughput** -- processes completed per time unit
- **Context Switches** -- total count of context switches
- **Process Overview Table** -- name, state, burst, remaining, wait, progress bar
- **Completion Log** -- last 5 completed processes with waiting time
- **State Color Legend** -- Running / Ready / Waiting / Terminated

### Visualization Components
- **CPU Core**: Animated chip with SVG circuit traces, pulsing glow when active, spinning activity ring
- **Ready Queue**: FIFO visualization for most algorithms; 3 stacked priority queues with demotion arrows for MLFQ
- **Waiting Queue**: I/O-blocked processes with pulsing indicators
- **Gantt Chart**: Multi-row timeline (one row per process + overhead row), colored bars with time badges, live playhead, auto-scrolling
- **Context Switch Overlay**: Full-screen animated overlay showing process swap with educational details (saving registers, updating PCB, loading state, flushing TLB)
- **Algorithm Info Panel**: Per-algorithm description, pros/cons, best-use-case, and highlighted key concept

## OS Concepts Demonstrated

### Preemption
The ability to interrupt a running process and switch to another. SRTF, Round Robin, and MLFQ are preemptive algorithms.

### Context Switching
The overhead cost of saving one process's state and loading another's. Each context switch costs 1 time unit of overhead, visualized with an animated overlay.

### Starvation
When a process waits indefinitely. Can occur in SJF/SRTF with continuous short job arrivals. MLFQ mitigates this with periodic priority boosts.

### Convoy Effect
In FCFS, when a long CPU-bound process blocks many short processes, significantly increasing average waiting time.

### Process State Machine
Processes follow a strict state machine: `NEW -> READY -> RUNNING -> READY | WAITING | TERMINATED` and `WAITING -> READY`. Each transition records timing metrics.

## Color Coding

| Color | State | Description |
|-------|-------|-------------|
| Green | Running | Process currently executing on CPU |
| Yellow | Ready | Process waiting in ready queue |
| Red | Waiting | Process blocked for I/O |
| Gray | Terminated | Process completed execution |

## Project Structure

```
src/
├── core/                          # Core scheduling engine (pure logic)
│   ├── index.js                   # Barrel exports for core module
│   ├── Process.js                 # Process class (state machine, metrics, execute)
│   ├── Scheduler.js               # Scheduler class (step loop, queues, context switch)
│   ├── runSimulationSync.js       # Synchronous simulation runner (for algorithm comparison)
│   └── strategies/                # Algorithm implementations (Strategy Pattern)
│       ├── index.js               # Barrel exports + STRATEGIES registry
│       ├── SchedulingStrategy.js  # Abstract base class (interface)
│       ├── FCFSStrategy.js        # First-Come, First-Served
│       ├── SJFStrategy.js         # Shortest Job First / Shortest Remaining Time First
│       ├── RoundRobinStrategy.js  # Round Robin with configurable quantum
│       └── MLFQStrategy.js        # Multi-Level Feedback Queue (3 queues)
├── components/                    # React UI components
│   ├── ControlPanel.jsx           # Algorithm selector, process management, sim controls
│   ├── CPUVisualizer.jsx          # Animated CPU chip showing running process
│   ├── ReadyQueue.jsx             # Ready queue (FIFO or MLFQ multi-level)
│   ├── WaitingQueue.jsx           # I/O wait queue visualization
│   ├── ProcessBlock.jsx           # Individual process block (color-coded by state)
│   ├── GanttChart.jsx             # Live multi-row Gantt chart with playhead
│   ├── MetricsDashboard.jsx       # Real-time metrics, process table, CPU gauge
│   ├── AlgorithmInfo.jsx          # Educational panel about current algorithm
│   ├── AlgorithmComparison.jsx    # Side-by-side algorithm comparison with metrics
│   └── ContextSwitchOverlay.jsx   # Animated overlay during context switches
├── hooks/                         # Custom React hooks
│   └── useScheduler.js            # Bridges core engine to React state
├── styles/                        # CSS styles
│   └── App.css                    # Full stylesheet (dark cyberpunk theme, CSS variables)
├── App.jsx                        # Root component (orchestrates all panels)
└── index.js                       # React entry point
```

## Design Patterns

- **Strategy Pattern**: Scheduler delegates algorithm logic to swappable `SchedulingStrategy` implementations
- **Observer Pattern**: Scheduler pushes state changes to React via callbacks (`onStateChange`, `onContextSwitch`, `onProcessComplete`)
- **State Machine**: `Process.setState()` validates transitions against a defined transition table
- **Snapshot Pattern**: `Process.toSnapshot()` creates immutable plain objects for React rendering, decoupling UI from mutable core objects
- **Hook-based State Management**: `useScheduler` is the single source of truth bridging the core engine to React

## License

MIT License - Built for educational purposes
