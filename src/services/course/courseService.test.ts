import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as courseRepository from '@/repositories/course/course.repository';
import { removeCourseImages } from '@/repositories/storage.repository';

import { deleteCourse, updateCourse } from './courseService';

import type { SupabaseClient } from '@supabase/supabase-js';

vi.mock('@/repositories/course/course.repository', () => ({
  getRouteImageUrls: vi.fn(),
  updateCourse: vi.fn(),
  deleteRoute: vi.fn(),
}));
vi.mock('@/repositories/storage.repository', () => ({ removeCourseImages: vi.fn() }));

const supabase = {} as SupabaseClient;
const input = { courseId: 'c1', title: 't', description: null, image_urls: ['keep.jpg'] };

describe('courseService 이미지 정리', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(courseRepository.getRouteImageUrls).mockResolvedValue({
      data: ['keep.jpg', 'dropped.jpg'],
      error: null,
    });
  });

  it('수정 성공 시 빠진 이미지만 지운다', async () => {
    vi.mocked(courseRepository.updateCourse).mockResolvedValue({ data: {} as never, error: null });
    await updateCourse(supabase, input, 'u1');
    expect(removeCourseImages).toHaveBeenCalledWith(['dropped.jpg'], 'u1');
  });

  it('수정 실패 시 아무것도 지우지 않는다', async () => {
    vi.mocked(courseRepository.updateCourse).mockResolvedValue({
      data: null,
      error: new Error('fail'),
    });
    await updateCourse(supabase, input, 'u1');
    expect(removeCourseImages).not.toHaveBeenCalled();
  });

  it('삭제 시 삭제된 행의 이미지를 지운다', async () => {
    vi.mocked(courseRepository.deleteRoute).mockResolvedValue(['a.jpg']);
    await deleteCourse('c1', 'u1');
    expect(removeCourseImages).toHaveBeenCalledWith(['a.jpg'], 'u1');
  });
});
