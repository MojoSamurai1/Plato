import type { DashboardTimelineEntry } from '@/lib/api';

interface ActivityChartProps {
  timeline: DashboardTimelineEntry[];
}

export default function ActivityChart({ timeline }: ActivityChartProps) {
  const maxMessages = Math.max(...timeline.map((d) => d.messages), 1);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
        Activity — Last 14 Days
      </h3>
      <div className="flex items-end gap-1 h-32">
        {timeline.map((day) => {
          const pct = Math.max((day.messages / maxMessages) * 100, 2);
          const dateObj = new Date(day.date + 'T00:00:00');
          const label = dateObj.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
          const isToday = day.date === new Date().toISOString().slice(0, 10);

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center gap-1 group"
            >
              <div className="relative w-full flex justify-center">
                <div className="absolute -top-6 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                  {day.messages} msg{day.messages !== 1 ? 's' : ''}
                </div>
                <div
                  className={`w-full max-w-[24px] rounded-t transition-all ${
                    day.messages > 0
                      ? 'bg-indigo-500 dark:bg-indigo-400'
                      : 'bg-gray-200 dark:bg-gray-700'
                  } ${isToday ? 'ring-2 ring-indigo-300 dark:ring-indigo-600' : ''}`}
                  style={{ height: `${pct}%`, minHeight: '2px' }}
                />
              </div>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 leading-none">
                {label.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
