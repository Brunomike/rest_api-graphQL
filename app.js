require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const logger = require('morgan');
const multer = require('multer');

const timestamp = require('./utils/timestamp');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const app = express();


const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        //cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
        cb(null, timestamp() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.use(express.json());
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(logger('dev'));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});


app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const statusCode = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(statusCode).json({
        message: message,
        data: data
    });
});

mongoose.connect('mongodb+srv://brunomike:LHMex1BqqIC3hfGv@cluster0.yeeda.mongodb.net/messages')
    .then(async (result) => {
        //console.log(result);
        const server = app.listen(8080, (err) => {
            err ? console.log(err) : console.log(`http://localhost:8080`);
        });

        const io = require('./socket').init(server);
        io.on('connection', socket => {
            console.log('Client connected');
        });

    }).catch(err => console.log(err));

