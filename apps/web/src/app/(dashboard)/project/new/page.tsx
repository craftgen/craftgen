import { Card, CardContent, CardHeader } from "@craftgen/ui/components/card";

import { NewProjectForm } from "./new-project-form";

const NewProjectPage = () => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h1>New Project</h1>
      <Card className="w-full max-w-3xl">
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
