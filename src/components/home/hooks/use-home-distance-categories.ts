'use client';

import { useCallback, useState } from 'react';

import type { DistanceCategory } from '@/commons/utils/distance/category';

/** 홈 탭 거리 카테고리 필터(Set) 및 탭 클릭 토글 */
export function useHomeDistanceCategories() {
  const [selectedCategories, setSelectedCategories] = useState<Set<DistanceCategory>>(new Set());

  const toggleCategory = useCallback((category: DistanceCategory) => {
    setSelectedCategories((previous) => {
      const next = new Set(previous);

      if (category === 'TRACK') {
        // TRACK 탭은 배타적: 다른 카테고리와 함께 선택 불가
        if (next.has('TRACK')) {
          next.delete('TRACK');
        } else {
          next.clear();
          next.add('TRACK');
        }
        return next;
      }

      // 거리 탭 클릭 시 TRACK 탭 해제
      next.delete('TRACK');
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  return { selectedCategories, setSelectedCategories, toggleCategory };
}
