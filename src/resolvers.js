const { GraphQLError } = require('@apollo/server')
const Book = require('../models/Book')
const Author = require('../models/Author')

const handleValidationError = (error) => {
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((err) => err.message)
    throw new GraphQLError(messages.join(', '), {
      extensions: { code: 'BAD_USER_INPUT' },
    })
  }
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0]
    throw new GraphQLError(`${field} must be unique`, {
      extensions: { code: 'BAD_USER_INPUT' },
    })
  }
  throw error
}

const resolvers = {
  Query: {
    bookCount: async () => await Book.countDocuments(),
    authorCount: async () => await Author.countDocuments(),
    allBooks: async (root, args) => {
      let filter = {}

      if (args.author) {
        const author = await Author.findOne({ name: args.author })
        if (author) {
          filter.author = author._id
        }
      }

      if (args.genre) {
        filter.genres = args.genre
      }

      return await Book.find(filter).populate('author')
    },
    allAuthors: async () => {
      return await Author.find({})
    },
  },
  Mutation: {
    addBook: async (root, args) => {
      try {
        let author = await Author.findOne({ name: args.author })

        if (!author) {
          author = new Author({ name: args.author })
          await author.save()
        }

        const book = new Book({
          title: args.title,
          published: args.published,
          genres: args.genres,
          author: author._id,
        })

        await book.save()
        await book.populate('author')
        return book
      } catch (error) {
        handleValidationError(error)
      }
    },
    editAuthor: async (root, args) => {
      try {
        const author = await Author.findOne({ name: args.name })

        if (!author) {
          return null
        }

        author.born = args.setBornTo
        await author.save()
        return author
      } catch (error) {
        handleValidationError(error)
      }
    },
  },
  Author: {
    bookCount: async (root) => {
      return await Book.countDocuments({ author: root._id })
    },
  },
  Book: {
    author: async (root) => {
      return await Author.findById(root.author)
    },
  },
}

module.exports = resolvers
