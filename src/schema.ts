import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLYogaError } from '@graphql-yoga/node';
import type { Link } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import type { GraphQLContext } from './context';

const typeDefinitions = /* GraphQL */ `
  type Link {
    id: ID!
    description: String!
    url: String!
    comments: [Comment!]!
  }

  type Comment {
    id: ID!
    body: String!
  }

  type Query {
    info: String!
    feed: [Link!]!
    comment(id: ID!): Comment
  }

  type Mutation {
    postLink(url: String!, description: String!): Link!
    postCommentOnLink(linkId: ID!, body: String!): Comment!
  }
`;

const resolvers = {
  Query: {
    info: () => `This is the API of a Hackernews Clone`,
    feed: async (parent: unknown, args: {}, context: GraphQLContext) => {
      return context.prisma.link.findMany();
    },
    comment: async (
      parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ) => {
      return context.prisma.comment.findUnique({
        where: { id: parseInt(args.id) },
      });
    },
  },
  Link: {
    id: (parent: Link) => parent.id,
    description: (parent: Link) => parent.description,
    url: (parent: Link) => parent.url,
    comments: (parent: Link, args: {}, context: GraphQLContext) => {
      return context.prisma.comment.findMany({
        where: {
          linkId: parent.id,
        },
      });
    },
  },
  Mutation: {
    postLink: async (
      parent: unknown,
      args: { description: string; url: string },
      context: GraphQLContext
    ) => {
      const newLink = await context.prisma.link.create({
        data: {
          url: args.url,
          description: args.description,
        },
      });
      return newLink;
    },
    postCommentOnLink: async (
      parent: unknown,
      args: { linkId: string; body: string },
      context: GraphQLContext
    ) => {
      const comment = await context.prisma.comment
        .create({
          data: {
            body: args.body,
            linkId: parseInt(args.linkId),
          },
        })
        .catch((err: unknown) => {
          if (
            err instanceof PrismaClientKnownRequestError &&
            err.code === 'P2003'
          ) {
            return Promise.reject(
              new GraphQLYogaError(
                `Cannot post comment on non-existing link with id '${args.linkId}'.`
              )
            );
          }
          return Promise.reject(err);
        });

      return comment;
    },
  },
};

export const schema = makeExecutableSchema({
  resolvers: [resolvers],
  typeDefs: [typeDefinitions],
});
