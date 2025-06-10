// Define required DOM elements and variables
const signalBox = document.getElementById('signalBox');
const signalModal = document.getElementById('signalModal');
const remoteCanvas = document.getElementById('remoteCanvas');
const remoteCtx = remoteCanvas ? remoteCanvas.getContext('2d') : null;
let localStream = null;
let peer = null;
let username = window.username || ''; // Set this appropriately in your app
let remoteUser = window.remoteUser || ''; // Set this appropriately in your app
const answerBtn = document.getElementById('answerBtn');
function enableBtn(btn) {
  if (btn) btn.disabled = false;
}

// Helpers for localStorage signaling
function saveSignalToStorage(signal) {
  localStorage.setItem('webrtc-signal', signal);
}
function loadSignalFromStorage() {
  return localStorage.getItem('webrtc-signal') || '';
}
function clearSignalFromStorage() {
  localStorage.removeItem('webrtc-signal');
}

// Update signalBox when modal is shown
function showSignalModal() {
  signalBox.value = loadSignalFromStorage();
  signalModal.classList.remove('hidden');
}
function hideSignalModal() {
  signalModal.classList.add('hidden');
}

// Update makeCall, answerCall, pasteSignal to use localStorage
async function makeCall() {
  if (username !== 'sam') {
    alert('Only "sam" can initiate the call.');
    return;
  }
  peer = new RTCPeerConnection();
  for (let track of localStream.getTracks()) {
    peer.addTrack(track, localStream);
  }
  peer.ontrack = ({ streams: [stream] }) => {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    video.onplay = () => {
      (function drawRemote() {
        remoteCtx.drawImage(video, 0, 0, remoteCanvas.width, remoteCanvas.height);
        requestAnimationFrame(drawRemote);
      })();
    };
  };
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  const signal = JSON.stringify({ from: username, to: remoteUser, sdp: peer.localDescription });
  saveSignalToStorage(signal);
  signalBox.value = signal;
  showSignalModal();
  enableBtn(answerBtn);
}

async function answerCall() {
  if (username !== 'omenda') {
    alert('Only "omenda" can answer the call.');
    return;
  }
  let data;
  try {
    data = JSON.parse(signalBox.value);
    if (data.to !== username || data.from !== remoteUser) throw new Error();
  } catch {
    alert('Invalid or unauthorized SDP data!');
    return;
  }
  peer = new RTCPeerConnection();
  for (let track of localStream.getTracks()) {
    peer.addTrack(track, localStream);
  }
  peer.ontrack = ({ streams: [stream] }) => {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    video.onplay = () => {
      (function drawRemote() {
        remoteCtx.drawImage(video, 0, 0, remoteCanvas.width, remoteCanvas.height);
        requestAnimationFrame(drawRemote);
      })();
    };
  };
  await peer.setRemoteDescription(data.sdp);
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  const signal = JSON.stringify({ from: username, to: remoteUser, sdp: peer.localDescription });
  saveSignalToStorage(signal);
  signalBox.value = signal;
  showSignalModal();
}

async function pasteSignal() {
  let data;
  try {
    data = JSON.parse(signalBox.value);
    if (data.to !== username || data.from !== remoteUser) throw new Error();
  } catch {
    alert('Invalid or unauthorized SDP data!');
    return;
  }
  await peer.setRemoteDescription(data.sdp);
  hideSignalModal();
  clearSignalFromStorage();
  alert('Call established!');
}

// Example: getUserMedia to initialize localStream (must be called before makeCall/answerCall)
async function initLocalStream() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  } catch (err) {
    alert('Could not access camera/microphone: ' + err.message);
  }
}
initLocalStream();

// Optionally, update signalBox on input to keep localStorage in sync
signalBox.oninput = () => {
  saveSignalToStorage(signalBox.value);
};
