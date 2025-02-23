const express = require('express');
var cors = require('cors');
const connection = require('./connection');
const userRoute = require('./routes/user');
const postRoute = require('./routes/post');
const eventRoute = require('./routes/event');
const collegeRoute = require('./routes/college');
const app = express();

app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use('/user', userRoute);
app.use('/post', postRoute);
app.use('/event', eventRoute);
app.use('/college', collegeRoute);

module.exports = app;