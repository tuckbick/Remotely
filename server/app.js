
/**
 * Module dependencies.
 */

var express = require('express')
  , app = express()
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server, { 'log level': 3 })
  , LastFmNode = require('lastfm').LastFmNode
  , _ = require('underscore')
  , twilio = require('twilio')
  , config = require('./config')
  , client = new twilio.RestClient(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

var lastfm = new LastFmNode({
  api_key: config.LASTFM_API_KEY,
  secret: config.LASTFM_SECRET,
  useragent: 'appname/v0.3 SpotifyRemote'
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/:room', routes.index);

server.listen(process.env.PORT || 3000, function(){
  console.log('Express server listening on port ' + app.get('port'));
});

io.sockets.on('connection', function (socket) {

  socket.on('change_room', function(rooms, res) {
    join(socket, rooms['new']);
    leave(socket, rooms.old);
    res();
  })

  socket.on('setup_room', function(room, res) {
    if (!room) {
      console.error('ERROR: setup_room failed, room was null');
      return;
    }
    join(socket, room);
    res && res(room);
  })

  socket.on('get_status', function(room) {
    get_status(socket, room)
  })

  socket.on('status', function(data) {
    status(socket, data[0], data[1]);
  })

  socket.on('toggle_play', function(room) {
    io.sockets.in(room).emit('toggle_play');
  })

  socket.on('prev', function(room) {
    io.sockets.in(room).emit('prev');
    console.log(socket.id + ' | ' + room + ' | PREV ' +room);
  })

  socket.on('next', function(room) {
    io.sockets.in(room).emit('next');
    console.log(socket.id + ' | ' + room + ' | NEXT ' +room);
  })

  socket.on('phone', function(data) {
    console.log(client);
    console.log('phone', data);
    client.sendSms({
      to: '+1'+data.num,
      from: '+1'+config.TWILIO_NUMBER,
      body: 'Spotify Remote: '+ config.DOMAIN +'/'+data.room
    })
  })

});

var join = function(socket, room) {
  socket.join(room);
  console.log(socket.id + ' | ' + room + ' | JOIN ' +room);
}

var leave = function(socket, room) {
  socket.leave(room);
  console.log(socket.id + ' | ' + room + ' | LEAV ' +room);
}

var toggle_play = function(socket, room) {
  io.sockets.in(room).emit('toggle_play');
  console.log(socket.id + ' | ' + room + ' | PLAY ');
}

var get_status = function(socket, room) {
  io.sockets.in(room).emit('get_status');
  console.log(socket.id + ' | ' + room + ' | STAT?');
}

var status = function(socket, room, data) {
  get_artwork(data.artist, data.album, 'extralarge', function(url) {
    data.art = url
    io.sockets.in(room).emit('status', data);
    console.log(socket.id + ' | ' + room + ' | STAT ' +JSON.stringify(data));
  });
}

var get_artwork = function(artist, album, size, cb) {
  var request = lastfm.request("album.getInfo", {
    artist: artist,
    album: album,
    handlers: {
      success: function(res) {
        console.log(res);
        var art = _.find(res.album.image, function(art, i) {
          return art.size === size
        });
        cb(art['#text'])
      },
      error: function(error) {
        cb('/img/no-album.png')
      }
    }
  });
  return request;
}