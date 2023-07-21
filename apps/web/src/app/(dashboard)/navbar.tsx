import { ModeToggle } from "@/components/theme-toggle"
import { Session } from "@supabase/supabase-js"

export const Navbar: React.FC<{session: Session}> = () => {
  return (
    <div className="">
      <ModeToggle />
    </div>
  )
}