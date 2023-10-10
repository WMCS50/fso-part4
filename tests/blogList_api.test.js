const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const bcrypt = require('bcryptjs')
const User = require('../models/user')

beforeEach(async() => {
    await User.deleteMany({})
    const user = {
        username: 'root',
        password: 'pleasework'
    }

    await api
        .post("/api/users")
        .send(user)
        .set("Accept", "application/json")
        .expect("Content-Type", /application\/json/)
})


beforeEach(async () => {
    await Blog.deleteMany({})
    
    const blogObjects = helper.initialBlogs
        .map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
})

//verifies correct amount of blogs and all are returned as json
test('all notes are returned as json', async () => {
    const response = await api.get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
    expect(response.body).toHaveLength(helper.initialBlogs.length)
})

//verifies unique identifier is named id
test('correct id format', async () => {
    const response = await api.get('/api/blogs')
    response.body.map(blog => {
        expect(blog.id).toBeDefined()
    })
})

//For new blog posts
describe('when there is a new blog post', () => {
    //verifies HTTP POST successfully creates a new blog post if authorization valid
    let authHeader = ''

    beforeEach(async () => {
        const signInUser = {
            username: 'root',
            password: 'pleasework'
        }
        
        const loggedInUser = await api
            .post('/api/login')
            .send(signInUser)
            .expect('Content-Type', /application\/json/)

        authHeader = {
            Authorization: `Bearer ${loggedInUser.body.token}`
        }
    })

    test('successful new blog post', async () => {
        
        const newBlog = {
            title: "This is a new blog title",
            author: "Kephen Sting",
            url: "http://kephensting.com",
            likes: 2001
        }
    
        await api
            .post('/api/blogs')
            .send(newBlog)
            .set(authHeader)
            .expect(201)
            .expect('Content-Type', /application\/json/)
    
        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
    
        const contents = blogsAtEnd.map(b => b.title)
        expect(contents).toContain('This is a new blog title')
    })

    //verify that if likes is missing from request, defaults to zero
    test('likes default to zero if missing', async () => {
        const newBlog = {
            title: "This is a new blog title",
            author: "Kephen Sting",
            url: "http://kephensting.com"
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .set(authHeader)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogs = await api.get('/api/blogs')
        expect(blogs.body[helper.initialBlogs.length].likes).toBe(0)
    })
    
    //verify 400 Bad Request if title or url are missing from POST
    test('return 400 Bad Request if POST request missing title or url', async() => {
        const newBlog = {
            author: "Kephen Sting",
            url: "http://what",
            likes: 2002
        }
        await api
            .post('/api/blogs')
            .send(newBlog)
            .set(authHeader)
            .expect(400)     
        
        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    })
}, 10000)

//verify new blog fails 401 if token not provided
test('return 401 Unauthorized if missing token', async() => {
    const newBlog = {
        author: "Kephen Sting",
        url: "http://what",
        likes: 2002
    }
    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(401)     
    
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
})

//verify that deleting a blog post works
/*
test('verify deletion of blog post', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]
    
    await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .expect(204)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

    const titles = blogsAtEnd.map(b => b.title)
    expect(titles).not.toContain(blogToDelete.title)
})
*/

//verify that an information for an individual blog post can be updated
describe('when updating a blog post', () => {
    test('likes of a blog with the specified id can be updated', async() => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToUpdate = blogsAtStart[0]
        const updatedBlog = {
            ...blogToUpdate,
            likes: 1000
        }

        await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(updatedBlog)
        .expect(200)
    
        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd[0].likes).toEqual(updatedBlog.likes)

    })

})

//testing users

describe('when there is initially one user in db', () => {
    beforeEach(async () => {
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', passwordHash })

        await user.save()
    })

    test('creation succeeds with a fresh username', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'Joseph',
            name: 'Schmo',
            password: 'mypass',
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

        const usernames = usersAtEnd.map(u => u.username)
        expect(usernames).toContain(newUser.username)
    })

    test('creation fails with if username already taken', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'root',
            name: 'shouldNotMatter',
            password: 'errorAnyway'
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

            const usersAtEnd = await helper.usersInDb()
            expect(usersAtEnd).toEqual(usersAtStart)
    })

    test('creation fails with invalid username ', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'to',
            name: 'shouldNotMatter',
            password: 'errorAnyway'
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

            const usersAtEnd = await helper.usersInDb()
            expect(usersAtEnd).toEqual(usersAtStart)
    })

})


afterAll(async () => {
    await mongoose.connection.close()
})
