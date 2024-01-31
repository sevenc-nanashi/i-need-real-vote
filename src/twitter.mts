import { Provider, reCalculateRatios, watchKeywords } from "./common.mjs"

export class TwitterProvider extends Provider {
  name = "twitter"
  matches = [
    "https://twitter.com/*",
    "https://www.twitter.com/*",
    "https://x.com/*",
  ]

  run(): void {
    this.main()
  }

  main(): void {
    const mainElement = document.querySelector("main[role=main]")
    if (!mainElement) {
      setTimeout(this.main, 100)
      return
    }

    const replacer = new MutationObserver(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve))
      const unprocessed = mainElement.querySelectorAll(
        'div[data-testid="cardPoll"]:not([data-inrv-processed])'
      )
      this.queue.push(...Array.from(unprocessed))
      this.processQueue()
    })

    replacer.observe(mainElement, {
      childList: true,
      subtree: true,
    })
  }

  process(element: Element): void {
    console.log("Processing: ", element)
    const voteElements = Array.from(element.querySelectorAll("ul > li > div"))
    if (voteElements.length === 0) {
      console.log("Skipped: No vote elements")
      return
    }
    const baseVoteInfos: (
      | {
          ratio: number
          text: string
          baseElement: HTMLDivElement
          ratioBarDiv: HTMLDivElement
          ratioSpan: HTMLSpanElement
          textSpan: HTMLSpanElement
        }
      | undefined
    )[] = voteElements.map((e) => {
      const ratioSpan = e.querySelector<HTMLSpanElement>("div.r-f727ji span")
      const textSpan = e.querySelector<HTMLSpanElement>(
        "div.r-1wbh5a2 span span"
      )
      if (!ratioSpan || !textSpan) return
      const ratioBarDiv = Array.from(e.childNodes).find(
        (n) => n instanceof HTMLDivElement && n.style.width
      ) as HTMLDivElement
      const ratio = ratioSpan.textContent?.trim().replace("%", "")
      const text = textSpan.textContent?.trim()
      if (!ratio || !text) return
      return {
        ratio: parseFloat(ratio) / 100,
        text,
        baseElement: e as HTMLDivElement,
        ratioBarDiv,
        ratioSpan,
        textSpan,
      }
    })
    if (!baseVoteInfos.every((i) => i)) {
      console.log("Skipped: Invalid vote elements")
      return
    }
    element.setAttribute("data-inrv-processed", "")
    const baseVotes = baseVoteInfos.map((i) => i!)
    const validVotes = baseVotes.filter(
      (v) => !watchKeywords.some((k) => v.text.includes(k))
    )
    const invalidVotes = baseVotes.filter((v) =>
      watchKeywords.some((k) => v.text.includes(k))
    )
    if (invalidVotes.length === 0) {
      console.log("Skipped: No invalid votes")
      return
    }
    if (validVotes.length === 0) {
      console.log("Skipped: No valid votes")
      return
    }

    const validVoteRatios = validVotes.map((v) => v.ratio)
    const reCalculated = reCalculateRatios(validVoteRatios)
    for (const invalidVote of invalidVotes) {
      invalidVote.baseElement.style.opacity = "0.5"
      invalidVote.ratioSpan.textContent = `(${(invalidVote.ratio * 100).toFixed(1)}%)`
      invalidVote.ratioBarDiv.style.display = "none"
    }
    for (const [i, validVote] of Object.entries(validVotes)) {
      const ratio = reCalculated.ratios[parseInt(i)]
      validVote.ratioSpan.textContent = `${(ratio * 100).toFixed(1)}% (${(validVote.ratio * 100).toFixed(1)}%)`
      validVote.ratioBarDiv.style.width = `${ratio * 100}%`
    }
  }
}
