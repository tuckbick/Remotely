
var sp = getSpotifyApi(),
    models = sp.require("$api/models"),
    player = models.player;

var socket = io.connect('http://localhost:3000');

var room = localStorage.getItem('SpotifyRemoteRoom');

var safe = function(str) {
    return str.toLowerCase()
        .replace(/ /g,'_')
        .replace(/[^\w]+/g,'_')
        .replace(/_{2,}/g, '_');
};




socket.emit('setup_room', room, function(_room) {
    room = _room;
    localStorage.setItem('SpotifyRemoteRoom', room);
});

var get_status = function() {
    var state = null;
    if (player.track) {
        state = {
            playing: player.playing,
            title: player.track.name,
            album: player.track.album.name,
            artist: player.track.artists.join(', ')
        }
    }
    return state;
}

var emit_status = function() {
    var state = get_status();
    console.log('status', state);
    socket.emit('status', [room, state]);
}

socket.on('get_status', emit_status);

socket.on('toggle_play', function() {
    player.playing = !(player.playing);
    emit_status();
});

socket.on('prev', function() {
    player.previous();
    emit_status();
});

socket.on('next', function() {
    player.next();
    emit_status();
});

// player.observe('change', function() {
//     console.log('change!!!');
// });




var $channel = $('#channel'),
    $channel_safe = $('#channel-safe'),
    $save = $('#save');

$channel_safe.text(room);
$channel.val(room);

$channel.on('keyup', function() {
    var chan_in = safe($channel.val());
    $save.prop('disabled', room === chan_in);
    $channel_safe.text(chan_in);
})

$save.on('click', function() {
    var new_room = $channel_safe.text();
    socket.emit('change_room', {
        'old': room,
        'new': new_room
    }, function() {
        room = new_room;
        localStorage.setItem('SpotifyRemoteRoom', room);
        $save.prop('disabled', true);
    });
})








var $phone = $('#phone'),
    $send = $('#send');

var sendPhone = function(e) {
    socket.emit('phone', { room: room, num: $phone.val() });
};

$phone.keyup(function(e){
    if (e.keyCode == 13) {
        sendPhone(e);
    }
});

$send.click(sendPhone);
