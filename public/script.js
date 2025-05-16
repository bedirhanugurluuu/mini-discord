const socket = io();
let peer;
let localStream;
let connections = {};
let roomId = '';
let userName = '';

// HTML elementleri
const localVideo = document.getElementById('localVideo');
const remoteVideos = document.getElementById('remoteVideos');
const messageInput = document.getElementById('messageInput');
const messages = document.getElementById('messages');

document.getElementById('joinBtn').onclick = async () => {
  roomId = document.getElementById('roomInput').value.trim();
  userName = document.getElementById('nameInput').value.trim();
  if (!roomId || !userName) return alert("Oda adı ve isim gerekli.");

  // UI geçişi
  document.getElementById('join-section').style.display = 'none';
  document.getElementById('app').style.display = 'block';

  // Peer oluştur
  peer = new Peer();
  peer.on('open', (id) => {
    document.getElementById('my-id').textContent = id;
    socket.emit('join-room', roomId, id);
  });

  // Mikrofonu al
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  localVideo.srcObject = localStream;

  // Odaya giren diğer kullanıcıları çağır
  socket.on('room-users', (peers) => {
    peers.forEach((peerId) => connectToNewUser(peerId));
  });

  // Yeni kullanıcı gelirse
  socket.on('user-joined', (peerId) => {
    connectToNewUser(peerId);
  });

  // Biri ayrıldığında
  socket.on('user-left', (peerId) => {
    if (connections[peerId]) {
      connections[peerId].close();
      const video = document.getElementById(`video-${peerId}`);
      if (video) video.remove();
      delete connections[peerId];
    }
  });

  // Chat mesajı al
  socket.on('message', ({ name, text }) => {
    addMessage(name, text);
  });

  // Gelen aramaya cevap ver
  peer.on('call', (call) => {
    call.answer(localStream);
    call.on('stream', (remoteStream) => {
      addRemoteVideo(call.peer, remoteStream);
    });
    connections[call.peer] = call;
  });
};

// Yeni kullanıcıya bağlan
function connectToNewUser(peerId) {
  const call = peer.call(peerId, localStream);
  call.on('stream', (remoteStream) => {
    addRemoteVideo(peerId, remoteStream);
  });
  connections[peerId] = call;
}

// Uzak videoyu ekle
function addRemoteVideo(peerId, stream) {
  if (document.getElementById(`video-${peerId}`)) return; // tekrar ekleme
  const video = document.createElement('video');
  video.id = `video-${peerId}`;
  video.srcObject = stream;
  video.autoplay = true;
  remoteVideos.appendChild(video);
}

// Mesaj gönder
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  socket.emit('message', { roomId, name: userName, text });
  addMessage(userName, text);
  messageInput.value = '';
}

// Mesajı arayüze ekle
function addMessage(name, text) {
  const msg = document.createElement('div');
  msg.textContent = `${name}: ${text}`;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

// Ekran paylaşımı
function shareScreen() {
  navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).then((screenStream) => {
    const videoTrack = screenStream.getVideoTracks()[0];

    // Yerel ekranda göster
    localVideo.srcObject = screenStream;

    // Her kullanıcıya video track'ini gönder
    Object.values(connections).forEach(call => {
      const sender = call.peerConnection.getSenders().find(s => s.track.kind === 'video');
      if (sender) sender.replaceTrack(videoTrack);
    });

    // Paylaşım bitince geri dön
    videoTrack.onended = () => {
      localVideo.srcObject = localStream;
      Object.values(connections).forEach(call => {
        const sender = call.peerConnection.getSenders().find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(null);
      });
    };
  });
}

// ID kopyalama
function copyMyId() {
  const idText = document.getElementById('my-id').textContent;
  navigator.clipboard.writeText(idText);
  alert("ID kopyalandı!");
}
