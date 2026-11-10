import type { SearchStats } from "@/commons/types/admin"
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
