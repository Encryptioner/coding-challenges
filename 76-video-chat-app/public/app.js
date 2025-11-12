// Application State
const state = {
    ws: null,
    myId: null,
    roomId: null,
    localStream: null,
    peerConnection: null,
    remotePeerId: null,
    isAudioEnabled: true,
    isVideoEnabled: true
};

// Configuration
const config = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// DOM Elements
const elements = {
    joinSection: document.getElementById('join-section'),
    videoSection: document.getElementById('video-section'),
    errorSection: document.getElementById('error-section'),
    roomInput: document.getElementById('room-input'),
    joinBtn: document.getElementById('join-btn'),
    leaveBtn: document.getElementById('leave-btn'),
    toggleVideoBtn: document.getElementById('toggle-video-btn'),
    toggleAudioBtn: document.getElementById('toggle-audio-btn'),
    copyRoomBtn: document.getElementById('copy-room-btn'),
    retryBtn: document.getElementById('retry-btn'),
    localVideo: document.getElementById('local-video'),
    remoteVideo: document.getElementById('remote-video'),
    remoteVideoContainer: document.getElementById('remote-video-container'),
    currentRoomId: document.getElementById('current-room-id'),
    participantCount: document.getElementById('participant-count'),
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text'),
    remoteStatus: document.getElementById('remote-status'),
    errorMessage: document.getElementById('error-message'),
    videosGrid: document.getElementById('videos-grid')
};

// Initialize Application
function init() {
    // Connect to signaling server
    connectWebSocket();

    // Set up event listeners
    elements.joinBtn.addEventListener('click', handleJoin);
    elements.leaveBtn.addEventListener('click', handleLeave);
    elements.toggleVideoBtn.addEventListener('click', toggleVideo);
    elements.toggleAudioBtn.addEventListener('click', toggleAudio);
    elements.copyRoomBtn.addEventListener('click', copyRoomId);
    elements.retryBtn.addEventListener('click', () => {
        hideError();
        showJoinSection();
    });

    // Handle room ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    if (roomFromUrl) {
        elements.roomInput.value = roomFromUrl;
    }
}

// WebSocket Connection
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    state.ws = new WebSocket(wsUrl);

    state.ws.onopen = () => {
        console.log('WebSocket connected');
        updateConnectionStatus('connected');
    };

    state.ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        console.log('Received message:', message.type);

        switch (message.type) {
            case 'id':
                state.myId = message.id;
                console.log('My ID:', state.myId);
                break;

            case 'joined':
                handleJoined(message);
                break;

            case 'peer-joined':
                handlePeerJoined(message);
                break;

            case 'offer':
                handleOffer(message);
                break;

            case 'answer':
                handleAnswer(message);
                break;

            case 'ice-candidate':
                handleIceCandidate(message);
                break;

            case 'peer-left':
                handlePeerLeft(message);
                break;
        }
    };

    state.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateConnectionStatus('disconnected');
        showError('Connection error. Please refresh the page.');
    };

    state.ws.onclose = () => {
        console.log('WebSocket disconnected');
        updateConnectionStatus('disconnected');
    };
}

// Join Room
async function handleJoin() {
    let roomId = elements.roomInput.value.trim();

    // Generate random room ID if empty
    if (!roomId) {
        roomId = Math.random().toString(36).substring(2, 10);
    }

    try {
        // Get user media
        showToast('Requesting camera and microphone access...', 'info');

        state.localStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: true
        });

        // Display local video
        elements.localVideo.srcObject = state.localStream;

        // Send join message
        sendMessage({
            type: 'join',
            roomId: roomId
        });

        state.roomId = roomId;

    } catch (error) {
        console.error('Error accessing media devices:', error);
        showError('Failed to access camera or microphone. Please check your permissions and try again.');
    }
}

