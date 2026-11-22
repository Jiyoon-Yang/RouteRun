// 성능 기준선 측정: next build → next start → Lighthouse(고정 조건) 3회 중앙값을 마크다운 표로 출력한다.
// 사용: `npm run perf` (결과를 docs/perf/baseline.md 표와 비교). 운영 DB를 로그인 없이 읽기만 한다.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 3100;
const RUNS = 3;
const LIGHTHOUSE = 'lighthouse@13.6.0';
// 모바일, CPU 4배 감속 + Fast 4G 근사(RTT 60ms, 9Mbps). 비교 가능하도록 바꾸지 않는다.
const THROTTLING = { cpuSlowdownMultiplier: 4, rttMs: 60, throughputKbps: 9000 };
// 코스 상세는 사이트맵의 공개 코스 하나로 고정. 삭제·숨김되면 다른 공개 코스 id로 바꾸고 baseline도 다시 잰다.
const PAGES = [
  { name: '홈', path: '/', route: '/' },
  { name: '코스 상세', path: '/courses/7980cd29-488b-4d1c-bf15-694c7d1cc573', route: '/courses/[id]' },
];

const kib = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

function run(cmd, args) {
  const result = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} 실패\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}

// `├ ƒ /courses/[id]   4.99 kB   204 kB` → { '/courses/[id]': '204 kB' }
function firstLoadJs(buildOutput) {
  const table = {};
  for (const line of buildOutput.split('\n')) {
    const match = line.match(/^[┌├└]\s+\S\s+(\/\S*)\s+[\d.]+ k?B\s+([\d.]+ k?B)/);
    if (match) table[match[1]] = match[2];
  }
  return table;
}

function measure(url, outDir, index) {
  const out = path.join(outDir, `lh-${index}.json`);
  run('npx', [
    '-y',
    LIGHTHOUSE,
    url,
    '--only-categories=performance',
    '--form-factor=mobile',
    '--throttling-method=simulate',
    ...Object.entries(THROTTLING).map(([key, value]) => `--throttling.${key}=${value}`),
    '--chrome-flags=--headless=new',
    '--output=json',
    `--output-path=${out}`,
    '--quiet',
  ]);
  const { audits, categories } = JSON.parse(fs.readFileSync(out, 'utf8'));
  const requests = audits['network-requests'].details.items;
  const isDataApi = (req) =>
    (req.url.includes('.supabase.co/rest/v1/') || req.url.includes('apis.openapi.sk.com/tmap/')) &&
    ['Fetch', 'XHR'].includes(req.resourceType);
  const thirdParty = audits['third-parties-insight'].details.items
    .filter((row) => row.entity !== 'supabase.co')
    .reduce((sum, row) => sum + row.transferSize, 0);
  const domTotal = audits['dom-size-insight'].details.items.find(
    (row) => row.statistic === 'Total elements',
  );
  return {
    score: Math.round(categories.performance.score * 100),
    lcp: audits['largest-contentful-paint'].numericValue,
    tbt: audits['total-blocking-time'].numericValue,
    total: audits['total-byte-weight'].numericValue,
    thirdParty,
    dataApi: requests.filter(isDataApi).reduce((sum, req) => sum + req.transferSize, 0),
    dom: domTotal?.value?.value ?? NaN,
  };
}

async function waitForServer(url) {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // 아직 기동 중
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`${url} 서버가 60초 안에 뜨지 않았다`);
}

async function main() {
  console.info('next build ...');
  const builds = firstLoadJs(run('npx', ['next', 'build']));
  const server = spawn('npx', ['next', 'start', '-p', String(PORT)], { stdio: 'ignore', detached: true });
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-'));
  try {
    await waitForServer(`http://localhost:${PORT}/robots.txt`);
    const rows = [];
    for (const page of PAGES) {
      const runs = [];
      for (let i = 0; i < RUNS; i++) {
        console.info(`${page.name} ${i + 1}/${RUNS} ...`);
        runs.push(measure(`http://localhost:${PORT}${page.path}`, outDir, `${rows.length}-${i}`));
      }
      const pick = (key) => median(runs.map((r) => r[key]));
      rows.push(
        `| ${page.name} | ${pick('score')} | ${(pick('lcp') / 1000).toFixed(2)} s | ${Math.round(pick('tbt'))} ms | ` +
          `${builds[page.route] ?? '?'} | ${kib(pick('total'))} | ${kib(pick('thirdParty'))} | ${kib(pick('dataApi'))} | ${pick('dom')} |`,
      );
    }
    const sha = run('git', ['rev-parse', '--short', 'HEAD']).trim();
    console.info(
      [
        '',
        `측정: ${new Date().toISOString().slice(0, 10)} · ${sha} · ${LIGHTHOUSE} · 모바일 · CPU ${THROTTLING.cpuSlowdownMultiplier}x · RTT ${THROTTLING.rttMs}ms · ${THROTTLING.throughputKbps / 1000}Mbps · ${RUNS}회 중앙값`,
        '',
        '| 페이지 | 점수 | LCP | TBT | First Load JS | 전체 전송 | 외부(TMap 등) 전송 | 지도 데이터 API | DOM 노드 |',
        '|---|---|---|---|---|---|---|---|---|',
        ...rows,
      ].join('\n'),
    );
  } finally {
    process.kill(-server.pid);
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
