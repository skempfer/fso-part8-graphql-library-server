const { GraphQLError } = require('@apollo/server')
const jwt = require('jsonwebtoken')
const { PubSub } = require('graphql-subscriptions')
const Book = require('../models/Book')
const Author = require('../models/Author')
const User = require('../models/User')

const JWT_SECRET = process.env.JWT_SECRET || 'secret'
const PASSWORD = 'secret'
const BOOK_ADDED = 'BOOK_ADDED'
const pubsub = new PubSub()

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
      const authorsWithBookCount = await Author.aggregate([
        {
          $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: 'author',
            as: 'authorBooks',
          },
        },
        {
          $addFields: {
            bookCount: { $size: '$authorBooks' },
          },
        },
        {
          $project: {
            name: 1,
            born: 1,
            bookCount: 1,
          },
        },
      ])

      return authorsWithBookCount
    },
    me: async (root, args, context) => {
      return context.currentUser
    },
  },
  Mutation: {
    addBook: async (root, args, context) => {
      if (!context.currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

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

        pubsub.publish(BOOK_ADDED, { bookAdded: book })

        return book
      } catch (error) {
        handleValidationError(error)
      }
    },
    editAuthor: async (root, args, context) => {
      if (!context.currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

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
    createUser: async (root, args) => {
      try {
        const user = new User({
          username: args.username,
          favoriteGenre: args.favoriteGenre,
        })

        await user.save()
        return user
      } catch (error) {
        handleValidationError(error)
      }
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      if (!user || args.password !== PASSWORD) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const token = jwt.sign({ id: user._id }, JWT_SECRET)

      return { value: token }
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterableIterator([BOOK_ADDED]),
    },
  },
  Author: {
    bookCount: async (root) => {
      return root.bookCount ?? (await Book.countDocuments({ author: root._id }))
    },
  },
  Book: {
    author: async (root) => {
      return await Author.findById(root.author)
    },
  },
}

module.exports = resolvers
