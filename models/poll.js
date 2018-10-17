var mongoose = require("mongoose");
var User = require("./user");

// Poll Schema
var PollSchema = mongoose.Schema({
  creator: {
    type: String
  },
  title: {
    type: String
  },
  options: [
    {option: String, vote: Number}
  ],
  voters: [
    {voterId: String, choice: String}
  ]
});

var Poll = module.exports = mongoose.model("Poll", PollSchema);

module.exports.createPoll = function(newPoll, callback) {
  newPoll.save(callback);
}

module.exports.getPollById = function(id, callback) {
  Poll.findById(id, callback);
}

module.exports.updatePollById = function(id, optionIndex, userId) {
  // update votes on the given option of the given poll
  Poll.getPollById(id, function(err, pollInfo) {
      
    // increase vote
    var options = pollInfo.options;
    var voters = pollInfo.voters;

    options[optionIndex].vote += 1;
    voters.push({voterId: userId, choice: options[optionIndex].option})

    Poll.update({_id: id}, {options: options, voters: voters}, function(err, data){
      if (err) throw err;
      console.log(data);
    });
  });
}

module.exports.removePollById = function(id, callback) {
  Poll.remove({_id: id}, callback);
}