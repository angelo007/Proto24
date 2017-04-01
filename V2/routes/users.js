var express = require('express');
var router = express.Router();
var app = express();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user')
var Functions = require('./Functions');
//Register
router.get('/register', ensureLoggedOut, function(req, res){
	var style = Functions.addIn('stylesheet','/css/style.css');
	res.render('register',{title: 'Register',fileType: style[0],filePath: style[1]});
});

//Login
router.get('/login', ensureLoggedOut, function(req, res){
	var style = Functions.addIn('stylesheet','/css/style.css');
	res.render('login',{title: 'Account Login',fileType: style[0],filePath: style[1]});
});
//Register
router.post('/register', function(req, res){
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;
	var dev = req.body.dev;

	//Validation
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Pasword is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();

	if(errors){
		var style = Functions.addIn('stylesheet','/css/style.css');
		res.render('register', {
			errors: errors,
			title: 'Register', 
			fileType: style[0], 
			filePath: style[1]
		});
	}else{
		if(dev=='on'){
			var newUser = new User({
				name: name,
				email: email,
				username: username,
				password: password,
				developer: dev
			});
		}else{
			var newUser = new User({
				name: name,
				email: email,
				username: username,
				password: password
			});
		}

		User.checkEmailTaken(email, function(err, email){
			if(err) throw err;
        	if(email != null){
        		var style = Functions.addIn('stylesheet','/css/style.css');
        		res.render('register', {
					errors: [{param: 'email', msg: 'Email is already in use', value: ''}],
					title: 'Register', 
					fileType: style[0], 
					filePath: style[1]
				});
        	}else{
        		User.getUserByUsername(username, function(err, username){
        			if(err) throw err;
        			if(username != null){
        				var style = Functions.addIn('stylesheet','/css/style.css');
	        			res.render('register', {
							errors: [{param: 'username', msg: 'Username is already taken', value: ''}],
							title: 'Register', 
							fileType: style[0], 
							filePath: style[1]
						});
        			}else{
		        		User.createUser(newUser, function(err, user){
							if(err) throw err;
							console.log(user);
						});
						req.flash('success_msg', 'You are registered and can now login');
						res.redirect('/users/login');
					}
				});
        	}
        });
	}
});

function ensureLoggedOut(req, res, next){
	if(!req.isAuthenticated()){
		return next();
	}else{
		res.redirect('/');
	}
}

passport.use(new LocalStrategy(
  	function(username, password, done) {
 		User.getUserByUsername(username, function(err, user){
 			if(err) throw err;
 			if(!user) return done(null, false, {message: 'Unknown user'});

 			User.comparePassword(password, user.password, function(err, isMatch){
 				if(err) throw err;
 				if(isMatch) 
 					return done(null, user);
 				else{
 					return done(null, false, {message:'Invalid password'});
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

router.post('/login', 
	passport.authenticate('local', 
		{successRedirect: '/', failureRedirect: '/users/login', failureFlash: true}), 
		function (req, res){
			res.redirect('/');
		}
);
router.get('/logout', function(req, res){
	req.logout();
	req.flash('success_msg', 'You are logged out');
	res.redirect('/users/login');
});

module.exports = router;