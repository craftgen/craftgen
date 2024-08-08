// Import Astral
import { launch } from "https://deno.land/x/astral/mod.ts";

interface requestPayload {
  code: string;
  context: object;
}

Deno.serve(async (req: Request) => {
  const { code, context }: requestPayload = await req.json();

  // Launch the browser
  // Connect to remote endpoint
  const browser = await launch({
    wsEndpoint: "ws://localhost:3000",
  });

  // Do stuff
  const page = await browser.newPage("https://craftgen.ai");
  const title = await page.evaluate(() => document.title);

  // Close connection
  await browser.close();
  // const browser = await launch();

  // // Open a new page
  // const page = await browser.newPage("https://deno.land");

  // Take a screenshot of the page and save that to disk
  // const screenshot = await page.screenshot();
  // Deno.writeFileSync("screenshot.png", screenshot);

  // Close the browser
  // await browser.close();

  return new Response(
    JSON.stringify({
      result: title,
      ok: true,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Connection: "keep-alive",
      },
    },
  );
});
