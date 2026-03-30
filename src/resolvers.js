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
  Author: {
    bookCount: (root) => books.filter((book) => book.author === root.name).length,
  }
}

module.exports = resolvers
