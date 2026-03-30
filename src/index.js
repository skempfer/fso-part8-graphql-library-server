require('dotenv').config()

const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const jwt = require('jsonwebtoken')
const { connectDB } = require('../db')
const typeDefs = require('./schema')
const resolvers = require('./resolvers')
const User = require('../models/User')

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

const start = async () => {
  await connectDB()
  
  const { url } = await startStandaloneServer(server, {
    listen: { port: process.env.PORT || 4001 },
    context: async ({ req }) => {
      const auth = req ? req.headers.authorization : null

      if (auth && auth.startsWith('Bearer ')) {
        const token = auth.slice(7)
        try {
          const decodedToken = jwt.verify(token, JWT_SECRET)
          const user = await User.findById(decodedToken.id)
          return { currentUser: user }
        } catch (err) {
          return { currentUser: null }
        }
      }

      return { currentUser: null }
    },
  })
  
  console.log(`Server ready at ${url}`)
}

start()
