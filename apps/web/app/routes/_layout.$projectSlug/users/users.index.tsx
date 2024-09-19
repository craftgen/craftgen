import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/$projectSlug/users/users/')({
  component: UsersIndexComponent,
})

function UsersIndexComponent() {
  return <div>Select a user.</div>
}
