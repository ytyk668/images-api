const connect = require('connect');
const { ApolloServer, gql } = require('apollo-server-express');
const query = require('qs-middleware');
const api = require('./index.js');
const request = require('supertest');
const config = require('./config');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Query {
    search(key: String!, authorization: String!): [Image]
  }

  # Mutation
  // type Mutation {
  //   signup(username: String!, password: String!): String
  //   login(username: String!, password: String!): String
  //   logout(authorization: String!): String
  // }

  type Image {
    image_ID: String
    thumbnails: String
    preview: String
    title: String
    source: String
    tags: [String]
  }
`;

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    search: async (root, { key }, context) => {
      const { status, body } = await request(api)
        .get('/search')
        // .set('authorization', authorization)
        .query({ key });

      return body;
    },
  }
  // Mutation Type Resolver
//   Mutation: {
//     signup: async (root, { username, password }, context) => {
//       const { status, body } = await request(api)
//         .post('/signup')
//         .send({ username, password });

//       return 'ok';
//     },
//     login: async (root, { username, password }, context) => {
//       const { status, body } = await request(api)
//         .post('/login')
//         .send({ username, password });
//       return body;
//     },
//     logout: async (root, { authorization }, context) => {
//       const { status, body } = await request(api)
//         .get('/logout')
//         .set('authorization', authorization);

//       return 'ok';
//     },
//   },
// };

let options = { typeDefs, resolvers };
if (process.env.NODE_ENV === 'DEVELOPMENT')
  options = { ...options, introspection: true, playground: true };
const server = new ApolloServer(options);

const app = connect();
const path = '/graphql';

app.use(query());

server.applyMiddleware({ app, path });

app.listen({ port: 3001 }, () =>
  console.log(
    `Server ready at http://localhost:${3001}${server.graphqlPath}`,
  ),
);
