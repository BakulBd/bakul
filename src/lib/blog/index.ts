// GraphQL Client for Hashnode
export function gqlClient(query: string) {
  return async (variables?: any): Promise<any> => {
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
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL error: ${data.errors.map((e: any) => e.message).join(', ')}`);
    }

    return data;
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
