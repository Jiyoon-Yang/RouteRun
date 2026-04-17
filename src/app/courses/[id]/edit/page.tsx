import CourseSubmit from '@/components/course-submit';

interface CourseEditPageProps {
  params: { id: string };
}

export default function CourseEditPage({ params }: CourseEditPageProps) {
  return <CourseSubmit mode="edit" courseId={params.id} />;
}
