import type { Metadata, ResolvingMetadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { graphql } from "gql.tada";

import { client } from "@/lib/urql";

const PostQuery = graphql(`
  query Post($id: ID!) {
    post(id: $id, idType: SLUG) {
      id
      title
      content
      featuredImage {
        node {
          sourceUrl
          srcSet
          altText
        }
      }
      categories {
        edges {
          node {
            name
          }
        }
      }
      tags {
        edges {
          node {
            name
          }
        }
      }
      author {
        node {
          name
          url
          avatar {
            url
          }
          username
        }
      }
      seo {
        canonical
        title
        metaDesc
        focuskw
        metaKeywords
        metaRobotsNoindex
        metaRobotsNofollow
        opengraphAuthor
        opengraphDescription
        opengraphTitle
        opengraphDescription
        opengraphImage {
          altText
          sourceUrl
          srcSet
        }
        opengraphUrl
        opengraphSiteName
        opengraphPublishedTime
        opengraphModifiedTime
        opengraphType
        twitterTitle
        twitterDescription
        twitterImage {
          altText
          sourceUrl
          srcSet
        }
        breadcrumbs {
          url
          text
        }
        cornerstone
        schema {
          pageType
          articleType
          raw
        }
        readingTime
        fullHead
      }
    }
  }
`);

type Props = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // fetch data
  const { data } = await client.query(PostQuery, {
    id: params.slug as unknown as string,
  });
  const seo = data?.post?.seo;
  return {
    title: seo?.title,
    description: seo?.metaDesc,
    keywords: seo?.metaKeywords,
    robots: {
      index: !seo?.metaRobotsNoindex,
      follow: !seo?.metaRobotsNofollow,
    },
    openGraph: {
      title: seo?.opengraphTitle!,
      description: seo?.opengraphDescription!,
      url: seo?.opengraphUrl!,
      type: "article",
      images: [seo?.opengraphImage?.sourceUrl!],
      publishedTime: seo?.opengraphPublishedTime!,
      modifiedTime: seo?.opengraphModifiedTime!,
    },
  };
}

const BlogPage = async ({ params }: { params: { slug: string[] } }) => {
  const post = await client.query(
    PostQuery,
    {
      id: params.slug as unknown as string,
    },
    { requestPolicy: "network-only" },
  );
  const author = post.data.post.author.node;
  return (
    <figure>
      <section className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <img
          srcSet={post.data?.post?.featuredImage?.node.srcSet}
          alt={`Cover Image for ${post.data?.post.title}`}
          className={"w-full rounded-md object-cover shadow-sm "}
        />
        <div className=" mx-auto mt-10 max-w-xl lg:max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {post.data.post.title}
          </h1>
          <div className="mb-12 mt-6 flex items-center justify-between">
            <Link href={author.url!}>
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                  <Image
                    className="inline-block h-10 w-10 rounded-full object-cover"
                    src={author.avatar?.url}
                    width={100}
                    height={100}
                    alt={author.name}
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <p className="font-semibold text-gray-800 transition-colors duration-300 hover:text-primary dark:text-gray-200 dark:hover:text-primary sm:text-lg">
                    {author.name}
                  </p>
                  {/* <p className="truncate text-sm text-gray-600 dark:text-gray-800">
              {author.title}
            </p> */}
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {post.data?.post?.seo?.readingTime} min read
                  </p>
                </div>
              </div>
            </Link>
          </div>
          <article
            className="prose prose-gray max-w-none dark:prose-invert prose-blockquote:border-l-2 prose-blockquote:border-gray-900 prose-blockquote:bg-gray-100 prose-blockquote:px-8 prose-blockquote:py-3 prose-blockquote:text-lg prose-blockquote:font-medium prose-blockquote:not-italic prose-blockquote:leading-8 prose-blockquote:text-primary lg:col-span-8 prose-blockquote:lg:text-xl prose-blockquote:lg:leading-9"
            dangerouslySetInnerHTML={{ __html: post.data?.post?.content }}
          />
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: post.data?.post?.seo?.schema?.raw,
        }}
      />
    </figure>
  );
};

export default BlogPage;
