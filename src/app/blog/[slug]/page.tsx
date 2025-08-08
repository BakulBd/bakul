import { gqlClient } from "@/lib/blog";
import { queries } from "@/lib/blog";
import { mdxToHtml } from "./util";
import PostContent from "../component";
import { PostResponse } from "../types";
import { Metadata } from "next";
import { generateOGImage } from "@/lib/blog/og";
import ModernNavbar from "@/components/layout/ModernNavbar";
import "./blog.css";

export async function generateStaticParams() {
  try {
    const host = process.env.HASHNODE_HOST || "bakul.hashnode.dev";
    const response = await gqlClient(queries.getPosts(host))();
    const posts = response as {
      data: { publication: { posts: { edges: { node: { slug: string } }[] } } };
    };
    return posts.data.publication.posts.edges.map((post) => ({
      slug: post.node.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const slug = (await params).slug;
  const host = process.env.HASHNODE_HOST || "bakul.hashnode.dev";
  const response = await gqlClient(queries.getPostBySlug(host))({
    slug,
  });
  const { data } = response as PostResponse;
  const post = data.publication.post;

  if (!post) {
    return {
      title: "Post Not Found",
      description: "The post you are looking for does not exist.",
    };
  }

  // Generate OG image if needed (currently placeholder)
  await generateOGImage({ post, outputPath: `public/og/${post.slug}.png` });

  const ogImage = post.coverImage?.url || `/og/${post.slug}.png`;

  return {
    title: post.title,
    description: post.brief,
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:3000"
    ),
    openGraph: {
      title: post.title,
      description: post.brief,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.brief,
      images: [ogImage],
    },
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const host = process.env.HASHNODE_HOST || "bakul.hashnode.dev";
  const response = await gqlClient(queries.getPostBySlug(host))({
    slug,
  });
  const { data } = response as PostResponse;
  const post = data.publication.post;

  if (!post || !post.content) {
    return (
      <>
        <ModernNavbar />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="w-full max-w-2xl mx-auto space-y-8">
              <h1 className="text-4xl font-bold mb-4 text-black dark:text-white">
                Post Not Found
              </h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                The post you&apos;re looking for doesn&apos;t exist.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const mdx = await mdxToHtml(post.content.markdown);

  return (
    <>
      <ModernNavbar />
      <PostContent post={post} mdx={mdx} />
    </>
  );
}
