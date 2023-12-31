const express = require('express');
const app = express();
const methodOverride = require('method-override');
const path = require('path');
const ExpressError = require('./utils/ExpressError');
const ejsMate = require('ejs-mate');
const session = require('express-session')
const flash = require('connect-flash');
const mongoose = require('mongoose');
const { urlencoded } = require('express');
const { Router } = require('express');
const users = require('./routes/users')
const campgrounds = require('./routes/campgrounds')
const reviews = require('./routes/reviews')
const User = require('./models/user')
const passport = require('passport')
const localStrategy = require('passport-local')




mongoose.connect('mongodb://localhost:27017/yelp-camp');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
    console.log('Connection Established!!');
});

app.engine('ejs', ejsMate);

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')))

const sessionConfig = {
    secret: 'secretKey',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000*60*60*24*7,
        maxAge: 1000*60*60*24*7
    }
}
app.use(session(sessionConfig))
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())
passport.use(new localStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use(function(req,res,next){
    if(!['/login','/'].includes(req.originalUrl)){
        req.session.returnTo = req.originalUrl;
    }
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error')
    next();
})

app.use('/', users)
app.use('/campgrounds',campgrounds);
app.use('/campgrounds/:id/reviews', reviews)


app.get('/', function(req,res){
    res.render('home')
})


app.all('*',function(req,res,next){
    next(new ExpressError('Page not found!', 404))
})

app.use(function(err,req,res,next){
    const {statusCode = 500 } = err;
    if(!err.message){
        err.message = 'Something went wrong'
    }
    res.status(statusCode).render('error', {err});
})

app.listen(3000, function(){
    console.log('Serving on host 3000')
})