// Handle Joined Response
function handleJoined(message) {
    console.log('Joined room:', message.roomId);
    console.log('Existing peers:', message.peers);

    elements.currentRoomId.textContent = message.roomId;

    // Update URL
    const newUrl = `${window.location.origin}${window.location.pathname}?room=${message.roomId}`;
    window.history.pushState({}, '', newUrl);

    // Show video section
    hideJoinSection();
    showVideoSection();

    updateParticipantCount(message.peers.length + 1);

    // If there are existing peers, create offer
    if (message.peers.length > 0) {
        showToast('Peer found! Connecting...', 'info');
        state.remotePeerId = message.peers[0]; // Connect to first peer
        createPeerConnection();
        createOffer();
    } else {
        showToast('Waiting for someone to join...', 'info');
    }
}

// Handle Peer Joined
function handlePeerJoined(message) {
    console.log('Peer joined:', message.peerId);

    if (!state.peerConnection) {
        showToast('Peer joined! Connecting...', 'success');
        state.remotePeerId = message.peerId;
        createPeerConnection();
    }

    updateParticipantCount(2);
}

// Create Peer Connection
function createPeerConnection() {
    console.log('Creating peer connection');

    state.peerConnection = new RTCPeerConnection(config);

    // Add local stream tracks
    state.localStream.getTracks().forEach(track => {
        state.peerConnection.addTrack(track, state.localStream);
    });

    // Handle ICE candidates
    state.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('Sending ICE candidate');
            sendMessage({
                type: 'ice-candidate',
                candidate: event.candidate,
                targetId: state.remotePeerId
            });
        }
    };

    // Handle remote tracks
    state.peerConnection.ontrack = (event) => {
        console.log('Received remote track');

        if (elements.remoteVideo.srcObject !== event.streams[0]) {
            elements.remoteVideo.srcObject = event.streams[0];
            elements.remoteVideoContainer.style.display = 'block';
            elements.remoteStatus.style.display = 'none';
            elements.videosGrid.classList.add('multi-user');
            showToast('Connected!', 'success');
        }
    };

    // Handle connection state changes
    state.peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', state.peerConnection.connectionState);

        switch (state.peerConnection.connectionState) {
            case 'connected':
                elements.remoteStatus.textContent = 'Connected';
                elements.remoteStatus.style.display = 'none';
                break;
            case 'disconnected':
                elements.remoteStatus.textContent = 'Disconnected';
                elements.remoteStatus.style.display = 'block';
                break;
            case 'failed':
                elements.remoteStatus.textContent = 'Connection Failed';
                elements.remoteStatus.style.display = 'block';
                showToast('Connection failed. Please try again.', 'error');
                break;
            case 'closed':
                elements.remoteStatus.textContent = 'Connection Closed';
                break;
        }
    };

    // Handle ICE connection state
    state.peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', state.peerConnection.iceConnectionState);
    };
}

// Create and Send Offer
async function createOffer() {
    try {
        console.log('Creating offer');

        const offer = await state.peerConnection.createOffer();
        await state.peerConnection.setLocalDescription(offer);

        sendMessage({
            type: 'offer',
            offer: offer,
            targetId: state.remotePeerId
        });

        console.log('Offer sent');
    } catch (error) {
        console.error('Error creating offer:', error);
    }
}

// Handle Received Offer
async function handleOffer(message) {
    console.log('Received offer from:', message.senderId);

    if (!state.peerConnection) {
        state.remotePeerId = message.senderId;
        createPeerConnection();
    }

    try {
        await state.peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));

        const answer = await state.peerConnection.createAnswer();
        await state.peerConnection.setLocalDescription(answer);

        sendMessage({
            type: 'answer',
            answer: answer,
            targetId: message.senderId
        });

        console.log('Answer sent');
    } catch (error) {
        console.error('Error handling offer:', error);
    }
}

// Handle Received Answer
async function handleAnswer(message) {
    console.log('Received answer from:', message.senderId);

    try {
        await state.peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
        console.log('Remote description set');
    } catch (error) {
        console.error('Error handling answer:', error);
    }
}

