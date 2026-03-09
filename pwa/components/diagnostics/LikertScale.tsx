'use client';

interface LikertScaleProps {
  questionId: string;
  value: number | null;
  onChange: (questionId: string, value: number) => void;
}

const LABELS = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

export default function LikertScale({ questionId, value, onChange }: LikertScaleProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {LABELS.map((label, i) => {
        const score = i + 1;
        const selected = value === score;
        return (
          <button
            key={score}
            type="button"
            onClick={() => onChange(questionId, score)}
            className={`flex flex-col items-center gap-1 group transition-all ${
              selected ? 'scale-105' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-all ${
                selected
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-gray-300 dark:border-gray-600 text-gray-400 group-hover:border-indigo-400'
              }`}
            >
              {score}
            </div>
            <span className="text-[9px] sm:text-[10px] text-gray-400 text-center leading-tight max-w-[60px]">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
