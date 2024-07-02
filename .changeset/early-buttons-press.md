---
"@craftgen/ui": patch
---

- Add prbody.md to .gitignore
- Refactor random background selection to use hash-based function for consistency
- Amend commit instead of creating a new one in changeset.ts
- Add comments and handle case with no staged changes in index.ts
- Create PR using GitHub CLI and save PR body to file in index.ts
- Add PR task configuration in turbo.json
