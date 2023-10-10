const mongoose = require('mongoose')

if (process.argv.length < 3) {
    console.log('give password as argument')
    process.exit
}

const password = process.argv[2]

const url = `mongodb+srv://walidmuslih:${password}@cluster0.9xz3oic.mongodb.net/bloglistApp?retryWrites=true&w=majority`

mongoose.set('strictQuery', false)
mongoose.connect(url)
    .then(console.log('connected -mongo- to MongoDB'))
    .catch((error) => {
    console.log('error connecting -mongo-to MongoDB:', error.message)
    })

const blogSchema = new mongoose.Schema({
    title: String,
    author: String,
    url: String,
    likes: Number
    })
      
const Blog = mongoose.model('Blog', blogSchema)
//test entry
const blog = new Blog({
    title: 'hey next',
    author: 'word',
})

blog.save().then(result => {
    console.log('blog saved')
    mongoose.connection.close()
})
