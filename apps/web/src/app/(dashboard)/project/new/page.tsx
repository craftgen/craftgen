import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { NewProjectForm } from "./new-project-form";

const NewProjectPage = () => {
  return (
    <div className="flex items-center justify-center flex-col p-4">
      <h1>New Project</h1>
      <Card className="max-w-3xl w-full">
        <CardHeader>
          <h2>Create New Project</h2>
        </CardHeader>
        <CardContent>
          <NewProjectForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewProjectPage;
