var MongoClient = require('mongodb').MongoClient,
    passport = require('passport'),
    FacebookStrategy = require('passport-facebook').Strategy,
    express = require('express'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session);
    _ = require("underscore");

var app = express(),
    mongoUri = process.env.MONGOLAB_URI || 'mongodb://localhost/oli2';

app.set('port', (process.env.PORT || 3000));

app.use(express.static('ui'));
app.use(bodyParser.json());
app.use(session({
  store: new MongoStore({url: mongoUri}),
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
  MongoClient.connect(mongoUri, function(err, db) {
    req.db = db;
    req.maps = db.collection('maps');
    next();
  });
});

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    done(null, {
      id: profile.id,
      name: profile.displayName
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/' }));

app.get('/auth/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/auth/session', function(req, res){
  res.json({logged_in: !!req.user, user: req.user});
});

app.get('/api/maps', function (req, res) {
  res.json({message: 'test', user: req.user});
});

app.use(function(req, res, next) {
  req.db.close();
});

var server = app.listen(app.get('port'), function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Listening at http://%s:%s', host, port);
});
