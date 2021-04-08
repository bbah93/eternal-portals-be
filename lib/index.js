"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const serviceAccount = require('../ep_service_account');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const apollo_server_1 = require("apollo-server");
const typeDefs = apollo_server_1.gql `
    
  type User {
        id: ID
        firstname: String
        lastname: String
        email: String
        dob: String
        portal_url: String
        request_ids: [ID]
        friends: [Friends]
        portal: Portal
    }

    input UserInput {
        id: String!
        firstname: String
        lastname: String
        email: String
        dob: String
        portal_url: String
    }

  type Friends {
    user_id: String!
    id: ID!
    dob: String
    first_name: String!
    last_name: String!
    portal_url: String!
  }

  type Portal {
    p_id: ID
    create_date: String
    owner_id: String
    past_url: String 
    current_url: String
    like_count: Int
    likes: [Likes]
    downloads: Int
    
  }

    type Likes {
      count: Int!
      origin_uid: String
      origin_time: String!
    }

    type Query {
      getPortals: [Portal]
      getUser(id: String!): User
      # getFriends(id: User!): Friends
    }

    type Mutation {
      updateUser(user: UserInput ): User

      # addUser(user: User!): User
      # addPortal(portal: Portal!): Portal
      # updatePortal(portal: Portal!): Portal
    }
  `;
const resolvers = {
    Query: {
        async getPortals() {
            console.log("Test");
            const portals = await admin
                .firestore()
                .collection('Portals')
                .get();
            return portals.docs.map(portal => portal.data());
        },
        async getUser(_, args) {
            try {
                const userDoc = await admin
                    .firestore()
                    .doc(`Users/${args.id}`)
                    .get();
                const user = userDoc.data();
                return user || new apollo_server_1.ValidationError('User ID not found');
            }
            catch (error) {
                throw new apollo_server_1.ApolloError(error);
            }
        }
    },
    Mutation: {
        async updateUser(_, args) {
            try {
                const updatedUser = await admin
                    .firestore()
                    .collection('Users')
                    .doc(args.user.id)
                    .set(args.user);
                const user = {
                    id: args.user.id,
                    firstname: args.user.firstname
                };
                return user;
            }
            catch (error) {
                throw new apollo_server_1.ApolloError(error);
            }
        }
    }
};
const server = new apollo_server_1.ApolloServer({
    typeDefs,
    resolvers,
    introspection: true
});
server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});
//# sourceMappingURL=index.js.map