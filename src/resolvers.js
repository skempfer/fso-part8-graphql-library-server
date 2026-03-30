const { randomUUID } = require('node:crypto')
const { authors, books } = require('./data')

const resolvers = {
  Query: {
    bookCount: () => books.length,
    authorCount: () => authors.length,
    allBooks: (root, args) => {
      let filteredBooks = books

      if (args.author) {
        filteredBooks = filteredBooks.filter((book) => book.author === args.author)
      }

      if (args.genre) {
        filteredBooks = filteredBooks.filter((book) => book.genres.includes(args.genre))
      }

      return filteredBooks
    },
    allAuthors: () => authors,
  },
  Mutation: {
    addBook: (root, args) => {
      const authorExists = authors.some((author) => author.name === args.author)

      if (!authorExists) {
        authors.push({
          name: args.author,
          id: randomUUID(),
        })
      }

      const newBook = {
        title: args.title,
        author: args.author,
        published: args.published,
        genres: args.genres,
        id: randomUUID(),
      }

      books.push(newBook)
      return newBook
    },
  },
  Author: {
    bookCount: (root) => books.filter((book) => book.author === root.name).length,
  }
}

module.exports = resolvers
