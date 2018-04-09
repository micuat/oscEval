var socket = io();
var oscMode = true;
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
  //$('#messages').prepend($('<li>').text(msg));
  //var count = 0;
  // $("li").each(function( index ) {
  // count++;
  // if(count > 5)
  //   $( this ).remove();
  // });
});
socket.on('oscmode', function(msg){
  oscMode = msg;
  if(msg == false) {
    // midi mode
    document.title = "MIDI Eval";
    $('#div_ip').remove();
    $('#div_out_port').remove();
    $('#div_in_port').remove();
  }
});
