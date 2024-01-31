import { Provider, reCalculateRatios, watchKeywords } from "./common.mjs"

export class YoutubeProvider extends Provider {
  name = "youtube"
  matches = ["https://youtube.com/*", "https://www.youtube.com/*"]

  run(): void {
    this.main()
  }

  main(): void {
    const mainElement = document.querySelector("ytd-app")
    if (!mainElement) {
      setTimeout(this.main, 100)
      return
    }

    const replacer = new MutationObserver(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve))
      const unprocessed = mainElement.querySelectorAll(
        "ytd-backstage-poll-renderer:not([data-inrv-processed])"
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
    const voteElements = Array.from(
      element.querySelectorAll(
        ".choice-info.style-scope.ytd-backstage-poll-renderer"
      )
    )
    if (voteElements.length === 0) {
      console.log("Skipped: No vote elements")
      return
    }
    const baseVoteInfos: (
      | {
          ratio: number
          text: string
          baseElement: HTMLDivElement
          ratioBarDivs: HTMLDivElement[]
          ratioSpan: HTMLSpanElement
          textSpan: HTMLSpanElement
        }
      | undefined
    )[] = voteElements.map((e) => {
      const ratioSpan = e.querySelector<HTMLSpanElement>(
        "yt-formatted-string.vote-percentage"
      )
      const textSpan = e.querySelector<HTMLSpanElement>(
        "yt-formatted-string.choice-text"
      )
      if (!ratioSpan || !textSpan) return
      const ratioBarDivs = [
        e.querySelector<HTMLDivElement>(".progress-bar"),
        e.querySelector<HTMLDivElement>(".vote-percentage-area"),
      ].filter((e) => e) as HTMLDivElement[]
      const ratio = ratioSpan.textContent?.trim().replace("%", "")
      const text = textSpan.textContent?.trim()
      if (!ratio || !text) return
      return {
        ratio: parseFloat(ratio) / 100,
        text,
        baseElement: e as HTMLDivElement,
        ratioBarDivs,
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
      invalidVote.ratioSpan.textContent = `(${(invalidVote.ratio * 100).toFixed()}%)`

      for (const ratioBarDiv of invalidVote.ratioBarDivs) {
        ratioBarDiv.style.display = "none"
      }
    }
    for (const [i, validVote] of Object.entries(validVotes)) {
      const ratio = reCalculated.ratios[parseInt(i)]
      validVote.ratioSpan.textContent = `${(ratio * 100).toFixed()}% (${(validVote.ratio * 100).toFixed()}%)`
      for (const ratioBarDiv of validVote.ratioBarDivs) {
        ratioBarDiv.style.width = `${ratio * 100}%`
      }
    }
  }
}
