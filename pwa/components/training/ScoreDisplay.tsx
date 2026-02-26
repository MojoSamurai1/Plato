interface ScoreDisplayProps {
  scorePct: number;
  totalPoints: number;
  maxPoints: number;
  mcqPoints: number;
  shortAnswerPoints: number;
  passed: boolean;
}

export default function ScoreDisplay({
  scorePct,
  totalPoints,
  maxPoints,
  mcqPoints,
  shortAnswerPoints,
  passed,
}: ScoreDisplayProps) {
  return (
    <div className={`rounded-xl p-6 text-center ${
      passed
        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
    }`}>
      <div className={`text-4xl font-bold mb-1 ${
        passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      }`}>
        {scorePct}%
      </div>

      <p className={`text-sm font-medium mb-3 ${
        passed ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
      }`}>
        {passed ? 'Passed! Great work!' : 'Not quite — you need 90% to pass'}
      </p>

      <div className="flex justify-center gap-6 text-xs text-gray-500 dark:text-gray-400">
        <div>
          <span className="block text-lg font-semibold text-gray-900 dark:text-white">{totalPoints}</span>
          of {maxPoints} points
        </div>
        <div>
          <span className="block text-lg font-semibold text-gray-900 dark:text-white">{mcqPoints}</span>
          MCQ points
        </div>
        <div>
          <span className="block text-lg font-semibold text-gray-900 dark:text-white">{shortAnswerPoints}</span>
          Short answer
        </div>
      </div>
    </div>
  );
}
