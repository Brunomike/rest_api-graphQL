const expect = require('chai').expect;
const sinon = require('sinon');
const mongoose = require('mongoose');

const User = require('../models/user');
const FeedController = require('../controllers/feed');


describe('Feed Controller', function () {
    before(function (done) {
        mongoose.connect('mongodb+srv://brunomike:LHMex1BqqIC3hfGv@cluster0.yeeda.mongodb.net/test-messages')
            .then(result => {
                const user = new User({
                    email: "johndoe@gmail.com",
                    password: "tester",
                    name: "John Doe",
                    posts: [],
                    _id: '5c0f66b9791f55031b347281'
                });
                return user.save();
            })
            .then(() => {
                done();
            });
    });
    beforeEach(function () { });

    afterEach(function () { });

    it('should add a created post to the posts of the creator', function (done) {
        const req = {
            body: {
                title: 'Test Post',
                content: 'A Test Post'
            },
            file: {
                path: 'abc'
            },
            userId: '5c0f66b9791f55031b347281'
        };

        const res = {
            status: function () {
                return this;
            },
            json: function () { }
        };

        FeedController.createPost(req, res, () => { }).then(savedUser => {
            expect(savedUser).to.have.property('posts');
            expect(savedUser.posts).to.have.length(1);
            done();
        });
    });


    after(function (done) {
        User.deleteMany({})
            .then(() => {
                return mongoose.disconnect();
            })
            .then(() => {
                done();
            });
    });
});