// Handle ICE Candidate
async function handleIceCandidate(message) {
    console.log('Received ICE candidate');

    if (state.peerConnection) {
        try {
            await state.peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
            console.log('ICE candidate added');
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }
}

// Handle Peer Left
function handlePeerLeft(message) {
    console.log('Peer left:', message.peerId);

    showToast('Peer disconnected', 'info');

    // Clean up peer connection
    if (state.peerConnection) {
        state.peerConnection.close();
        state.peerConnection = null;
    }

    // Hide remote video
    elements.remoteVideoContainer.style.display = 'none';
    elements.remoteVideo.srcObject = null;
    elements.videosGrid.classList.remove('multi-user');

    state.remotePeerId = null;
    updateParticipantCount(1);

    showToast('Waiting for someone to join...', 'info');
}

// Leave Room
function handleLeave() {
    sendMessage({ type: 'leave' });
    cleanup();
    showJoinSection();
    showToast('You left the call', 'info');
}

// Cleanup
function cleanup() {
    // Stop local stream
    if (state.localStream) {
        state.localStream.getTracks().forEach(track => track.stop());
        state.localStream = null;
    }

    // Close peer connection
    if (state.peerConnection) {
        state.peerConnection.close();
        state.peerConnection = null;
    }

    // Reset state
    state.roomId = null;
    state.remotePeerId = null;
    state.isAudioEnabled = true;
    state.isVideoEnabled = true;

    // Clear videos
    elements.localVideo.srcObject = null;
    elements.remoteVideo.srcObject = null;
    elements.remoteVideoContainer.style.display = 'none';
    elements.videosGrid.classList.remove('multi-user');

    // Reset URL
    window.history.pushState({}, '', window.location.pathname);
}

// Toggle Video
function toggleVideo() {
    if (state.localStream) {
        state.isVideoEnabled = !state.isVideoEnabled;

        state.localStream.getVideoTracks().forEach(track => {
            track.enabled = state.isVideoEnabled;
        });

        elements.toggleVideoBtn.classList.toggle('disabled', !state.isVideoEnabled);

        showToast(
            state.isVideoEnabled ? 'Camera enabled' : 'Camera disabled',
            'info'
        );
    }
}

// Toggle Audio
function toggleAudio() {
    if (state.localStream) {
        state.isAudioEnabled = !state.isAudioEnabled;

        state.localStream.getAudioTracks().forEach(track => {
            track.enabled = state.isAudioEnabled;
        });

        elements.toggleAudioBtn.classList.toggle('disabled', !state.isAudioEnabled);

        showToast(
            state.isAudioEnabled ? 'Microphone enabled' : 'Microphone muted',
            'info'
        );
    }
}

// Copy Room ID
function copyRoomId() {
    const roomId = state.roomId;
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

    navigator.clipboard.writeText(url).then(() => {
        showToast('Room link copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy link', 'error');
    });
}

// UI Helper Functions
function showJoinSection() {
    elements.joinSection.style.display = 'flex';
    elements.videoSection.style.display = 'none';
    elements.errorSection.style.display = 'none';
}

function hideJoinSection() {
    elements.joinSection.style.display = 'none';
}

function showVideoSection() {
    elements.videoSection.style.display = 'block';
    elements.errorSection.style.display = 'none';
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorSection.style.display = 'flex';
    elements.joinSection.style.display = 'none';
    elements.videoSection.style.display = 'none';
}

function hideError() {
    elements.errorSection.style.display = 'none';
}

function updateConnectionStatus(status) {
    elements.statusDot.className = `status-dot ${status}`;

    const statusText = {
        connected: 'Connected',
        connecting: 'Connecting...',
        disconnected: 'Disconnected'
    };

    elements.statusText.textContent = statusText[status] || 'Unknown';
}

function updateParticipantCount(count) {
    elements.participantCount.textContent = `${count} participant${count !== 1 ? 's' : ''}`;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    document.getElementById('toast-container').appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function sendMessage(message) {
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
        state.ws.send(JSON.stringify(message));
    } else {
        console.error('WebSocket is not open');
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (state.roomId) {
        sendMessage({ type: 'leave' });
    }
    cleanup();
});
