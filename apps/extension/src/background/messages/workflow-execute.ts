import type { PlasmoMessaging } from "@plasmohq/messaging"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  // await new Promise((resolve) => setTimeout(resolve, 6000))
  // const di = createHeadlessEditor({
  //   nodes: [],
  //   edges: []
  // })

  res.send({
    req: `${req.body.name} ${req.body.count}`
  })
}

export default handler
