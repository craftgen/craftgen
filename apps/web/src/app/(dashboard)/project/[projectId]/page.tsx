import { getProject, getSomething } from "./actions"

const ProjectPage = async ({params}: {
  params: {
    projectId: string
  }
}) => {
  const project = await getProject(params.projectId)
  const ss = await getSomething({siteUrl: project?.site!})
  console.log(ss)
  return (
    <div>
      <h1>project {project?.name}</h1>
      <pre><code>{JSON.stringify(ss, null, 2)}</code></pre>
    </div>
  )
}


export default ProjectPage