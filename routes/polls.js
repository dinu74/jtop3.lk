var express = require("express");
var router = express.Router();
var passport = require("passport");
var Poll = require("../models/poll");
var User = require("../models/user");
var mongoose = require("mongoose");

// New Poll page
router.get("/new",  function(req, res) {
  if (req.user) {
    res.render("new");  
  }
  else {
    req.flash("error_msg", "You must be logged in to create a poll");
    res.redirect("/users/login");
  }
});

// Create a new poll
router.post("/new", function(req, res) {
  var title = req.body.title;
  var opts = req.body.options.split(";");
  
  opts = opts.map(function(option) {
    return option.trim();
  });
  
  var options = [];
  for (var i in opts) {
    options.push({"option": opts[i], "vote": 0});
  }
 
  var newPoll = new Poll({
    creator: req.user.id,
    title: title,
    options: options
  });
  
  Poll.createPoll(newPoll, function(err, poll) {
    if (err) throw err;
    console.log(poll);
  });
  
  req.flash("success_msg", "Your poll is created!");
  res.redirect("/");
});

// Remove the poll with the specified poll id
router.use("/remove", function(req, res) {
  var pollId = req.url.substring(1, req.url.length);
  
  // if user not looged in or invalid poll id is given, show error
  if (!req.user || !mongoose.Types.ObjectId.isValid(pollId)) {
    res.render("action", {
      error_msg: "You must be logged in to perform this action"
    });
  }
  else{
    Poll.getPollById(pollId, function(err, poll) {

      if (err || !poll || !poll.creator) {
        res.redirect("/");
      }
      else {
        if (req.user._id == poll.creator) {
          Poll.removePollById(pollId, function(err, msg) {
            if (err) throw err;
            console.log(msg);
            res.render("action", {
              success_msg: "You poll has been removed"
            });
          });
        }
        else {
          res.render("action", {
            error_msg: "You are not authorized to perform this action"
          });
        }  
      }
      
      
    });  
  }
  
});

// Display a particular poll
router.use("/", function(req, res) {
  //console.log(req.method);
  var pollId = req.url.substring(1, req.url.length);
  
  // If its a GET request, show the poll and options
  if (req.method === "GET") {
    
    Poll.getPollById(pollId, function(err, poll) {
      
      // if poll with the given poll id doesn't exist, redirect to homepage
      if (err || !poll) {
        res.redirect("/");
      }
      // poll exist
      else {
        var fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
        
        // poll information to pass to template
        var pollInfo = {title: poll.title, options: poll.options, id: pollId, user: req.user, link: fullUrl};
        var voters = poll.voters;
        
        if (req.user) {
          // Detect whether the current user has voted for this poll or not
          for (var voter in voters) {
            if (voters[voter].voterId == req.user._id) {
              pollInfo.choice = voters[voter].choice;
            }
          }

          if (req.user._id == poll.creator) {
            pollInfo.creatorSession = true;
          }  
        }

        // Generate data for Chartjs
        // code to generate random colors taken from stackoverflow
        function getRandomColor() {
          var letters = '0123456789ABCDEF'.split('');
          var color = '#';
          for (var i = 0; i < 6; i++) {
              color += letters[Math.floor(Math.random() * 16)];
          }
          return color;
        }

        function getRandomColorEachEmployee(count) {
          var data =[];
          for (var i = 0; i < count; i++) {
              data.push(getRandomColor());
          }
          return data;
        }

        var colors = getRandomColorEachEmployee(pollInfo.options.length);

        var votes = [];
        var labels = [];
        for (var i = 0; i < poll.options.length; i++) {
          votes.push(poll.options[i].vote);
          labels.push(poll.options[i].option);
        }

        pollInfo.colors = colors;
        pollInfo.labels = labels;
        pollInfo.votes = votes;
        // End data for Chartjs

        // get the name of the creator and render poll
        User.getUserById(poll.creator, function(err, user) {
          pollInfo.creator = user.name;

          res.render("poll", pollInfo);
        });   
      }
       
    });

  }
  // if method is POST, then user has voted
  else if (req.method === "POST") {
    // get the index of the option selected
    var optionIndex = req.body.options;
    
    // update votes
    Poll.updatePollById(pollId, optionIndex, req.user._id);
   
    // display poll page
    Poll.getPollById(pollId, function(err, poll) {
      if (err) throw err;

      var pollInfo = {title: poll.title, options: poll.options, id: pollId};
      var userId = req.user._id;

      User.getUserById(userId, function(err, user) {
        pollInfo.creator = user.name;
        
        res.redirect("/polls/"+pollId);
      });  
    });
  }
  
});

module.exports = router;