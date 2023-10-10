const _ = require("lodash")

const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    return blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

const favoriteBlog = (blogs) => {
    return blogs.reduce((fav, blog) => fav.likes > blog.likes ? fav : blog)
}

//4.6 returns author with largest amount of blogs
const mostBlogs = (blogs) => {
    let most = _.chain(blogs)
        .countBy('author')
        .toPairs()
        .maxBy(1)
        .value()
   
    let returnObject = {
        author: most[0],
        blogs: most[1]
    }

    return returnObject
}

//4.7 returns author with most likes
const mostLikes = (blogs) => {
    let most = _.chain(blogs)
        .groupBy('author')
        .mapValues((value) => _.sumBy(value, 'likes'))
        .toPairs()
        .maxBy(1)
        .value()

    let returnObject = {
        author: most[0],
        likes: most[1]
    }
    
    return returnObject
}
    
module.exports = { 
    dummy, 
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
 }