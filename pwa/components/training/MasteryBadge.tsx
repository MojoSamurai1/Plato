interface MasteryBadgeProps {
  totalScenarios: number;
  passedScenarios: number;
  mastered: boolean;
}

export default function MasteryBadge({ totalScenarios, passedScenarios, mastered }: MasteryBadgeProps) {
  if (totalScenarios === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        Not Started
      </span>
    );
  }

  if (mastered) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        Mastered
      </span>
    );
  }

  if (passedScenarios > 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
        In Progress
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
      Not Started
    </span>
  );
}
