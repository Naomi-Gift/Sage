import { motion } from 'framer-motion';
import { ArrowDownLeft, Sparkles, Star, TrendingUp, Zap } from 'lucide-react';
import type { ActivityEvent } from '../../types';

type ActivityFeedProps = {
  events: ActivityEvent[];
};

const kindMeta: Record<ActivityEvent['kind'], {
  icon: React.ReactNode;
  iconClass: string;
  color: string;
}> = {
  save:      { icon: <TrendingUp size={14} />,    iconClass: 'feed-icon-save',      color: 'var(--purple)' },
  yield:     { icon: <Sparkles size={14} />,      iconClass: 'feed-icon-yield',     color: 'var(--green)' },
  withdraw:  { icon: <ArrowDownLeft size={14} />, iconClass: 'feed-icon-withdraw',  color: 'var(--pink)' },
  milestone: { icon: <Star size={14} />,          iconClass: 'feed-icon-milestone', color: 'var(--yellow)' },
  'level-up':{ icon: <Zap size={14} />,           iconClass: 'feed-icon-levelup',   color: 'var(--pink)' },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.round((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return `${diffDays} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Group events by date label for section headers
function groupByDate(events: ActivityEvent[]) {
  const groups: { date: string; events: ActivityEvent[] }[] = [];
  const seen = new Map<string, ActivityEvent[]>();
  for (const ev of events) {
    const label = formatDate(ev.date);
    if (!seen.has(label)) { seen.set(label, []); groups.push({ date: label, events: seen.get(label)! }); }
    seen.get(label)!.push(ev);
  }
  return groups;
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className="feed-empty">
        <span>🌱</span>
        <p>Your first save is on its way. Check back tomorrow.</p>
      </div>
    );
  }

  const groups = groupByDate(events);

  return (
    <div className="activity-feed" aria-label="Savings activity">
      {groups.map((group, gi) => (
        <div key={group.date} className="feed-group">
          <span className="feed-date-label">{group.date}</span>
          {group.events.map((ev, ei) => {
            const meta = kindMeta[ev.kind];
            return (
              <motion.div
                key={ev.id}
                className="feed-item"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.28, delay: gi * 0.04 + ei * 0.03 }}
              >
                <span className={`feed-icon ${meta.iconClass}`}>
                  {meta.icon}
                </span>
                <div className="feed-body">
                  <span className="feed-label">{ev.label}</span>
                  {ev.amountGD !== undefined && (
                    <span className="feed-amount" style={{ color: meta.color }}>
                      {ev.kind === 'withdraw' ? '−' : '+'}G$ {ev.amountGD.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
