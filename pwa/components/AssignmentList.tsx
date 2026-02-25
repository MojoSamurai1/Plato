import type { Assignment } from '@/lib/api';

interface AssignmentListProps {
  assignments: Assignment[];
}

function formatDueDate(dateStr: string | null): { label: string; badge?: string; badgeColor?: string } {
  if (!dateStr) {
    return { label: 'No due date' };
  }

  const due = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const formatted = due.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  if (diffDays < 0) {
    return { label: formatted, badge: 'Overdue', badgeColor: 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400' };
  }
  if (diffDays === 0) {
    return { label: formatted, badge: 'Due Today', badgeColor: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' };
  }
  if (diffDays === 1) {
    return { label: formatted, badge: 'Tomorrow', badgeColor: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400' };
  }
  if (diffDays <= 3) {
    return { label: formatted, badge: `${diffDays} days`, badgeColor: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' };
  }

  return { label: formatted };
}

export default function AssignmentList({ assignments }: AssignmentListProps) {
  if (assignments.length === 0) {
    return (
      <p className="text-gray-400 dark:text-gray-500 text-sm py-4">
        No upcoming assignments.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {assignments.map((a) => {
        const due = formatDueDate(a.due_at);
        const isOverdue = due.badge === 'Overdue';

        return (
          <div
            key={a.id}
            className={`flex items-center justify-between py-3 px-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 ${
              isOverdue ? 'opacity-60' : ''
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium text-gray-900 dark:text-white truncate ${isOverdue ? 'line-through' : ''}`}>
                {a.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {a.course_code} &middot; {a.points_possible ? `${a.points_possible} pts` : 'Ungraded'}
              </p>
            </div>

            <div className="flex items-center gap-2 ml-4 shrink-0">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {due.label}
              </span>
              {due.badge && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${due.badgeColor}`}>
                  {due.badge}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
