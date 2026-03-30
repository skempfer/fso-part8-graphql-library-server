const { authors, books } = require('./data')

const resolvers = {
  Query: {
    bookCount: () => books.length,
    authorCount: () => authors.length,
    allBooks: (root, args) => {
      if (!args.author) {
        return books
      }

      return books.filter((book) => book.author === args.author)
    },
    allAuthors: () => authors,
  },
  Author: {
    bookCount: (root) => books.filter((book) => book.author === root.name).length,
  }
}

module.exports = resolvers
