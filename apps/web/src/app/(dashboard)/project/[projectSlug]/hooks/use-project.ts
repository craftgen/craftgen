import { useParams } from "next/navigation";
import useSWR from "swr";

import { getProject } from "../actions";

export const useProject = () => {
  const params = useParams();
  const projectSlug = params.projectSlug;
  const res = useSWR(`/api/projects/${projectSlug}`, () =>
    getProject(params.projectSlug as string),
  );
  return res;
};
