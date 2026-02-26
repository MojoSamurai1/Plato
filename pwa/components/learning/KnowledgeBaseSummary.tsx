import type { DashboardKnowledgeBase } from '@/lib/api';

interface KnowledgeBaseSummaryProps {
  kb: DashboardKnowledgeBase;
}

export default function KnowledgeBaseSummary({ kb }: KnowledgeBaseSummaryProps) {
  const hasContent = kb.canvas_pages_synced > 0 || kb.study_notes_uploaded > 0;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Knowledge Base
      </h3>
      {!hasContent ? (
        <p className="text-sm text-gray-400">
          No content ingested yet. Sync Canvas content or upload study notes to build your knowledge base.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KBItem label="Canvas pages" value={kb.canvas_pages_synced} />
          <KBItem label="Chunks indexed" value={kb.canvas_total_chunks} />
          <KBItem label="Notes uploaded" value={kb.study_notes_uploaded} />
          <KBItem
            label="Notes status"
            value={`${kb.study_notes_processed} done`}
            sub={kb.study_notes_pending > 0 ? `${kb.study_notes_pending} pending` : undefined}
          />
        </div>
      )}
    </div>
  );
}

function KBItem({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-[10px] text-yellow-600 dark:text-yellow-400">{sub}</p>}
    </div>
  );
}
