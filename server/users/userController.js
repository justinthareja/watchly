var utils = require('../config/utility');
var User = require('../db/models/user');


module.exports = {
  signin: function (req, res, next) {
    var username = req.body.username,
        password = req.body.password;

    new User({username: username}).fetch().then(function(user){
      if( !user ){  
        res.status(401).send("User not found");
      }
      else {
        user.comparePassword(password, function(match){
          if( match ) {
            utils.createSession(req, res, user);
            res.status(200).send(user);
          } else {
            res.status(401).send("Incorrect password");
          }
        });
      }
   });
  },

  signup: function (req, res, next) {
    var user = req.body;
    new User({ username: user.username }).fetch().then(function(exist) {
      if (!exist) {
        var newUser = new User({
          username: user.username,
          password: user.password,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone
        }).save().then(function(savedUser){
          utils.createSession(req, res, savedUser);
          res.send(savedUser);
        });
      } 
      else {
        console.log('Account already exists');
        res.status(400).send({error: 'Account already exists'});
      }
    });    

  },

  checkAuth: function (req, res, next) {
    // checking to see if the user is authenticated
    // grab the token in the header is any
    // then decode the token, which we end up being the user object
    // check to see if that user exists in the database
  },

  signout: function (req, res, next) {
    req.session.destroy(function(){
      res.redirect('/');
    });
  },

  forgotpassword: function (req, res, next) {
    var email = req.body.email;

    new User({email: email}).fetch().then(function(user){
      if( !user ){  
        res.status(401).send({error: "Unknown user"});
      }
      else {
        console.log("Found user account with the email supplied " + user);
        res.send();
      }

    });
    
  }
};
