import { supabase } from "./client";

/* ============================================
 * 프론트엔드 호출 시 인자(Arguments) 구조
 * ============================================
 *
 * saveRunningCourse({
 *   // 코스 메인 정보 (CourseList)
 *   title: string;        // 코스 제목
 *   author: string;       // 작성자
 *   distance: number;     // 거리(km)
 *   images: string[];     // 이미지 URL 배열 (최대 5장, 초과 시 앞 5개만 저장)
 *
 *   // 코스 좌표 배열 (CoursePoints)
 *   points: Array<{
 *     latitude: number;   // 위도
 *     longitude: number; // 경도
 *     point_type?: "START" | "WAYPOINT" | "END";  // 선택, 미입력 시 순서로 자동 부여
 *   }>;
 * })
 *
 * 반환: { id: string } - 생성된 코스 ID (course_id)
 * 에러 시: throw Error
 */

/** 입력 좌표 한 개의 형태 */
export interface CoursePointInput {
  latitude: number;
  longitude: number;
  point_type?: "START" | "WAYPOINT" | "END";
}

/** saveRunningCourse 함수 인자 */
export interface SaveRunningCourseInput {
  title: string;
  author: string;
  distance: number;
  images: string[];
  points: CoursePointInput[];
}

/** saveRunningCourse 반환 타입 */
export interface SaveRunningCourseResult {
  id: string;
}

/** CoursePoints 테이블 insert용 행 형태 (id는 DB 자동 생성) */
interface CoursePointRow {
  course_id: string;
  point_type: string;
  latitude: number;
  longitude: number;
  sequence: number;
}

/**
 * 러닝 코스를 CourseList와 CoursePoints 테이블에 저장합니다.
 * 1. CourseList에 메인 정보 저장 → course_id 획득
 * 2. course_id로 CoursePoints에 좌표 일괄 저장 (sequence 1부터)
 */
export async function saveRunningCourse(
  input: SaveRunningCourseInput
): Promise<SaveRunningCourseResult> {
  try {
    // 1. 이미지 URL 최대 5장으로 제한
    const images = (input.images ?? []).slice(0, 5);

    // 2. CourseList에 메인 정보 저장
    const { data: courseData, error: courseError } = await supabase
      .from("CourseList")
      .insert({
        title: input.title,
        author: input.author,
        distance: input.distance,
        images,
      })
      .select("id")
      .single();

    if (courseError) {
      throw new Error(`CourseList 저장 실패: ${courseError.message}`);
    }

    if (!courseData?.id) {
      throw new Error("CourseList 저장 후 id를 받지 못했습니다.");
    }

    const courseId = courseData.id;

    // 3. points가 없으면 여기서 종료 (코스만 저장)
    if (!input.points || input.points.length === 0) {
      return { id: courseId };
    }

    // 4. CoursePoints용 행 배열 생성 (sequence 1부터, point_type 자동 부여)
    const pointRows: CoursePointRow[] = input.points.map((point, index) => {
      const sequence = index + 1;
      const isFirst = sequence === 1;
      const isLast = sequence === input.points!.length;

      let point_type: string = point.point_type ?? "WAYPOINT";
      if (!point.point_type) {
        point_type = isFirst ? "START" : isLast ? "END" : "WAYPOINT";
      }

      return {
        course_id: courseId,
        point_type,
        latitude: point.latitude,
        longitude: point.longitude,
        sequence,
      };
    });

    // 5. CoursePoints 일괄 저장 (Bulk Insert)
    const { error: pointsError } = await supabase
      .from("CoursePoints")
      .insert(pointRows);

    if (pointsError) {
      throw new Error(`CoursePoints 저장 실패: ${pointsError.message}`);
    }

    return { id: courseId };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("러닝 코스 저장 중 알 수 없는 오류가 발생했습니다.");
  }
}
