import escapeStringRegexp from "escape-string-regexp"
import packageJson from "../package.json"
import AsyncLock from "async-lock"

export abstract class Provider {
  abstract name: string
  abstract matches: string[]
  lock = new AsyncLock()
  queue: Element[] = []

  init() {
    console.log(
      "" +
        "%c== I need real vote ======================================\n" +
        `  投票結果から「閲覧用」を無くした割合を表示する拡張機能\n` +
        `  %cVersion: %cv${packageJson.version}\n` +
        `  %cDeveloped by %cNanashi.\n` +
        `  %c${packageJson.homepage}\n` +
        "%c----------------------------------------------------------\n" +
        `Provider: ${this.name}\n`,
      "color: #dd2e44",
      "color: auto",
      "color: #dd2e44",
      "color: auto",
      "color: #48b0d5",
      "color: auto",
      "color: #dd2e44"
    )
    this.run()
  }

  matchesUrl(url: string) {
    for (const match of this.matches) {
      if (
        url.match(
          new RegExp(
            "^" + escapeStringRegexp(match).replace(/\\\*/g, ".*") + "$"
          )
        )
      ) {
        return true
      }
    }
  }

  processQueue() {
    this.lock.acquire("processQueue", async () => {
      const queue = this.queue
      this.queue = []
      for (const element of queue) {
        this.process(element)
      }
    })
  }

  abstract process(element: Element): void

  abstract run(): void
}

export const reCalculateRatios = (
  ratios: number[]
): { ratios: number[]; total: number } => {
  const total = ratios.reduce((a, b) => a + b, 0)
  if (total === 0) {
    return { ratios: ratios.map(() => 0), total }
  }
  return { ratios: ratios.map((r) => r / total), total }
}

export const watchKeywords: string[] = [
  "閲覧用",
  "結果を見る",
  "見るだけ",
  "結果だけ見る",
]
