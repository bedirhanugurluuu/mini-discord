<<<<<<< HEAD
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
=======

const socket = io('https://16.171.193.105:8443', {
  path: '/socket.io', // zorunlu değil ama deneyebilirsin
});

socket.on('connect', () => {
  console.log('Socket.io bağlantısı kuruldu:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('Socket.io bağlantı hatası:', err);
});

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

async function getNoiseSuppressedStream() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  });

  return stream;
}

document.getElementById('joinBtn').onclick = async () => {
  roomId = document.getElementById('roomInput').value.trim();
  userName = document.getElementById('nameInput').value.trim();
  if (!roomId || !userName) return alert("Oda adı ve isim gerekli.");

  // UI geçişi
  document.getElementById('join-section').style.display = 'none';
  document.getElementById('app').style.display = 'block';

  // Mikrofonu al
  localStream = await getNoiseSuppressedStream();
  localVideo.srcObject = localStream;

  // Peer oluştur
  peer = new Peer(undefined, {
    host: '16.171.193.105',
    port: 8443,
    path: '/peerjs',
    secure: true
  });

  peer.on('open', (id) => {
    document.getElementById('my-id').textContent = id;
    socket.emit('join-room', roomId, id, userName);
    console.log('PeerJS ID:', id);
  });

  // Odaya giren diğer kullanıcıları çağır
  let peerNameMap = {}

  function updateUserList() {
    const userList = document.getElementById('users');
    userList.innerHTML = '';
    for (const [id, name] of Object.entries(peerNameMap)) {
      const li = document.createElement('li');
      li.textContent = `${name} (${id.slice(0, 4)})`;
      userList.appendChild(li);
    }
  }

  socket.on('room-users', (peers) => {
    peerNameMap[peer.id] = userName; // Kendini ekle
    updateUserList();

    peers.forEach(({ peerId, userName }) => {
      peerNameMap[peerId] = userName;
      connectToNewUser(peerId);
    });
  });

  // Yeni kullanıcı gelirse
  socket.on('user-joined', ({ peerId, userName }) => {
    console.log(`Yeni kullanıcı katıldı: ${userName} (${peerId})`);
    addMessage('Sistem', `Yeni kullanıcı katıldı: ${userName}`);
    peerNameMap[peerId] = userName;
    updateUserList();
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
    delete peerNameMap[peerId];
    updateUserList();
  });

  // Chat mesajı al
  socket.on('message', ({ name, text }) => {
    addMessage(name, text);
  });

  function addRemoteAudio(peerId, stream) {
    let audio = document.getElementById(`audio-${peerId}`);
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = `audio-${peerId}`;
      audio.autoplay = true;
      audio.controls = true;
      document.body.appendChild(audio);
    }
    audio.srcObject = stream;
  }

  // Gelen aramaya cevap ver
  peer.on('call', (call) => {
    call.answer(localStream);
    call.on('stream', (remoteStream) => {
      addRemoteVideo(call.peer, remoteStream);
      addRemoteAudio(call.peer, remoteStream);

      // Eklenen track'leri dinle
      remoteStream.onaddtrack = (event) => {
        addRemoteVideo(call.peer, remoteStream);
        addRemoteAudio(call.peer, remoteStream);
      };
    });

    connections[call.peer] = call;
  });
};

function addRemoteAudio(peerId, stream) {
  if (document.getElementById(`audio-${peerId}`)) return;
  const audio = document.createElement('audio');
  audio.id = `audio-${peerId}`;
  audio.srcObject = stream;
  audio.autoplay = true;
  audio.playsInline = true;
  document.getElementById('remoteVideos').appendChild(audio);
}

// Yeni kullanıcıya bağlan
function connectToNewUser(peerId) {

  // Her bağlanmadan önce güncel localStream kullan!
  const call = peer.call(peerId, localStream);
  call.on('stream', (remoteStream) => {
    addRemoteAudio(peerId, remoteStream);
    addRemoteVideo(peerId, remoteStream);
  });

  call.on('error', (err) => {
    console.error("PeerJS call error:", err);
  });

  connections[peerId] = call;
}

// Uzak videoyu ekle
function addRemoteVideo(peerId, stream) {
  let video = document.getElementById(`video-${peerId}`);
  if (!video) {
    video = document.createElement('video');
    video.id = `video-${peerId}`;
    video.autoplay = true;
    video.playsInline = true;
    document.body.appendChild(video);
  }
  video.srcObject = stream;
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

    // Eski video track'i localStream'ten kaldır
    const oldVideoTrack = localStream.getVideoTracks()[0];
    if (oldVideoTrack) localStream.removeTrack(oldVideoTrack);

    // Yeni video track'i localStream'e ekle
    localStream.addTrack(videoTrack);
    localVideo.srcObject = localStream;

    // Mevcut tüm bağlantılara video track değişimini bildir
    Object.values(connections).forEach(call => {
      const sender = call.peerConnection.getSenders().find(s => s.track.kind === 'video');
      if (sender) {
        sender.replaceTrack(videoTrack);
      }
    });

    videoTrack.onended = () => {
      console.log("📴 Ekran paylaşımı bitti.");
      // Ekran paylaşımı bittiğinde eski yayına dön
      getFilteredAudioStream().then((newStream) => {
        const dummyTrack = createDummyVideoTrack();
        newStream.addTrack(dummyTrack);
        localStream = newStream;
        localVideo.srcObject = localStream;

        // Bağlantıları resetle ve tekrar bağlan
        Object.keys(connections).forEach(peerId => {
          connections[peerId].close();
          delete connections[peerId];
          connectToNewUser(peerId);
        });
      });
    };
  });

  reconnectWithUpdatedStream();

}

// ID kopyalama
function copyMyId() {
  const idText = document.getElementById('my-id').textContent;
  navigator.clipboard.writeText(idText);
  alert("ID kopyalandı!");
}

function reconnectWithUpdatedStream() {
  Object.keys(connections).forEach(peerId => {
    connections[peerId].close();
    delete connections[peerId];
    connectToNewUser(peerId); // Yeni stream ile yeniden bağlan
  });
}

function createDummyVideoTrack() {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 1, 1);
  const dummyStream = canvas.captureStream();
  return dummyStream.getVideoTracks()[0];
}
>>>>>>> dd67c90 (Initial commit - backend NodeJS peerjs + socket.io)
