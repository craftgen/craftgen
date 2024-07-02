---
"@craftgen/ui": patch
---

Refactored background selection in workflow-list.tsx to use a hash-based method. Fixed commit command in changeset.ts to amend the previous commit without editing the message. Added comments and checks for unstaged changes and empty diffs in auto-pr script. Added new 'pr' task configuration to turbo.json.
