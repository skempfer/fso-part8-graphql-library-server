const { authors, books } = require('./data')

const resolvers = {
  Query: {
    bookCount: () => books.length,
    authorCount: () => authors.length,
    allBooks: () => books,
    allAuthors: () => authors,
  },
  Author: {
    bookCount: (root) => books.filter((book) => book.author === root.name).length,
  }
}

module.exports = resolvers
