import { Provider } from "./common.mjs"
import { TwitterProvider } from "./twitter.mjs"
import { YoutubeProvider } from "./youtube.mjs"

const providers: Provider[] = [new TwitterProvider(), new YoutubeProvider()]
;(() => {
  for (const provider of providers) {
    if (provider.matchesUrl(location.href)) {
      provider.init()
      return
    }
  }

  console.error("No provider matched")
})()
