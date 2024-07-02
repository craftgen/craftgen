import path from "path";
import { read } from "@changesets/config";
import { Config } from "@changesets/types";
import { getPackages, Packages } from "@manypkg/get-packages";
import { $, file } from "bun";

import { getVersionableChangedPackages } from "./versionablePackages";

$.cwd("../../");
async function getDiffForDirectory(directory: string): Promise<string> {
  try {
    const diff =
      await $`git diff --staged origin/main --minimal -- ${directory}`;
    return diff.stdout.toString();
  } catch (error) {
    console.error(`Error getting diff for directory ${directory}:`, error);
    return "";
  }
}

export async function handleChangets(changeDescription: string) {
  const changes = await $`pnpm changeset status --since=origin/main`;

  if (changes.stderr) {
    const packages = await getPackages(path.resolve("../../"));
    const p = {
      ...packages,
      root: packages.rootPackage,
    } as Packages;
    let config = await read(path.resolve("../../"), p);

    const s = await getVersionableChangedPackages(config, {
      cwd: "../../",
      ref: "origin/main",
    });
    // console.log("PACKAGES", s);
    const emptyChangesetPath = (await $`pnpm changeset --empty`.text())
      .split("🦋  info")[1]
      .trim();
    const changesetFile = Bun.file(emptyChangesetPath);
    const w = changesetFile.writer();

    w.write("---\n");
    for (const packageName of s) {
      const packageDiff = await getDiffForDirectory(packageName.dir);
      console.log(`Diff for ${packageName.dir}:`);
      console.log(packageDiff);
      // Bun.file(emptyChangesetPath)(packageDiff);
      w.write(`"${packageName.packageJson.name}": patch\n`);
      w.flush();
    }

    w.write("---\n");

    w.write(`\n`);
    w.write(`${changeDescription}\n`);

    w.end();

    await $`git add .`;
    await $`git commit --amend --no-edit"`;
  }
}
