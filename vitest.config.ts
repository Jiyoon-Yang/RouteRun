import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { searchForWorkspaceRoot } from 'vite';
import { defineConfig } from 'vitest/config';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// Claude 워크트리는 node_modules가 메인 체크아웃 심볼릭 링크라, 실제 경로를 허용하지 않으면 브라우저 테스트가 setup-file을 못 불러온다
const nodeModules = path.join(dirname, 'node_modules');
const nodeModulesRealPath = fs.existsSync(nodeModules) ? fs.realpathSync(nodeModules) : nodeModules;

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  // allow를 지정하면 Vite 기본값이 대체되므로 기본값(workspace root)을 같이 넣는다
  server: { fs: { allow: [searchForWorkspaceRoot(dirname), nodeModulesRealPath] } },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        // 순수 로직 단위 테스트 (`npm test`)
        resolve: { alias: { '@': path.join(dirname, 'src') } },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
    ],
  },
});
