import { openai } from "@ai-sdk/openai";
import { generateObject, generateText, tool } from "ai";
import { $ } from "bun";
import dedent from "ts-dedent";
import { z } from "zod";

import { handleChangets } from "./changeset";

async function main() {
  const result = await $`git status`.text();
  //  if nothing is staged then exit

  // check unstaged changes to string.
  if (result.includes("nothing to commit")) {
    console.log("nothing to commit");
    return;
  }

  const changes = await $`git diff --staged`.text();

  if (changes.length === 0) {
    console.log(changes);
    console.log("No changes to commit");
    return;
  }

  // first need to checkout the branch
  // figure out title for the branch
  const branchName = await generateText({
    model: openai("gpt-4o"),
    // maxTokens: 100,

    tools: {
      checkoutBranch: tool({
        description: "Checkout a git branch use it carefully only once.",
        parameters: z.object({
          branchName: z.string().describe("The name of the branch. "),
        }),
        execute: async ({ branchName }) => {
          console.log("CHECKOUT BRANCH", branchName);
          const res = await $`git checkout -b ${branchName}`.text();
          console.log("CHECKOUT BRANCH RES", res);
          return await $`git status`.text();
        },
      }),
    },
    toolChoice: "required",
    maxRetries: 3,
    messages: [
      {
        role: "user",
        content: dedent`
        Create a branch name for the following changes. 
        The branch name should be in the format of "user-name/my-branch-name".


        Current user: "necmttn"

        Create a branch name for the following changes:
        ${changes}
        ----
        `,
      },
    ],
  });

  // use autocommit to commit the changes to the branch
  const lastCommit = await $`oco -y`.text();
  console.log("LAST COMMIT", lastCommit);

  const doesHasChangeset = await $`pnpm changeset status --since=origin/main`;

  if (doesHasChangeset.stderr) {
    console.log("Theres changes not yet staged");
  }

  const res = await generateObject({
    model: openai("gpt-4o"),
    maxTokens: 1200,
    schema: z.object({
      pullrequest: z
        .object({
          title: z
            .string()
            .describe(
              "The title of the PR. do not include parantheses ( or ) ",
            ),
          description: z
            .string()
            .describe(
              "A description of the PR. do not include parantheses ( or ) in Markdown",
            ),
        })
        .describe("The Pull Request details"),
    }),
    messages: [
      {
        role: "user",
        content: dedent`
        Create a Pull Request for the following changes:
        ${lastCommit}
        ---
        Keep the description  concise and to the point. do not include commit details in the description.
        make it bullet point list.
        `,
      },
    ],
  });
  if (!res.object) {
    console.log("RES", res);
    return;
  }

  const pr = {
    title: res.object.pullrequest.title,
    body: res.object.pullrequest.description,
  };

  await handleChangets(pr.body);

  console.log("PR", pr);
  await $`git push`; //git push
  console.log("Running PR command");

  await Bun.write("../../prbody.md", pr.body);

  const PRRes =
    await $`gh pr create --repo "craftgen/craftgen" --title ${pr.title} -F prbody.md `;

  if (PRRes.stderr.length > 0) {
    console.log("ERROR", PRRes.stderr);
    return;
  }
  console.log("PR created successfully: ", PRRes.stdout);
}
main();
