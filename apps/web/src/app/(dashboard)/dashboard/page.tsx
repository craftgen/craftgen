import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ProjectList } from "./project-list";

const DashboardPage = () => {
  return (
    <div className="flex flex-col w-full items-center">
      <div className="w-full max-w-5xl p-4">
        <div className="flex justify-between items-center ">
          <h2>Projects</h2>
          <Link href="/project/new">
            <Button>Create New Project.</Button>
          </Link>
        </div>
        <div className="py-4">
          <ProjectList />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
