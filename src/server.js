var MongoClient = require('mongodb').MongoClient,
    passport = require('passport'),
    FacebookStrategy = require('passport-facebook').Strategy,
    express = require('express'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    ObjectID = require('mongodb').ObjectID,
    MongoStore = require('connect-mongo')(session),
    cors = require('cors'),
    _ = require("underscore");

var app = express(),
    mongoUri = process.env.MONGOLAB_URI || 'mongodb://localhost/oli2';

app.set('port', (process.env.PORT || 3000));

app.use(express.static('ui'));
app.set('view engine', 'ejs');

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

app.use(cors({
  origin: function(origin, callback) {
    callback(null, true);
  },
  credentials: true
}));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:" + app.get('port') + "/auth/facebook/callback"
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
  passport.authenticate('facebook'),
  function(req, res) {
    res.redirect(req.headers.referer || '/');
  }  
);


app.get('/auth/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


app.get('/api/session', function(req, res){
  res.json({logged_in: !!req.user, user: req.user});
});


var loadMap = function(req, res, callback) {
  try {
    var id = ObjectID(req.params.id);
  } catch (e) {
    return res.status(404).json({'error': 'invalid ID'});
  }
  req.maps.findOne({_id: id}, {}, function(err, map) {
    if (map === null) {
      return res.status(404).json({'error': 'no such map'});      
    } else {
      return callback(map)
    }
  });
};


var convertMap = function(map) {
  map.id = map._id;
  delete map._id;
  return map;
}

var loadMaps = function(req, callback) {
  var q = req.maps.find().project({title: 1, user: 1, _id: 1, created_at: 1, updated_at: 1});
  q.toArray(function(err, maps) {
    callback(maps.map(function(map) { return convertMap(map); }));
  });
}

app.get('/api/maps', function(req, res) {
  loadMaps(req, function(maps) {
    res.json({'maps': maps});
  });
});

app.options('api/maps'); // CORS pre-flight

app.post('/api/maps', function(req, res) {
  if (!req.user) {
    return res.status(403).json({'error': 'You must be signed in to create maps'});
  }
  var data = req.body;
  data._id = new ObjectID();
  data.user = req.user;
  data.created_at = new Date();
  data.updated_at = new Date();
  if (data.id) { delete data.id; }
  if (!data.title) {
    return res.status(400).json({'error': 'Missing a title'});
  }
  req.maps.insertOne(data, function(err, r) {
    if (err != null) {
      return res.status(500).json({'error': err});
    }
    res.json(convertMap(data));
  });
});


app.get('/api/maps/:id', function(req, res) {
  loadMap(req, res, function(map) {
    res.json(convertMap(map));
  });
});

app.options('api/maps/:id'); // CORS pre-flight

app.post('/api/maps/:id', function(req, res) {
  loadMap(req, res, function(map) {
    if (!req.user || req.user.id != map.user.id) {
      return res.status(403).json({'error': 'You cannot edit this map'});
    }
    var data = _.extend({}, map, req.body);
    data.updated_at = new Date();
    data.user = req.user;
    if (data.id) { delete data.id; }
    if (!data.title) {
      return res.status(400).json({'error': 'Missing a title'});
    }
    req.maps.updateOne({_id: map._id}, data, function(err, result) {
      if (err != null) {
        return res.status(500).json({'error': err});
      }
      loadMap(req, res, function(map) {
        res.json(convertMap(map));
      });
    });
    
  });
});

app.get('/', function(req, res) {
  loadMaps(req, function(maps) {
    res.render('index', { maps: maps, user: req.user });
  })
});

app.get('/maps/new', function(req, res) {
  if (!req.user) {
    return res.status(500).json({'error': "You must sign in to create a new map."});
  }
  res.render('newMap', { user: req.user });
});

app.get('/maps/:id', function(req, res) {
  loadMap(req, res, function(map) {
    var isOwner = (req.user && req.user.id == map.user.id);
    res.render('showMap', { map: convertMap(map), isOwner: isOwner });
  });
});

app.use(function(req, res, next) {
  req.db.close();
});


var server = app.listen(app.get('port'), function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Listening at http://%s:%s', host, port);
});
