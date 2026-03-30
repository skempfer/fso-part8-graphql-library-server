const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { connectDB } = require('../db')
const typeDefs = require('./schema')
const resolvers = require('./resolvers')

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

const start = async () => {
  await connectDB()
  
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  })
  
  console.log(`Server ready at ${url}`)
}

start()
