# CPU Scheduling Visualizer 🖥️

An educational, interactive visualization tool demonstrating CPU scheduling algorithms and the **Illusion of Parallelism** in operating systems.

## 🎯 Educational Objectives

This visualizer helps students understand:
- **The Illusion of Parallelism**: How a single CPU creates the appearance of running multiple processes simultaneously through rapid context switching
- **Scheduling Algorithms**: FCFS, SJF, Round Robin, and Multi-Level Feedback Queue (MLFQ)
- **Process States**: Ready, Running, Waiting, and Terminated
- **Key Concepts**: Preemption, Context Switching Overhead, Starvation, and the Convoy Effect

## 🏗️ Architecture

### Strategy Design Pattern
The scheduler uses the **Strategy Pattern**, allowing different scheduling algorithms to be plugged in dynamically:

```
┌─────────────────┐
│   Scheduler     │ (Context)
│                 │
│ - strategy      │────────┐
│ - processes[]   │        │
│ + schedule()    │        │
└─────────────────┘        │
                           ▼
              ┌────────────────────────┐
              │  SchedulingStrategy    │ (Interface)
              │                        │
              │  + selectNext()        │
              │  + getName()           │
              │  + getDescription()    │
              └────────────────────────┘
                           △
          ┌────────────────┼────────────────┐
          │                │                │
┌─────────┴─────┐ ┌───────┴───────┐ ┌─────┴─────────┐
│ FCFSStrategy  │ │ RRStrategy    │ │ MLFQStrategy  │
└───────────────┘ └───────────────┘ └───────────────┘
```

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the visualizer.

## 🎮 Features

### Control Panel
- **Add Process**: Create new processes with random or custom burst times
- **Inject I/O Interrupt**: Simulate I/O operations (moves running process to Waiting)
- **Kill Process**: Terminate a specific process

### Algorithms
- **FCFS (First-Come-First-Serve)**: Non-preemptive, demonstrates Convoy Effect
- **SJF (Shortest Job First)**: Optimal average waiting time, can cause starvation
- **Round Robin**: Time-quantum based preemption, fair scheduling
- **MLFQ**: Adaptive scheduling with priority queues

### Live Metrics
- Average Waiting Time
- Average Turnaround Time  
- CPU Utilization
- Throughput

## 📚 OS Concepts Demonstrated

### Preemption
The ability to interrupt a running process and switch to another. Round Robin and MLFQ are preemptive algorithms.

### Context Switching
The overhead cost of saving one process's state and loading another's. Visualized with animation delay.

### Starvation
When a process waits indefinitely. Can occur in SJF with continuous short job arrivals.

### Convoy Effect
In FCFS, when a long CPU-bound process blocks many short processes, significantly increasing average waiting time.

## 🎨 Color Coding

| Color | State | Description |
|-------|-------|-------------|
| 🟢 Green | Running | Process currently executing on CPU |
| 🟡 Yellow | Ready | Process waiting in ready queue |
| 🔴 Red | Waiting | Process blocked for I/O |
| ⚫ Gray | Terminated | Process completed execution |

## 📁 Project Structure

```
src/
├── core/                    # Core logic classes
│   ├── Process.js          # Process entity with state management
│   ├── Scheduler.js        # Main scheduler (Strategy Pattern context)
│   └── strategies/         # Algorithm implementations
│       ├── FCFSStrategy.js
│       ├── SJFStrategy.js
│       ├── RoundRobinStrategy.js
│       └── MLFQStrategy.js
├── components/             # React components
│   ├── CPUVisualizer.jsx   # Main visualization canvas
│   ├── ProcessBlock.jsx    # Individual process representation
│   ├── ReadyQueue.jsx      # Queue visualization
│   ├── ControlPanel.jsx    # User controls
│   ├── MetricsDashboard.jsx# Real-time statistics
│   └── GanttChart.jsx      # Execution timeline
├── hooks/                  # Custom React hooks
│   └── useScheduler.js     # Scheduler state management
├── styles/                 # CSS styles
│   └── App.css            # Main stylesheet
├── App.jsx                 # Root component
└── index.js               # Entry point
```

## 📖 License

MIT License - Built for educational purposes
