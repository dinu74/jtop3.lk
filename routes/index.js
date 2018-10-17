var express = require("express");
var router = express.Router();
var Poll = require("../models/poll");
var User = require("../models/user");

// Get My Polls Page
router.get("/mypolls", function(req, res) {
  // if not user is authenticated, show error
  if (!req.user) {
    res.render("login", {
      error_msg: "You must login to see this page"
    });
  }
  // user logged in
  else {
    var userId = req.user.id;

    // find and display all the polls of the currently authenticated user 
    Poll.find().exec(function(err, polls) {
      if (err) throw err;

      var myPolls = [];

      for (var poll in polls) {
        if (polls[poll].creator == userId) {
          myPolls.push(polls[poll]);
        }
      }

      res.render("mypolls", {
        polls: myPolls
      });
    });  
  }
  
});

// Get Homepage
router.get("/", function(req, res) {
  Poll.find().exec(function(err, data) {
    if (err) throw err;

    var titles = [];
    for (var obj in data) {
      titles.push({"title": data[obj].title, id:data[obj]._id});
    }
    res.render("index", {
      titles: titles
    });
  });
});

module.exports = router;