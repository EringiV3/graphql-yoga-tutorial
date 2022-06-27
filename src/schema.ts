import { builder } from './builder';
import { db } from './db';

builder.prismaObject('Link', {
  fields: (t) => ({
    id: t.exposeID('id'),
    description: t.exposeString('description'),
    url: t.exposeString('url'),
    comments: t.relation('comments'),
  }),
});

builder.prismaObject('Comment', {
  fields: (t) => ({
    id: t.exposeID('id'),
    body: t.exposeString('body'),
    link: t.relation('link'),
  }),
});

builder.queryType({
  fields: (t) => ({
    link: t.prismaField({
      type: 'Link',
      nullable: true,
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: (query, root, args) => {
        return db.link.findUnique({
          ...query,
          where: {
            id: Number.parseInt(String(args.id), 10),
          },
        });
      },
    }),
    links: t.prismaField({
      type: ['Link'],
      nullable: false,
      args: {
        take: t.arg.int(),
        skip: t.arg.int(),
      },
      resolve: (query, root, args) => {
        return db.link.findMany({
          ...query,
          take: args.take ?? 10,
          skip: args.skip ?? 0,
        });
      },
    }),
  }),
});

builder.mutationType({
  fields: (t) => ({
    postLink: t.prismaField({
      type: 'Link',
      nullable: false,
      args: {
        description: t.arg.string(),
        url: t.arg.string(),
      },
      resolve: (query, root, args) => {
        return db.link.create({
          ...query,
          data: {
            description: args.description ?? '',
            url: args.url ?? '',
          },
        });
      },
    }),
  }),
});

export const schema = builder.toSchema({});
