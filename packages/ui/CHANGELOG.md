# @craftgen/ui

## 1.0.4

### Patch Changes

- 23f4ce1: bump the trpc version
- Updated dependencies [23f4ce1]
  - @craftgen/core@0.1.2
  - @craftgen/api@0.1.2

## 1.0.3

### Patch Changes

- 7f1fb71: ### Changes Made

  - **index.ts**: Removed unnecessary blank line for code cleanliness.
  - **layout.tsx**: Added TODO comment to handle cookie removal on logout.
  - **login.tsx**: Refactored login component to a named export for better readability.
  - **icons.tsx**: Added `ChevronLeft` icon to the Icons export for use in components.

  ### Commit Details

  - **Commit Hash**: `7a143928`
  - **Branch**: `necmttn/refactor-and-todo-updates`
  - **Files Changed**: 4
  - **Insertions**: 19
  - **Deletions**: 9

- 3559148: - Add prbody.md to .gitignore
  - Refactor random background selection to use hash-based function for consistency
  - Amend commit instead of creating a new one in changeset.ts
  - Add comments and handle case with no staged changes in index.ts
  - Create PR using GitHub CLI and save PR body to file in index.ts
  - Add PR task configuration in turbo.json
- 60fdb88: - Add prbody.md to .gitignore
  - Refactor random background selection to use hash-based function
  - Fix commit command to amend the last commit without editing
  - Add comments and improve logic for handling no changes to commit
  - Add toolChoice parameter to branch name generation
  - Add pr task configuration to turbo.json
- Updated dependencies [1123486]
  - @craftgen/core@0.1.1

## 1.0.2

### Patch Changes

- 9d016a4: - Fix playground size
  - Prevent backspace navigating in desktop
- b2a663e: Handle not found pages in rsc update layout component

## 1.0.1

### Patch Changes

- 465c2e6: Add Login page for desktop version
- Updated dependencies [465c2e6]
  - @craftgen/api@0.1.1
