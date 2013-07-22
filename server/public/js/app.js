

var room = window.location.pathname.substr(1),
    socket = io.connect(window.location.origin),
    state = {};

socket.emit('setup_room', room, function() {
    socket.emit('get_status', room);
});

socket.on('status', function(new_state) {
    $('#artwork_img').on('load', function() {
        state = new_state;
        on_art_load(state);
    }).attr('src', new_state.art);
});

var on_art_load = function(state) {
    $('#toggle_play').html(state.playing?'Pause':'Play');
    $('#title').html(state.title);
    $('#artist').html('by '+state.artist);
}

$('#toggle_play').click(function() {
    socket.emit('toggle_play', room);
});

$('#prev').click(function() {
    socket.emit('prev', room);
});

$('#next').click(function() {
    socket.emit('next', room);
});