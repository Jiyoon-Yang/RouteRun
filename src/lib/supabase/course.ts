import { supabase } from "./client";

/** CourseList 테이블 행 타입 */
export interface CourseListItem {
  id: string;
  title: string;
  author: string;
  distance: number;
  images: string[];
  created_at: string;
}

/** 코스 수정 시 사용할 입력 (부분 업데이트) */
export interface UpdateCourseInput {
  title?: string;
  author?: string;
  distance?: number;
  images?: string[];
}

/**
 * 저장된 코스 목록을 조회합니다.
 */
export async function getCourseList(): Promise<CourseListItem[]> {
  const { data, error } = await supabase
    .from("CourseList")
    .select("id, title, author, distance, images, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`코스 목록 조회 실패: ${error.message}`);
  }

  return (data ?? []) as CourseListItem[];
}

/**
 * 코스를 삭제합니다. (CoursePoints → CourseList 순으로 삭제)
 */
export async function deleteCourse(courseId: string): Promise<void> {
  try {
    const { error: pointsError } = await supabase
      .from("CoursePoints")
      .delete()
      .eq("course_id", courseId);

    if (pointsError) {
      throw new Error(`CoursePoints 삭제 실패: ${pointsError.message}`);
    }

    const { error: courseError } = await supabase
      .from("CourseList")
      .delete()
      .eq("id", courseId);

    if (courseError) {
      throw new Error(`CourseList 삭제 실패: ${courseError.message}`);
    }
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("코스 삭제 중 알 수 없는 오류가 발생했습니다.");
  }
}

/**
 * 코스 메타 정보를 수정합니다.
 */
export async function updateCourse(
  courseId: string,
  input: UpdateCourseInput
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates.title = input.title;
  if (input.author !== undefined) updates.author = input.author;
  if (input.distance !== undefined) updates.distance = input.distance;
  if (input.images !== undefined) updates.images = input.images.slice(0, 5);

  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase
    .from("CourseList")
    .update(updates)
    .eq("id", courseId);

  if (error) {
    throw new Error(`코스 수정 실패: ${error.message}`);
  }
}
