import { notFound } from 'next/navigation';

import CoursesWireframe from '@/components/courses-detail';
import { fetchCourseDetail } from '@/services/course/courseDetailService';

interface CourseDetailPageProps {
  params: { id: string };
}

export default async function CoursesPage({ params }: CourseDetailPageProps) {
  const detail = await fetchCourseDetail(params.id);
  if (!detail) notFound();

  return (
    <CoursesWireframe
      course={detail.course}
      authorNickname={detail.authorNickname}
      location={detail.location}
    />
  );
}
