import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';
import type { ViolationStatus } from '@/lib/types';

export default function StatusBadge({ status }: { status: ViolationStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
