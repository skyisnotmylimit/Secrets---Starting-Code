//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
const  port = process.env.PORT;

app.use(express.static("public"));
app.set("view engine","ejs")
app.use(bodyParser.urlencoded({extended : true}));

app.use(session({
    secret : "Our little secrect.",
    resave : false,
    saveUninitialized : false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_URL,{useNewUrlParser:true, useUnifiedTopology: true}).then(()=>{
    console.log("MongoDB connected");
}).catch((err)=>{
    console.log("Error occured in connection",err);
});

const userSchema = new mongoose.Schema({
    username : {
        type : String
    },
    password : {
        type : String,
    }
});
userSchema.plugin(passportLocalMongoose);


const User = mongoose.model("user",userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",(req,res)=>{
    res.render("home");
});
app.get("/login",(req,res)=>{
    res.render("login");
});
app.get("/register",(req,res)=>{
    res.render("register");
});
app.get("/secrets",(req,res)=>{
    if(req.isAuthenticated()){
        res.redirect("/secrets");
    }
    else{
        res.redirect("/login");
    }
});

app.post("/register",async (req,res)=>{
     User.register({username : req.body.username},req.body.password,(err,user)=>{
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets");
            })
        }
    });
});

app.post("/login",async (req,res)=>{
    const user = new User({
        username : req.body.username,
        password : req.body.password
    });
    req.login(user,(err)=>{
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local");
            res.redirect("/secrets");
        }
    })
});

app.get("/logout",(req,res)=>{
    res.render("home");
});

app.listen(port,()=>{
    console.log(`Server is running at port ${port}`);
});