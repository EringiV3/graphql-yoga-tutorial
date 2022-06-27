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
  }),
});

export const schema = builder.toSchema({});
