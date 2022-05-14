const router = require('express').Router();
const authController = require('../controllers/auth');
const { body } = require('express-validator');

const User = require('../models/user');
const isAuth = require('../middleware/is-auth');


router.put('/signup', [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .custom((value, { req }) => {
            return User.findOne({ email: value })
                .then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('E-Mail address already exists!');
                    }
                });
        })
        .normalizeEmail(),
    body('name')
        .trim().isLength({ min: 5 }),
    body('password')
        .trim()
        .not()
        .isEmpty()
],authController.signup);


router.post('/login',authController.login);

router.get('/status',isAuth,authController.getStatus);
router.put('/status',isAuth,authController.updateStatus);



module.exports = router;