import * as admin from 'firebase-admin'


const serviceAccount = require('../ep_service_account');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  import { ApolloServer, ApolloError, ValidationError, gql } from 'apollo-server';
import { firestore } from 'firebase-admin';
import firebase from 'firebase';


  interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    dob: string;
    portal_url: string;
    avatar_url: string;
  }

  interface Friend {
    id: string;
    dob: string;
    first_name: string;
    last_name: string;
    portal_url: string;
  }

  interface Portal {
    p_id: string;
    create_date: string;
    owner_id: string; 
    past_url: string; 
    current_url: string;
    like_count: number;
    downloads: number;
  }

  interface Like {
    count: number;
    origin_uid: string;
    origin_time: string;
    
  }

  const typeDefs = gql`
    
  type User {
        id: ID
        firstname: String
        lastname: String
        email: String
        dob: String
        portal_url: String
        avatar_url: String
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

    type File {
      filename: String
      mimetype: String
      filesize: Int
      url: String
  }

    type Mutation {
      updateUser(user: UserInput ): User
      uploadAvatar(file: Upload!): File
      # addUser(user: User!): User
      # addPortal(portal: Portal!): Portal
      # updatePortal(portal: Portal!): Portal
    }
  `;

  const resolvers = {

    Query: {
      async getPortals(){
        console.log("Test")
        const portals = await admin
        .firestore()
        .collection('Portals')
        .get();
        return portals.docs.map(portal => portal.data()) as Portal[];
      }, 
      async getUser(_: null, args: { id: string }) {
        try {
          const userDoc = await admin
            .firestore()
            .doc(`Users/${args.id}`)
            .get();
          const user = userDoc.data() as User | undefined;
          return user || new ValidationError('User ID not found');
        } catch (error) {
          throw new ApolloError(error);
        }
      }
    },

    Mutation: {
      async updateUser(_: null, args: {user}){
        try {
          const updatedUser = await admin
          .firestore()
          .collection('Users')
          .doc(args.user.id)
          .set(args.user);

          const user = {
            id: args.user.id,
            firstname: args.user?.firstname,
            lastname: args.user?.lastname,
            dob: args.user?.dob,
            avatar_url: args.user?.avatar_url

          }
          return user ;
        } catch(error){
          throw new ApolloError(error);

        }
      },

      async uploadAvatar(_: null, args: {file}){
        try{
          const storageRef = firebase.storage().ref();
          const avatatRef = storageRef.child(`profile_images/${args.file.filename}`);

          const uploadTask = avatatRef.put(args.file);
          uploadTask.on( 'state_changed', 
            (snapshot) => {
             // Observe state change events such as progress, pause, and resume
              // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
              var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log('Upload is ' + progress + '% done');
              switch (snapshot.state) {
                case firebase.storage.TaskState.PAUSED: // or 'paused'
                  console.log('Upload is paused');
                  break;
                case firebase.storage.TaskState.RUNNING: // or 'running'
                  console.log('Upload is running');
                  break; 
                      }
                    },
                    (error) => {
                      // Handle unsuccessful uploads
                    }, 
                    () => {
                      // Handle successful uploads on complete
                      // For instance, get the download URL: https://firebasestorage.googleapis.com/...
                      uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                        console.log('File available at', downloadURL);
                      });
                    } 
                    );
              } catch(error){
                throw new ApolloError(error);

              }
          }
        }

      };

  const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true
});

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});