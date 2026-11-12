import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // 레포 루트에도 package-lock.json이 있어 루트를 상위 폴더로 잡으면 사용자 앱 middleware.ts까지 빌드한다.
  turbopack: { root: import.meta.dirname },
  images: {
    remotePatterns: [
      // 사용자 앱과 같은 Supabase Storage 공개 버킷(course_images)
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // shortcut: 시안 목데이터 이미지(이미지 검수·유저 관리), 7단계에서 목데이터와 같이 지운다
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
}

export default nextConfig
