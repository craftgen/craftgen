import { ModeToggle } from "@/components/theme-toggle"
import { Session } from "@supabase/supabase-js"

export const Navbar: React.FC<{session: Session}> = () => {
  return (
    <div className="flex items-center justify-between w-full p-2">
      <h1>SEO craft</h1>
      <ModeToggle />
    </div>
  )
}