interface StatCardProps {
  label: string;
  value: number | string;
  badge?: string;
  badgeColor?: 'green' | 'yellow' | 'red' | 'indigo';
}

const badgeStyles = {
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

export default function StatCard({ label, value, badge, badgeColor = 'indigo' }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <div className="flex items-end gap-2 mt-1">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
        {badge && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeStyles[badgeColor]}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
