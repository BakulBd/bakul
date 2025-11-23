// GraphQL Client for Hashnode
type ClientOptions = {
  timeoutMs?: number;
};

export function gqlClient(query: string, options?: ClientOptions) {
  const timeoutMs = options?.timeoutMs ?? 8000;

  return async (variables?: Record<string, unknown>): Promise<unknown> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('https://gql.hashnode.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
        next: {
          revalidate: 3600, // Revalidate every hour
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.errors) {
        throw new Error(
          `GraphQL error: ${data.errors.map((e: { message: string }) => e.message).join(', ')}`,
        );
      }

      return data;
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') {
        throw new Error('Hashnode request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  };
}

// GraphQL Queries
export const queries = {
  getPosts: (host: string) => `
    query GetPosts {
      publication(host: "${host}") {
        isTeam
        title
        posts(first: 20) {
          edges {
            node {
              id
              title
              brief
              slug
              url
              publishedAt
              updatedAt
              readTimeInMinutes
              views
              coverImage {
                url
              }
              author {
                name
              }
              subtitle
            }
          }
        }
      }
    }
  `,

  getPostBySlug: (host: string) => `
    query GetPostBySlug($slug: String!) {
      publication(host: "${host}") {
        post(slug: $slug) {
          id
          title
          brief
          slug
          url
          publishedAt
          updatedAt
          readTimeInMinutes
          views
          coverImage {
            url
          }
          author {
            name
          }
          subtitle
          content {
            markdown
          }
        }
      }
    }
  `,
};

export * from './og';
