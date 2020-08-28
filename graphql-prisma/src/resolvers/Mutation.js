import bcrypt from 'bcryptjs'
import getUserId from '../utils/getUserId'
import generateToken from '../utils/generateToken';
import hashPassword from '../utils/hashPassword';

const Mutation = {
    async createUser(parent, args, { prisma }, info) {
        const password = await hashPassword(args.data.password)
        const user = await prisma.mutation.createUser({ 
            data: {
                ...args.data,
                password
            }
        })

        return {
            user,
            token: generateToken(user.id)
        }
    },
    async loginUser(parent, args, { prisma }, info) {
        const user = await prisma.query.user({
            where: {
                email: args.data.email
            }
        })

        if(!user)
            throw new Error('Unable to login')

        const isMatch = await bcrypt.compare(args.data.password, user.password)

        if(!isMatch)
            throw new Error('Unable to login')

        return {
            user,
            token: generateToken(user.id)
        }
    },
    deleteUser(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)

        return prisma.mutation.deleteUser({
            where: {
                id: userId
            }
        }, info)
    },
    async updateUser(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)

        if(typeof args.data.password === 'string')
            args.data.password = await hashPassword(args.data.password)

        return prisma.mutation.updateUser({
            where: {
                id: userId
            },
            data: args.data
        }, info)
    },
    createPost(parent, { data }, { prisma, request }, info) {
        const userId = getUserId(request)

        return prisma.mutation.createPost({ 
            title: data.title,
            body: data.body,
            published: data.published,
            author: {
                connect: {
                    id: userId
                }
            }
        }, info)
    },
    async deletePost(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)
        const postExists = await prisma.exists.Post({
            id: args.id,
            author: {
                id: userId
            }
        })

        if(!postExists)
            throw new Error('Operation failed')
        
        return prisma.mutation.deletePost({
            where: {
                id: args.id
            }
        }, info)
    },
    async updatePost(parent, args, { prisma }, info) {
        const userId = getUserId(request)
        const postExists = await prisma.exists.Post({
            id: args.id,
            author: {
                id: userId
            }
        })
        const isPublished = await prisma.exists.Post({ 
            id: args.id, 
            published: true 
        })

        if(!postExists)
            throw new Error('Operation failed')

        if(isPublished && args.data.published === false) {
            await prisma.mutation.deleteManyComments({
                where: {
                    post: {
                        id: args.id
                    }
                }
            })
        }
        
        return prisma.mutation.updatePost({
            where: {
                id: args.id
            },
            data: args.data
        }, info)
    },
    async createComment(parent, { data }, { prisma }, info) {
        const userId = getUserId(request)
        const isPublished = await prisma.exists.Post({
            id: data.id,
            published: true
        })

        if(!isPublished)
            throw new Error('Post not found')

        return prisma.mutation.createComment({
            text: data.text,
            author: {
                connect: userId
            },
            post: {
                connect: {
                    id: data.post
                }
            }
        }, info)
    },
    async deleteComment(parent, args, { prisma }, info) {
        const userId = getUserId(request)
        const commentExists = await prisma.exists.Comment({
            id: args.id,
            author: {
                id: userId
            }
        })

        if(!commentExists)
            throw new Error('Comment does not exist')
        
        return prisma.mutation.deleteComment({
            where: {
                id: args.id
            }
        })
    },
    async updateComment(parent, args, { prisma }, info) {
        const userId = getUserId(request)
        const commentExists = await prisma.exists.Comment({
            id: args.id,
            author: {
                id: userId
            }
        })

        if(!commentExists)
            throw new Error('Comment does not exist')

        return prisma.mutation.updateComment({
            where: {
                id: args.id
            },
            data: args.data
        }, info)
    }
}

export { Mutation as default }