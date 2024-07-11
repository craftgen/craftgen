# @craftgen/desktop

## 0.0.17

### Patch Changes

- 687b6d7: - Upgrade tauri-action from v0.5.6 to v0.5.8
  - Add micro-agent to deno.enablePaths
  - Add new sidecar command for deno
  - Fix incorrect URL scheme in CORS header
  - Add module code with tests for Deno worker
  - Add new route for package page
  - Create new package page with run test button
  - Add package link in dashboard layout
  - Upgrade edge-runtime from v1.48.0 to v1.54.9
  - Add electric service configuration
  - Correct tauri URL scheme in CORS headers
  - Refactor inline module code to include tests
  - Handle GET requests by creating a worker without module code
  - Add packageTable schema with unique constraint on slug
  - Add deno.json configuration file with dev task
  - Add meanPizzasSold function with test in main index file
  - Add new micro-agent module with state management and tools
  - Remove redundant console logs and comments in auto-pr script
- 23f4ce1: bump the trpc version
- Updated dependencies [687b6d7]
- Updated dependencies [23f4ce1]
  - @craftgen/db@0.1.1
  - @craftgen/core@0.1.2
  - @craftgen/ui@1.0.4
  - @craftgen/api@0.1.2
  - @craftgen/composer@1.0.5

## 0.0.16

### Patch Changes

- 3d35c52: - Removed outdated comment in MyRouterContext interface in routes/\_\_root.tsx
  - Ensured code clarity and maintainability

## 0.0.15

### Patch Changes

- 30ef396: - Updated release.yml to specify branch ref to main in checkout action
  - Cleaned up main.tsx by removing redundant comments

## 0.0.14

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

- 1123486: Add edge runtime indicator
- 2090110:
- Updated dependencies [7f1fb71]
- Updated dependencies [1123486]
- Updated dependencies [3559148]
- Updated dependencies [60fdb88]
  - @craftgen/ui@1.0.3
  - @craftgen/composer@1.0.4
  - @craftgen/core@0.1.1

## 0.0.13

### Patch Changes

- c999acc: prevent double render on composer
- Updated dependencies [c999acc]
  - @craftgen/composer@1.0.3

## 0.0.12

### Patch Changes

- 9d016a4: - Fix playground size
  - Prevent backspace navigating in desktop
- b2a663e: Handle not found pages in rsc update layout component
- Updated dependencies [9d016a4]
- Updated dependencies [b2a663e]
  - @craftgen/composer@1.0.2
  - @craftgen/ui@1.0.2

## 0.0.11

### Patch Changes

- 465c2e6: Add Login page for desktop version
- Updated dependencies [465c2e6]
  - @craftgen/composer@1.0.1
  - @craftgen/ui@1.0.1
  - @craftgen/api@0.1.1
