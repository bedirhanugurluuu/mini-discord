<<<<<<< HEAD
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
=======
const fs = require('fs');
const https = require('https');
const express = require('express');
const { ExpressPeerServer } = require('peer');
const socketIO = require('socket.io');
const path = require('path');

const app = express();

// HTTPS sertifika dosyalarını oku
const options = {
  key: fs.readFileSync('./ssl/key.pem'),
  cert: fs.readFileSync('./ssl/cert.pem'),
};

// HTTPS sunucusu oluşturr
const httpsServer = https.createServer(options, app);

// Socket.io başlat
const io = require('socket.io')(httpsServer, {
    cors: {
      origin: "https://16.171.193.105:8443",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

// PeerJS sunucusu
const peerServer = ExpressPeerServer(httpsServer, {
  debug: true,
  path: '/',
});
app.use('/peerjs', peerServer);

// Statik dosyalar
app.use(express.static(path.join(__dirname, 'public')));

// Ana sayfa yönlendirmesi
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io bağlantı işlemleri
const rooms = {};

// Bu en üste, io.on'dan DIŞARI yazılır
const usersInRooms = {}; // Kalıcı olarak odaları ve kullanıcıları burada tutar

io.on('connection', socket => {
  socket.on('join-room', (roomId, peerId, userName) => {
    console.log('Join room verisi:', { roomId, peerId, userName });
    socket.join(roomId);

    if (!usersInRooms[roomId]) usersInRooms[roomId] = {};
    usersInRooms[roomId][socket.id] = { peerId, userName };

    const otherUsers = Object.entries(usersInRooms[roomId])
      .filter(([sid]) => sid !== socket.id)
      .map(([_, u]) => ({ peerId: u.peerId, userName: u.userName }));
    socket.emit('room-users', otherUsers);

    socket.to(roomId).emit('user-joined', { peerId, userName });

    socket.on('message', ({ roomId, name, text }) => {
      io.to(roomId).emit('message', { name, text });
    });

    socket.on('disconnect', () => {
      if (usersInRooms[roomId]) {
        const leftUser = usersInRooms[roomId][socket.id];
        delete usersInRooms[roomId][socket.id];
        socket.to(roomId).emit('user-left', leftUser.peerId);
        if (Object.keys(usersInRooms[roomId]).length === 0) {
          delete usersInRooms[roomId];
        }
      }
    });
  });
});

// Sunucuyu başlat
httpsServer.listen(8443, '0.0.0.0', () => {
    console.log('Sunucu çalışıyor...');
  });

>>>>>>> dd67c90 (Initial commit - backend NodeJS peerjs + socket.io)
