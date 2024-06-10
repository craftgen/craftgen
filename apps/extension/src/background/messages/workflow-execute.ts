import { createHeadlessEditor } from "@craftgen/core/src"

import type { PlasmoMessaging } from "@plasmohq/messaging"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  // await new Promise((resolve) => setTimeout(resolve, 6000))
  const di = createHeadlessEditor({
    nodes: [],
    edges: []
  })

  console.log(di)

  res.send({
    req: `${req.body.name} ${req.body.count}`
  })
}

export default handler
