import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useApp, getCurrentWeek } from '../context/AppContext';
import type { TaskStatus } from '../types';

function statusNext(s: TaskStatus): TaskStatus {
  const order: TaskStatus[] = ['todo', 'inprogress', 'done'];
  return order[(order.indexOf(s) + 1) % 3];
}

export default function FocusMode() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const currentWeekIdx = getCurrentWeek(state.startDate) - 1;
  const week = state.weeks[currentWeekIdx];
  const today = state.dayLogs.find(d => d.date === new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') navigate('/'); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  if (!week) return null;

  const pending = week.tasks.filter(t => t.status !== 'done');
  const done = week.tasks.filter(t => t.status === 'done');

  return (
    <div className="focus-mode">
      <button
        className="btn btn-ghost"
        style={{ position: 'absolute', top: 20, right: 20 }}
        onClick={() => navigate('/')}
      >
        <X size={16} /> Exit Focus Mode
      </button>

      <div style={{ maxWidth: 520, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚡</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 8 }}>
            Week {week.number} — Focus
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{week.goal}</p>
        </div>

        {today && (
          <div className="card mb-24" style={{ background: 'var(--accent-dim)', borderColor: 'var(--border-accent)', padding: '12px 16px' }}>
            <div className="flex justify-between items-center" style={{ fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Today: {today.focusArea}</span>
              <span style={{ color: 'var(--accent-light)', fontWeight: 700 }}>
                {today.completedTime}h / {today.plannedTime}h planned
              </span>
            </div>
            {today.reflection && <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 6 }}>{today.reflection}</p>}
          </div>
        )}

        <div className="card mb-16" style={{ padding: '16px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Pending — {pending.length} tasks
          </div>
          {pending.length === 0 ? (
            <div style={{ color: 'var(--success)', fontSize: '0.9rem', textAlign: 'center', padding: '12px 0' }}>
              🎉 All tasks done for this week!
            </div>
          ) : pending.map(task => (
            <div key={task.id} className="task-row" style={{ cursor: 'pointer' }}
              onClick={() => dispatch({ type: 'UPDATE_TASK_STATUS', weekId: week.id, taskId: task.id, status: statusNext(task.status) })}>
              {task.status === 'inprogress'
                ? <Clock size={20} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                : <Circle size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              }
              <span className={`task-title ${task.status}`}>{task.title}</span>
            </div>
          ))}
        </div>

        {done.length > 0 && (
          <div className="card" style={{ padding: '16px 20px', opacity: 0.6 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--success)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Done — {done.length} tasks
            </div>
            {done.map(task => (
              <div key={task.id} className="task-row">
                <CheckCircle2 size={20} style={{ color: 'var(--success)', flexShrink: 0 }} />
                <span className="task-title done">{task.title}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 32, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          Press Esc to exit · Click tasks to advance status
        </div>
      </div>
    </div>
  );
}
