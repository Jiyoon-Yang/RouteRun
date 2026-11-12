import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // 레포 루트에도 package-lock.json이 있어 루트를 상위 폴더로 잡으면 사용자 앱 middleware.ts까지 빌드한다.
  turbopack: { root: import.meta.dirname },
  images: {
    remotePatterns: [
      // 사용자 앱과 같은 Supabase Storage 공개 버킷(course_images).
      // *.supabase.co로 열어 두면 다른 프로젝트 이미지도 우리 next/image 최적화로 변환되니 이 프로젝트 호스트만 연다.
      {
        protocol: "https",
        hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname,
        pathname: "/storage/v1/object/public/**",
      },
      // shortcut: 시안 목데이터 이미지(유저 관리), 7단계에서 목데이터와 같이 지운다
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
}

export default nextConfig
