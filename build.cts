import { readFileSync } from "fs"
import { build } from "esbuild"
import packageJson from "./package.json"
import { load as loadYaml } from "js-yaml"

const providers = loadYaml(
  readFileSync("./providers.yml", { encoding: "utf-8" })
) as {
  matches: string[]
  id: string
}[]

const buildUserScript = async () => {
  await build({
    entryPoints: ["src/index.mts"],
    outfile: "dist/i-need-real-vote.user.js",
    bundle: true,
    minify: true,
    sourcemap: false,
    target: ["es2020"],
    format: "iife",
    banner: {
      js: `
      // ==UserScript==
      // @name         I need real vote
      // @namespace    i-need-real-vote@sevenc7c
      // @version      ${packageJson.version}
      // @description  ${packageJson.description}
      // @author       Nanashi.
      ${providers
        .flatMap((p) => p.matches)
        .map((m) => `// @match        ${m}`)
        .join("\n")}
      // @icon         https://raw.githubusercontent.com/sevenc-nanashi/i-need-real-vote/main/static/128.png
      // @updateURL    https://raw.githubusercontent.com/sevenc-nanashi/i-need-real-vote/release/i-need-real-vote.user.js
      // ==/UserScript==
      `
        .trim()
        .split("\n")
        .map((l) => l.trim())
        .join("\n"),
    },
  })
  console.log("Build complete: dist/i-need-real-vote.user.js")
}

;(async () => {
  console.log(`Building... (Version: ${packageJson.version})`)
  await buildUserScript()
})()
