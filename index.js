const express = require('express');
// const ejs = require('ejs');
require('dotenv').config();
const session=require('express-session');
const flash=require('connect-flash');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Message = require('./dbmongo');
const usersRouter = require('./routes/users');
const generalRouter = require('./routes/general');
const bookingRouter = require('./routes/booking');
const adminRouter = require('./routes/admin');
const ratingRouter = require('./routes/rating');

const ratingRouter2 = require('./routes/rating2');
const ratingRouter3 = require('./routes/rating3');
const ratingRouter4 = require('./routes/rating4');
const ratingRouter5 = require('./routes/rating5');
const ratingRouter6 = require('./routes/rating6');


const app = express();

mongoose.connect('mongodb+srv://Do_Trang:admin12345@dbms.l8swf6y.mongodb.net/?retryWrites=true&w=majority&appName=dbmst', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const oneDay = 1000 * 60 * 60 * 24;
app.use(session({
    secret: "thisismysecretkey",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false,
}));

app.use(flash());

app.use(express.static('public'));
app.set("view engine", "ejs");
app.set('views', 'pages');
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.json());

app.use((req,res,next)=>{
  res.locals.session=req.session;
  next();
})

app.use(generalRouter);
app.use(usersRouter);
app.use(bookingRouter);
app.use(adminRouter);
app.use(ratingRouter);

app.use(ratingRouter2);
app.use(ratingRouter3);
app.use(ratingRouter4);
app.use(ratingRouter5);
app.use(ratingRouter6);


app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`)
})
