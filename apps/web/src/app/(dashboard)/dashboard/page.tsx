import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ProjectList } from "./project-list";

const DashboardPage = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      <div>
        <div className="flex justify-between items-center">
          <h2>Projects</h2>
          <Link href="/project/new">
            <Button>Create New Project.</Button>
          </Link>
        </div>
        <div>
          <ProjectList />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
