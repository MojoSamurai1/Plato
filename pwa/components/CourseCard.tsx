import Link from 'next/link';
import type { Course } from '@/lib/api';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const isConcluded =
    course.end_at && new Date(course.end_at) < new Date();

  return (
    <Link
      href={`/courses/${course.id}`}
      className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="inline-block bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-md">
          {course.course_code}
        </span>
        {isConcluded && (
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
            Concluded
          </span>
        )}
      </div>

      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
        {course.name}
      </h3>

      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span>
          {course.assignment_count}{' '}
          {course.assignment_count === 1 ? 'assignment' : 'assignments'}
        </span>
      </div>
    </Link>
  );
}
