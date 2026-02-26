'use client';

import type { TrainingQuestion, TrainingFeedbackItem } from '@/lib/api';

interface QuestionRendererProps {
  question: TrainingQuestion;
  index: number;
  value: number | string | null;
  onChange: (value: number | string) => void;
  feedback?: TrainingFeedbackItem;
  disabled: boolean;
}

export default function QuestionRenderer({
  question,
  index,
  value,
  onChange,
  feedback,
  disabled,
}: QuestionRendererProps) {
  const showFeedback = !!feedback;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">
          {index + 1}
        </span>
        <div className="flex-1">
          <p className="text-sm text-gray-900 dark:text-white font-medium">
            {question.question}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {question.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'} · {question.points} pts
          </p>
        </div>
      </div>

      {question.type === 'mcq' && question.options && (
        <div className="space-y-2 ml-9">
          {question.options.map((option, optIdx) => {
            const isSelected = value === optIdx;
            const isCorrect = showFeedback && feedback?.correct_option === optIdx;
            const isWrong = showFeedback && isSelected && !feedback?.correct;

            let optionClass = 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600';
            if (showFeedback) {
              if (isCorrect) {
                optionClass = 'border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-600';
              } else if (isWrong) {
                optionClass = 'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-600';
              }
            } else if (isSelected) {
              optionClass = 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-600';
            }

            return (
              <label
                key={optIdx}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition text-sm ${optionClass} ${
                  disabled ? 'cursor-default' : ''
                }`}
              >
                <input
                  type="radio"
                  name={`question-${index}`}
                  checked={isSelected}
                  onChange={() => onChange(optIdx)}
                  disabled={disabled}
                  className="accent-indigo-600"
                />
                <span className="text-gray-700 dark:text-gray-300">{option}</span>
              </label>
            );
          })}
        </div>
      )}

      {question.type === 'short_answer' && (
        <div className="ml-9">
          <textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={4}
            placeholder="Type your answer here..."
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition disabled:opacity-50 resize-none"
          />
        </div>
      )}

      {showFeedback && (
        <div className={`ml-9 mt-3 p-3 rounded-lg text-sm ${
          feedback.type === 'mcq'
            ? feedback.correct
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
        }`}>
          {feedback.type === 'mcq' ? (
            <p>{feedback.correct ? 'Correct!' : 'Incorrect.'} ({feedback.points ?? feedback.score ?? 0}/{feedback.max_points} pts)</p>
          ) : (
            <>
              <p className="font-medium">{feedback.score}/{feedback.max_points} pts</p>
              {feedback.feedback && <p className="mt-1">{feedback.feedback}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
