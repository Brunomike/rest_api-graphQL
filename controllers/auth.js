const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');


exports.signup = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const error = new Error('Validation Failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    const { email, name, password } = req.body;

    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                name: name,
                email: email,
                password: hashedPassword
            });
            return user.save();
        })
        .then(result => {
            res.status(201).json({
                message: 'User created',
                userId: result._id
            });
        })
        .catch(error => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};


exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    let loadedUser;

    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            const error = new Error('A user with this email could not be found.');
            error.statusCode = 401;
            throw error;
        }
        loadedUser = user;
        let isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error('Wrong Password.');
            error.statusCode = 401;
            throw error;
        }
        const token = jwt.sign(
            {
                email: loadedUser.email,
                userId: loadedUser._id.toString()
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' });
        req.userId = loadedUser._id.toString();
        console.log({ login: req.userId });
        res.status(200).json({
            token: token,
            userId: loadedUser._id.toString()
        });
        return;
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
        return err;
    }
    // User.findOne({ email: email })
    //     .then(user => {
    //         if (!user) {
    //             const error = new Error('A user with this email could not be found.');
    //             error.statusCode = 401;
    //             throw error;
    //         }
    //         loadedUser = user;
    //         return bcrypt.compare(password, user.password);
    //     })
    //     .then(isEqual => {
    //         if (!isEqual) {
    //             const error = new Error('Wrong Password.');
    //             error.statusCode = 401;
    //             throw error;
    //         }
    //         const token = jwt.sign(
    //             {
    //                 email: loadedUser.email,
    //                 userId: loadedUser._id.toString()
    //             },
    //             process.env.JWT_SECRET,
    //             { expiresIn: '1h' });
    //         req.userId = loadedUser._id.toString();
    //         console.log({ login: req.userId });
    //         res.status(200).json({
    //             token: token,
    //             userId: loadedUser._id.toString()
    //         });
    //     })
    //     .catch(err => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //         return err;
    //     });
    //return;
};

exports.getStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ status: user.status });        
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);        
    }
    // User.findById(req.userId)
    //     .then(user => {
    //         if (!user) {
    //             const error = new Error('Not authorized');
    //             error.statusCode = 403;
    //             throw error;
    //         }
    //         res.status(200).json({ status: user.status });
    //     })
    //     .catch(err => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     });
};

exports.updateStatus = (req, res, next) => {
    const status = req.body.status;
    User.findById(req.userId)
        .then(user => {
            if (!user) {
                const error = new Error('Not authorized');
                error.statusCode = 403;
                throw error;
            }
            user.status = status;
            return user.save();
        })
        .then(result => {
            res.status(200).json({ status: result.status });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};