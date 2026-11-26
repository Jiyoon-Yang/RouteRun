import type { ReportTarget } from '@/commons/types/routerun';
import { isValidUuid } from '@/commons/utils/uuid';

const TARGET_TYPES: readonly ReportTarget['type'][] = ['route', 'track'];

/** 서버로 넘어온 신고 대상이 코스·트랙 + UUID 형태인지 */
export function isValidReportTarget(value: unknown): value is ReportTarget {
  if (typeof value !== 'object' || value === null) return false;
  const { type, id } = value as Record<string, unknown>;
  return (
    TARGET_TYPES.includes(type as ReportTarget['type']) && typeof id === 'string' && isValidUuid(id)
  );
}

/** `/report?target=route:<id>` 쿼리 값 ↔ 신고 대상 */
export function parseReportTarget(value: string | string[] | undefined): ReportTarget | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const [type, id] = raw.split(':');
  const target = { type, id };
  return isValidReportTarget(target) ? target : null;
}

export function formatReportTarget(target: ReportTarget): string {
  return `${target.type}:${target.id}`;
}
