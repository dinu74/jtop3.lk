var express = require("express");
var router = express.Router();
var passport = require("passport");
var LocalStrategy = require("passport-local");
var User = require("../models/user");

// Login Page
router.get("/login", function(req, res) {
    // user not logged in, show login page
    if (!req.user) {
      res.render("login"); 
    }
    // user logged in, redirect to homepage
    else {
      res.redirect("/");
    }
});

// Register
router.get("/register", function(req, res) {
    // user not registered, show sign up page
    if (!req.user) {
      res.render("register");
    }
    // user logged in, redirect to homepage
    else {
      res.redirect("/");
    }
});


// Register User
router.post("/register", function(req, res) {
  // get user's data
  var name = req.body.name.trim();
  var email = req.body.email.trim();
  var password = req.body.password;
  var password2 = req.body.password2;
  
  // Validation
  req.checkBody("name", "Name is required").notEmpty();
  req.checkBody("email", "Email is required").notEmpty();
  req.checkBody("email", "Enter a valid email").isEmail();
  req.checkBody("password", "Password is required").notEmpty();
  req.checkBody("password", "Passwords do not match").equals(req.body.password2);
  
  // check whether there is any error
  var errors = req.validationErrors();
  
  // if errors, show errors
  if (errors) {
    res.render("register", {
      errors: errors
    });
  }
  // register user
  else {

    // Email id must be unique
    User.getUserByEmail(email, function(err, user) {
      if (err) throw err;
      
      // user doesn't exist, create user  
      if (!user) {
        var newUser = new User({
          name: name,
          email: email,
          password: password
        });

        User.createUser(newUser, function(err, user) {
          if (err) throw err;
          console.log(user);
        });

        req.flash("success_msg", "You are registered and can now login");
        res.redirect("/users/login");    
      }
      // user already exists, show error
      else {
        var errors = [{msg: "Email id already exists"}];
        res.render("register", {
          errors: errors
        });
      }
    })
  }
});

// using passport module for handling local authentication
passport.use(new LocalStrategy({
    usernameField: 'email',       // username field name is email in form
    passwordField: 'password'     // password field name is password in form
  },
  function(email, password, done) {
    User.getUserByEmail(email, function(err, user) {
      if (err) throw err;
      
      // user with given id doesn't exist, show error
      if (!user) {
        return done(null, false, {message: "Unknown User"});
      }
      
      User.comparePassword(password, user.password, function(err, isMatch) {
        if (err) throw err;
        // correct password, authorize
        if (isMatch) {
          return done(null, user);
        }
        // incorrect password, show error
        else {
          return done(null, false, {message: "Invalid Password"});
        }
      });
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

// login form submitted, handle authetication
router.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/users/login",
  failureFlash: true
  }),
  function(req, res) {
    res.redirect("/");
});

// logout the user
router.get("/logout", function(req, res) {
  // if user logged in, logout the user
  if (req.user) {
    req.logout();
    
    req.flash("success_msg", "You have been logged out successfully");
    res.redirect("/users/login");  
  }
  else {
    res.redirect("/");
  }

  
})

module.exports = router;