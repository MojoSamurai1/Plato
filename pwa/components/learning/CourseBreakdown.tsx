import type { DashboardCourseStat } from '@/lib/api';

interface CourseBreakdownProps {
  courses: DashboardCourseStat[];
}

export default function CourseBreakdown({ courses }: CourseBreakdownProps) {
  if (courses.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 text-center text-sm text-gray-400">
        No courses synced yet. Connect Canvas to see your course breakdown.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
        Course Breakdown
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {courses.map((c) => (
          <div
            key={c.course_id}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {c.course_name}
                </p>
                <p className="text-xs text-gray-400">{c.course_code}</p>
              </div>
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                  c.workflow_state === 'available'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {c.workflow_state === 'available' ? 'Active' : 'Concluded'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <Stat label="Assignments" value={c.assignment_count} />
              <Stat
                label="Upcoming"
                value={c.upcoming_count}
                warn={c.overdue_count > 0}
                suffix={c.overdue_count > 0 ? ` (${c.overdue_count} overdue)` : ''}
              />
              <Stat label="Conversations" value={c.conversation_count} />
              <Stat label="Messages" value={c.message_count} />
              <Stat label="Notes" value={c.notes_count} />
              <Stat label="Canvas pages" value={c.canvas_pages} />
            </div>
            {c.last_activity && (
              <p className="text-[10px] text-gray-400 mt-2">
                Last active:{' '}
                {new Date(c.last_activity).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  warn,
  suffix,
}: {
  label: string;
  value: number;
  warn?: boolean;
  suffix?: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className={`font-medium ${
          warn
            ? 'text-red-600 dark:text-red-400'
            : 'text-gray-900 dark:text-white'
        }`}
      >
        {value}
        {suffix && <span className="text-red-500 dark:text-red-400 font-normal">{suffix}</span>}
      </span>
    </div>
  );
}
