var socket = io();
$('form').submit(function(){
  socket.emit('command', $('#m').val());
  $('#m').val('');
  return false;
});
socket.on('command', function(msg){
  $('#messages').prepend($('<li>').text(msg));
  var count = 0;
  $("li").each(function( index ) {
  count++;
  if(count > 5)
    $( this ).remove();
  });

  if(msg == "/bci_art/svm/done/1") {
  }
});
