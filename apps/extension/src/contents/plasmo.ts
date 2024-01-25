import type { PlasmoCSConfig } from "plasmo"

import { relayMessage } from "@plasmohq/messaging"

export const config: PlasmoCSConfig = {
  matches: [
    "https://www.craftgen.ai/*",
    "http://localhost:3000/*",
    "https://craftgen.ai/*"
  ]
}

window.addEventListener("load", () => {
  console.log("SEOCRAFT content script loaded")
})

relayMessage({
  name: "workflow-execute"
})
