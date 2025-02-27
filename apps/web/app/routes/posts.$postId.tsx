import {
  createFileRoute,
  ErrorComponent,
  Link,
  type ErrorComponentProps,
} from "@tanstack/react-router";

import { NotFound } from "~/components/NotFound";
import { fetchPost } from "../utils/posts";

export const Route = createFileRoute("/posts/$postId")({
  loader: async ({ params: { postId }, context }) => {
    return context.client.platform.craft.module.featured.fetch({
      category: "all",
    });
    return {
      ...(await fetchPost(postId)),
      featuredWorkflows: post,
    };
  },

  errorComponent: PostErrorComponent as any,
  component: PostComponent,
  notFoundComponent: () => {
    return <NotFound>Post not found</NotFound>;
  },
});

export function PostErrorComponent({ error }: ErrorComponentProps) {
  return <ErrorComponent error={error} />;
}

function PostComponent() {
  const post = Route.useLoaderData();

  console.log("@@@", post);

  return (
    <div className="space-y-2">
      <h4 className="text-xl font-bold underline">{post.title}</h4>
      <div className="text-sm">{post.body}</div>
      <Link
        to="/posts/$postId/deep"
        params={{
          postId: post.id,
        }}
        activeProps={{ className: "text-black font-bold" }}
        className="block py-1 text-blue-800 hover:text-blue-600"
      >
        Deep View
      </Link>
    </div>
  );
}
