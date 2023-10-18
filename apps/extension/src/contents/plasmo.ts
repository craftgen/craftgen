import type { PlasmoCSConfig } from "plasmo"

import { relayMessage } from "@plasmohq/messaging"

export const config: PlasmoCSConfig = {
  matches: [
    "https://www.seocraft.ai/*",
    "http://localhost:3000/*",
    "https://seocraft.ai/*"
  ]
}

window.addEventListener("load", () => {
  console.log("SEOCRAFT content script loaded")
})

relayMessage({
  name: "workflow-execute"
})
