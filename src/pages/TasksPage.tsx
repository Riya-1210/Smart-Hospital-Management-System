import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHospital } from '../contexts/HospitalContext';
import { CheckSquare, Clock, AlertTriangle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  patient?: string;
  priority: 'High' | 'Medium' | 'Low';
  due: string;
  done: boolean;
  category: string;
}

const NURSE_TASKS: Task[] = [
  { id: 'T1', title: 'Administer medication — Aspirin 75mg', patient: 'Ramesh Gupta', priority: 'High', due: 'Now', done: false, category: 'Medication' },
  { id: 'T2', title: 'Check vitals — ICU-01', patient: 'Arjun Nair', priority: 'High', due: 'Now', done: false, category: 'Vitals' },
  { id: 'T3', title: 'Change wound dressing', patient: 'Preethi Thomas', priority: 'Medium', due: '14:00', done: false, category: 'Wound Care' },
  { id: 'T4', title: 'Patient discharge prep', patient: 'Meena Pillai', priority: 'Medium', due: '15:30', done: true, category: 'Discharge' },
  { id: 'T5', title: 'Lab sample collection — Lab order', patient: 'Vikram Rao', priority: 'High', due: '13:00', done: false, category: 'Lab' },
  { id: 'T6', title: 'Update patient notes', patient: 'Sunita Devi', priority: 'Low', due: '17:00', done: false, category: 'Documentation' },
];

const priorityColors = {
  High: { color: '#8F5540', bg: '#FBF0EC', border: '#D4957E' },
  Medium: { color: '#9A7535', bg: '#F5EDD8', border: '#D9B97A' },
  Low: { color: '#34483A', bg: '#E8EDE6', border: '#C5CEBC' },
};

export default function TasksPage() {
  useAuth();
  useHospital();
  const [tasks, setTasks] = useState<Task[]>(NURSE_TASKS);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Done'>('All');

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const filtered = tasks.filter(t => {
    if (filter === 'Pending') return !t.done;
    if (filter === 'Done') return t.done;
    return true;
  });

  const pending = tasks.filter(t => !t.done).length;
  const done = tasks.filter(t => t.done).length;

  return (
    <div className="p-6 space-y-5 max-w-2xl" style={{ background: '#F8F6F1', minHeight: '100%' }}>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <CheckSquare size={20} className="text-[#78856F]" />
            My Tasks
          </h1>
          <p className="page-subtitle">Care tasks for your current shift</p>
        </div>
        <span className="badge badge-amber">Demo / Simulation</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending', value: pending, color: '#C39A52' },
          { label: 'Completed', value: done, color: '#34483A' },
          { label: 'Total', value: tasks.length, color: '#292824' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-sm text-[#5C5A54]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['All', 'Pending', 'Done'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm px-4 py-1.5 rounded-md border transition-all font-medium ${
              filter === f
                ? 'bg-[#34483A] text-white border-[#34483A]'
                : 'bg-white text-[#5C5A54] border-[#C8C3BB] hover:border-[#78856F]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filtered.map(task => {
          const pc = priorityColors[task.priority];
          return (
            <div
              key={task.id}
              className={`card flex items-start gap-3 transition-all ${task.done ? 'opacity-60' : ''}`}
            >
              <button
                onClick={() => toggleTask(task.id)}
                className="w-5 h-5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors"
                style={{
                  background: task.done ? '#78856F' : 'transparent',
                  borderColor: task.done ? '#78856F' : '#C8C3BB',
                }}
              >
                {task.done && <span className="text-white text-[10px] font-bold">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${task.done ? 'line-through text-[#8C8A83]' : 'text-[#292824]'}`}>
                  {task.title}
                </div>
                {task.patient && (
                  <div className="text-xs text-[#8C8A83] mt-0.5">Patient: {task.patient}</div>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                    style={{ color: pc.color, background: pc.bg, borderColor: pc.border }}
                  >
                    {task.priority}
                  </span>
                  <span className="text-xs text-[#8C8A83]">{task.category}</span>
                  <span className="text-xs text-[#8C8A83] flex items-center gap-0.5">
                    <Clock size={11} /> {task.due}
                  </span>
                </div>
              </div>
              {!task.done && task.priority === 'High' && (
                <AlertTriangle size={14} className="text-[#C39A52] shrink-0 mt-0.5" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
