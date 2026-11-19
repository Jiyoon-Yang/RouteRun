import type { SearchStats, SignupSource } from "@/commons/types/admin"
import { getGoogleAccessToken } from "@/lib/google"

// 서비스 계정에는 두 콘솔 모두 읽기 권한만 준다.
const SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/analytics.readonly",
]

const DAY = 24 * 60 * 60 * 1000

type GscRow = {
  keys?: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

type Ga4Row = {
  dimensionValues: { value: string }[]
  metricValues: { value: string }[]
}

const isoDate = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * DAY).toISOString().slice(0, 10)

async function post<T>(url: string, token: string, body: object): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`${url} ${response.status} ${await response.text()}`)
  }

  return response.json()
}

/** 최근 28일 Search Console 성과와 GA4 검색엔진별 자연 검색 방문. */
export async function fetchSearchStats(
  siteUrl: string,
  propertyId: string
): Promise<SearchStats> {
  const token = await getGoogleAccessToken(SCOPES)
  const range = { startDate: isoDate(28), endDate: isoDate(1) }
  const searchConsole = async (body: object) =>
    (
      await post<{ rows?: GscRow[] }>(
        `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
        token,
        { ...range, ...body }
      )
    ).rows ?? []

  const [totals, daily, queries, report] = await Promise.all([
    searchConsole({}),
    searchConsole({ dimensions: ["date"] }),
    searchConsole({ dimensions: ["query"], rowLimit: 10 }),
    post<{ rows?: Ga4Row[] }>(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      token,
      {
        dateRanges: [range],
        dimensions: [{ name: "sessionSource" }],
        metrics: [{ name: "sessions" }],
        dimensionFilter: {
          filter: {
            fieldName: "sessionMedium",
            stringFilter: { value: "organic" },
          },
        },
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      }
    ),
  ])

  const { clicks, impressions, ctr, position } = totals[0] ?? {
    clicks: 0,
    impressions: 0,
    ctr: 0,
    position: 0,
  }

  return {
    totals: { clicks, impressions, ctr, position },
    daily: daily.map((row) => ({
      date: row.keys![0],
      clicks: row.clicks,
      impressions: row.impressions,
    })),
    queries: queries.map((row) => ({
      query: row.keys![0],
      clicks: row.clicks,
      impressions: row.impressions,
      position: row.position,
    })),
    organicSessions: (report.rows ?? []).map((row) => ({
      source: row.dimensionValues[0].value,
      sessions: Number(row.metricValues[0].value),
    })),
  }
}

/**
 * 최근 30일 GA4 `sign_up` 이벤트(메인 앱이 가입 직후 보냄)를 처음 들어온 소스별로 센다.
 * `method`는 GA4 기본 측정기준이라 GA 관리 화면에서 따로 등록하지 않아도 된다.
 */
export async function fetchSignupSources(
  propertyId: string
): Promise<SignupSource[]> {
  const token = await getGoogleAccessToken(SCOPES)
  const report = await post<{ rows?: Ga4Row[] }>(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    token,
    {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "firstUserSource" }, { name: "method" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: { fieldName: "eventName", stringFilter: { value: "sign_up" } },
      },
    }
  )

  // 행이 소스 × 방식이라 소스별로 합친 뒤 많은 순 7개만
  const bySource = new Map<string, SignupSource>()
  for (const row of report.rows ?? []) {
    const [source, method] = row.dimensionValues.map((value) => value.value)
    if (method !== "google" && method !== "guest") continue

    const entry = bySource.get(source) ?? { source, google: 0, guest: 0 }
    entry[method] += Number(row.metricValues[0].value)
    bySource.set(source, entry)
  }

  return [...bySource.values()]
    .sort((a, b) => b.google + b.guest - (a.google + a.guest))
    .slice(0, 7)
}
