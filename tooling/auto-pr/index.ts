import { openai } from "@ai-sdk/openai";
import { generateObject, generateText, tool } from "ai";
import { $ } from "bun";
import dedent from "ts-dedent";
import { z } from "zod";

import { handleChangets } from "./changeset";

async function main() {
  const result = await $`git status`.text();
  // check unstaged changes to string.
  if (result.includes("nothing to commit")) {
    console.log("nothing to commit");
    return;
  }

  const changes = await $`git diff --staged`.text();

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
  console.log("BRANCH NAME", branchName);

  // checkout to the branhc
  // console.log("Checking out to branch", branchName);
  // await $`git checkout -b ${branchName}`;

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
  $`gp`; //git push
  $`echo -e "${pr.body}" > msg`; // hack for the new lines.
  $`PR_BODY=${pr.body} gh pr create --repo "craftgen/craftgen" --title "${pr.title}" --body $PR_BODY `;
}

main();
