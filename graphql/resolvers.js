const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');
const { clearImage } = require('../utils/file');

module.exports = {
    hello() {
        return {
            text: 'Hello World!',
            views: 1234
        };
    },
    createUser: async function (args, req) {
        const { email, name, password } = args.userInput;
        const errors = [];
        console.log({ input: args.userInput });

        if (!validator.isEmail(email)) {
            errors.push({ message: 'E-Mail is invalid!' });
        }
        if (validator.isEmpty(password) || !validator.isLength(password, { min: 5 })) {
            errors.push({ message: 'Password too short!' });
        }

        if (errors.length > 0) {
            const error = new Error('Invalid Input!');
            error.data = errors;
            error.code = 422;
            throw error;
        }

        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            const error = new Error('User exists already!');
            throw error;
        }
        const hashedPw = await bcrypt.hash(password, 12);
        const user = new User({
            email: email,
            name: name,
            password: hashedPw
        });

        const createdUser = await user.save();

        return {
            ...createdUser._doc, _id: createdUser._id.toString(),
        };
    },
    login: async function ({ email, password }) {
        const user = await User.findOne({ email: email });
        if (!user) {
            const error = new Error('User not found!');
            error.code = 401;
            throw error;
        }
        const isEqual = await bcrypt.compare(password, user.password);

        if (!isEqual) {
            const error = new Error('Password is incorrect!');
            error.code = 401;
            throw error;
        }
        const token = jwt.sign({
            userId: user._id.toString(),
            email: user.email
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return { token: token, userId: user._id.toString() };
    },
    createPost: async function (args, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated!');
            error.code = 401;
            throw error;
        }

        const { title, content, imageUrl } = args.postInput;
        const errors = [];
        if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
            errors.push({ message: 'Title is invalid' });
        }
        if (validator.isEmpty(content) || !validator.isLength(content, { min: 5 })) {
            errors.push({ message: 'Content is invalid' });
        }
        if (errors.length > 0) {
            const error = new Error('Invalid Input!');
            error.data = errors;
            error.code = 422;
            throw error;
        }

        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('Invalid user!');
            error.code = 401;
            throw error;
        }

        const post = new Post({
            title: title,
            content: content,
            imageUrl: imageUrl,
            creator: user
        });

        const createdPost = await post.save();
        //Add post to user's posts

        user.posts.push(createdPost);
        await user.save();

        return {
            ...createdPost._doc,
            _id: createdPost._id.toString(),
            createdAt: createdPost.createdAt.toISOString(),
            updatedAt: createdPost.updatedAt.toISOString(),
        };

    },
    updatePost: async function ({ postId, postInput }, req) {
        console.log(postId);
        console.log(postInput);
        if (!req.isAuth) {
            const error = new Error('Not authenticated!');
            error.code = 401;
            throw error;
        }
        const post = await Post.findById(postId).populate('creator');

        if (!post) {
            const error = new Error('No post found.');
            error.status = 404;
            throw error;
        }

        if (req.userId.toString() !== post.creator._id.toString()) {
            const error = new Error('Not authorized');
            error.statusCode = 403;
            throw error;
        }

        const { title, content, imageUrl } = postInput;

        const errors = [];
        if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
            errors.push({ message: 'Title is invalid' });
        }
        if (validator.isEmpty(content) || !validator.isLength(content, { min: 5 })) {
            errors.push({ message: 'Content is invalid' });
        }
        if (errors.length > 0) {
            const error = new Error('Invalid Input!');
            error.data = errors;
            error.code = 422;
            throw error;
        }

        post.title = title;
        post.content = content;
        if (imageUrl !== 'undefined') {
            post.imageUrl = imageUrl;
        }

        const updatedPost = await post.save();

        console.log(updatedPost);

        return {
            ...updatedPost._doc,
            _id: updatedPost._id.toString(),
            createdAt: updatedPost.createdAt.toISOString(),
            updatedAt: updatedPost.updatedAt.toISOString()
        }

    },
    getPosts: async function ({ page }, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated!');
            error.code = 401;
            throw error;
        }

        const currentPage = page || 1;
        const perPage = 2;

        const totalItems = await Post.find().countDocuments();
        const posts = await Post.find()
            .populate('creator')
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * 1)
            .limit(perPage);

        return {
            posts: posts.map(p => {
                return {
                    ...p._doc,
                    _id: p._id.toString(),
                    createdAt: p.createdAt.toISOString(),
                    updatedAt: p.updatedAt.toISOString()
                };
            }),
            totalPosts: totalItems
        };
    },
    getStatus: async function (args, req) {
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('Not authorized');
            error.statusCode = 403;
            throw error;
        }
        return {
            status: user.status
        };
    },
    getPost: async function ({ postId }, req) {
        if (!req.isAuth) {
            const error = new Error('Not authorized');
            error.statusCode = 403;
            throw error;
        }
        const post = await Post.findById(postId).populate('creator');
        if (!post) {
            const error = new Error('Post not found');
            error.statusCode = 404;
            throw error;
        }

        return {
            ...post._doc,
            _id: post._id.toString(),
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
        };
    },
    deletePost: async function ({ postId }, req) {
        if (!req.isAuth) {
            const error = new Error('Not authorized');
            error.statusCode = 403;
            throw error;
        }
        const post = await Post.findById(postId).populate('creator');

        if (!post) {
            const error = new Error('Could not find post.');
            error.status = 404;
            throw error;
        }

        if (req.userId.toString() !== post.creator._id.toString()) {
            const error = new Error('Not authorized');
            error.statusCode = 403;
            throw error;
        }

        clearImage(post.imageUrl);

        await Post.findByIdAndRemove(postId);
        const user = await User.findById(req.userId);
        user.posts.pull(postId);
        await user.save();

        return true;
    },
    updateStatus: async function ({ status }, req) {
        if (!req.isAuth) {
            const error = new Error('Not authorized');
            error.statusCode = 403;
            throw error;
        }

        const user = await User.findById(req.userId);

        if (!user) {
            const error = new Error('Not authorized');
            error.statusCode = 403;
            throw error;
        }
        user.status = status;
        await user.save();

        return user.status;
    }
};