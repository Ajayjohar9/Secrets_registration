//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
var session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

//Mongoose connection

app.use(session({
  secret: 'My little secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
});

var conn = mongoose.connection;
conn.on('connected', function() {
  console.log('database is connected successfully');
});
conn.on('disconnected', function() {
  console.log('database is disconnected successfully');
})
conn.on('error', console.error.bind(console, 'connection error:'));
module.exports = conn;

//Creating User Schema

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  secret: String
});

// const secret = process.env.SECRET;
// userSchema.plugin(encrypt,{secret: secret, encryptedFields:["password"] });
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//Page Routes

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login", {message:''});
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/submit", function(req,res){
  res.render("submit");
});

app.get("/secrets", function(req, res) {
  User.find({"secret": {$ne: null}}, function(err, userFound){
    if (err) {
      console.log(err);
    }
    else {
      if (userFound) {
        res.render("secrets", {userFoundsecrets: userFound});
      }
    }
  });


});

app.get("/logout",function(req, res){
  req.logout();
  res.redirect('/login');
});

app.post("/register", function(req, res) {
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }
    else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", function(req, res) {
  const user = new User ({
    username: req.body.username,
    password: req.body.passpord
  });
  req.login(user, function(err){
    if(err){
      console.log(err);
      res.redirect("/login");
    }
    else{
      passport.authenticate("local", {failureRedirect: '/login'})(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/submit", function(req,res){
  const submittedSecret = req.body.secret;
  console.log(req.user);

  User.findById(req.user.id, function(err, userFound){
    if (err) {
      console.log(err);
    }
    else{
      if (userFound) {
        userFound.secret = submittedSecret;
        userFound.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});


app.listen(3000, function() {
  console.log("Server is running on port 3000");
});
