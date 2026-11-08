import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // 레포 루트에도 package-lock.json이 있어 루트를 상위 폴더로 잡으면 사용자 앱 middleware.ts까지 빌드한다.
  turbopack: { root: import.meta.dirname },
  images: {
    // shortcut: 시안 목데이터 이미지. 실제 연결 시 Supabase Storage 호스트로 교체.
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
}

export default nextConfig
