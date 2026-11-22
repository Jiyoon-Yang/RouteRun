import { defineConfig, devices } from '@playwright/test';

// 핵심 흐름 스모크(`npm run e2e`). 운영 DB를 읽기 때문에 CI가 아니라 로컬에서 돌린다.
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  reporter: 'list',
  use: {
    ...devices['Pixel 7'],
    baseURL: 'http://localhost:3200',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx next start -p 3200',
    url: 'http://localhost:3200/robots.txt',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
