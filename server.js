// server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = 3000;

// HTML, JS, CSS dosyalarının bulunduğu klasör
app.use(express.static('public'));

// Oda bilgilerini tutmak için basit bir obje
const rooms = {};

io.on('connection', (socket) => {
  console.log('Yeni kullanıcı bağlandı');

  socket.on('join-room', (roomId, peerId) => {
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(peerId);
    socket.join(roomId);

    // Yeni gelen kullanıcıya mevcut kullanıcıları gönder
    socket.emit('room-users', rooms[roomId].filter(id => id !== peerId));

    // Oda üyelerine yeni kullanıcıyı bildir
    socket.to(roomId).emit('user-joined', peerId); 

    // Chat mesajı
    socket.on('message', ({ roomId, name, text }) => {
      io.to(roomId).emit('message', { name, text });
    });

    // Kullanıcı ayrıldığında oda listesinden çıkar
    socket.on('disconnect', () => {
      if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter(id => id !== peerId);
        socket.to(roomId).emit('user-left', peerId);
      }
    });
  });
});

http.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Sunucu çalışıyor: http://localhost:${PORT}`);
});
