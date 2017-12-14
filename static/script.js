var socket = io();
$('form').submit(function(){
  var pak = {
    IP: $('#set_ip').val(),
    out_port: $('#set_out_port').val(),
    in_port: $('#set_in_port').val(),
    num_packets: $('#set_num_packets').val(),
    fps: $('#set_fps').val(),
  };
  socket.emit('command', pak);
  $('#m').val('');
  return false;
});
socket.on('log', function(msg){
  $('#messages').prepend($('<li>').text(msg));
  var count = 0;
  // $("li").each(function( index ) {
  // count++;
  // if(count > 5)
  //   $( this ).remove();
  // });
});
