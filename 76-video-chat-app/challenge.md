# Build Your Own Video Chat App

This challenge is to build your own video chat application. Video chat apps enable real-time audio and video communication between users over the internet. They use WebRTC (Web Real-Time Communication) technology to establish peer-to-peer connections for low-latency streaming.

Modern video chat applications like Zoom, Google Meet, and Microsoft Teams have become essential tools for remote work, education, and social connection. Building one will teach you about WebRTC, signaling servers, media streaming, and real-time communication.

## The Challenge - Building A Video Chat Application

In this coding challenge we're going to build a simple video chat application that allows two people to connect a call and speak to each other with live audio and video.

There are two obvious approaches you can take for this challenge. Building a chat application that works in the browser using WebRTC, or building a desktop application. For a desktop you could use a video and audio capture library to capture the camera and mic, then establish a direct connection to stream the video and audio.

## Step Zero

For this step you're going to set your environment up, ready to begin developing and testing your solution.

You're probably going to be building a full stack web application - a sensible approach for this coding challenge - so consider the languages and technology stack you're either most comfortable with or want to get more practice using. It all depends whether you're here to learn the tech stack, learn how to build a video chat app, or both!

If full-stack is not your thing, then you could of course build it all in one application as a desktop app too. It's your project, have fun!

**Recommended Stack:**
- **Backend**: Node.js with WebSocket for signaling
- **Frontend**: HTML, CSS, and JavaScript
- **Protocol**: WebRTC for peer-to-peer communication
- **Signaling**: WebSocket for connection establishment

**You'll need:**
- Node.js installed (v14 or higher)
- A modern web browser with WebRTC support (Chrome, Firefox, Safari, Edge)
- Basic understanding of JavaScript and async programming

## Step 1

In this step your goal is to create a way for two users to find each other. In WebRTC terms this is a signalling server. Signalling servers are normally regular HTTP-based Web APIs (i.e. REST) and allow the client applications to relay the necessary information to find and establish a peer connection.

If you're going the WebRTC route read about signalling for WebRTC. If you're building your own solution you simply need a simple solution to allow people to find each other. You can do that via a simple server at a well known address.

**Requirements:**
- Create a WebSocket server using Node.js
- Handle client connections and disconnections
- Implement room-based signaling (users join specific rooms)
- Forward signaling messages between peers in the same room
- Support multiple simultaneous rooms

**Key Concepts:**
- Signaling is the process of coordinating communication to establish a WebRTC connection
- The signaling server doesn't handle media streams, only connection metadata
- You need to exchange SDP (Session Description Protocol) offers and answers
- You also need to exchange ICE (Interactive Connectivity Establishment) candidates

## Step 2

In this step your goal is to capture audio and video on the client application and display it to them locally.

**Requirements:**
- Request permission to access user's camera and microphone using `getUserMedia`
- Capture media stream
- Display local video in a video element
- Handle permission denied scenarios

**Key Concepts:**
- `navigator.mediaDevices.getUserMedia()` captures media
- MediaStream represents audio/video content
- Constraints control video resolution, frame rate, etc.

## Step 3

In this step your goal is to establish the peer-to-peer network connection. Now that your two clients have found each other you should establish a peer to peer connection. The benefit of a peer-to-peer is that the data is private, it's not going through a server in the middle that could be storing the data (it being fully private assumes you are using end-to-end encryption). If you're going the WebRTC route be sure to learn about ICE, STUN and TURN.

At this stage, if you're doing it yourself, you could simply build a simple peer to peer text based chat on top of what you have so far in order to prove you have a working peer-to-peer connection.

**Requirements:**
- Create RTCPeerConnection objects on the client side
- Implement offer/answer exchange using the signaling server
- Handle ICE candidate exchange
- Establish a successful peer-to-peer connection
- Add local media tracks to peer connection

**Key Concepts:**
- WebRTC uses RTCPeerConnection to manage connections
- The "perfect negotiation" pattern helps handle connection setup
- ICE candidates represent possible network routes for connection
- STUN/TURN servers may be needed for NAT traversal

## Step 4

In this step your goal is to play audio and video from the remote client alongside the video from the local client.

**Requirements:**
- Receive remote media tracks via RTCPeerConnection
- Display remote video in a separate video element
- Ensure both local and remote video/audio work simultaneously
- Handle track events properly

**Congratulations!** You now have a simple peer-to-peer video chat application!

## Going Further

It shouldn't take much imagination to see where you can take this. You could aim for the feature set of Zoom or a more niche product like Tuple that combines video chat with pair programming.

**Some ideas to extend your video chat app:**

**Screen Sharing:**
- Add screen sharing capability using `getDisplayMedia`
- Allow switching between camera and screen
- Show indicator when screen is being shared

**Chat Messages:**
- Implement text chat using WebRTC Data Channels
- Show chat panel alongside video
- Persist chat history during session

**Multiple Participants:**
- Support more than 2 participants (mesh or SFU architecture)
- Show all participants in grid layout
- Active speaker detection and highlighting

**Recording:**
- Record video/audio using MediaRecorder API
- Download recorded sessions
- Show recording indicator

**Quality Controls:**
- Adjust video resolution and frame rate
- Switch between different cameras/microphones
- Bandwidth adaptation based on network conditions

**Virtual Backgrounds:**
- Implement background blur using canvas
- Allow custom background images
- Use BodyPix or similar for segmentation

**Production Features:**
- Deploy to cloud platform (Heroku, AWS, Google Cloud)
- Use HTTPS (required for WebRTC in production)
- Set up TURN server for reliable connectivity
- Implement scalable signaling with Redis pub/sub

**Authentication and Security:**
- Add user authentication
- Implement room passwords/access codes
- End-to-end encryption (DTLS-SRTP is included by default)
- Limit room capacity and duration

**UI/UX Enhancements:**
- Add animations and transitions
- Implement drag-and-drop for video layouts
- Add emoji reactions and hand raising
- Implement waiting room and host controls
- Add noise suppression and echo cancellation

## Technical Concepts

### WebRTC Architecture

```
┌─────────────┐         ┌─────────────┐
│   Browser   │         │   Browser   │
│   (Peer A)  │         │   (Peer B)  │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │  ┌─────────────────┐  │
       └──┤  Signaling      ├──┘
          │  Server         │
          │  (WebSocket)    │
          └─────────────────┘
                  │
          (Only for setup)

       │                       │
       └───────────────────────┘
         WebRTC P2P Connection
         (Audio/Video Data)
```

### Key Technologies

- **WebRTC**: Peer-to-peer real-time communication
- **WebSocket**: Signaling channel for connection setup
- **STUN/TURN**: NAT traversal servers
- **SDP**: Session Description Protocol for media negotiation
- **ICE**: Interactive Connectivity Establishment for finding best network path

## Resources

- [WebRTC API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [WebRTC Samples](https://webrtc.github.io/samples/)
- [Perfect Negotiation Pattern](https://w3c.github.io/webrtc-pc/#perfect-negotiation-example)
- [Getting Started with WebRTC](https://www.html5rocks.com/en/tutorials/webrtc/basics/)
- [STUN/TURN Server Setup](https://github.com/coturn/coturn)

## Learning Objectives

Through this challenge you'll learn:

- How WebRTC works and its architecture
- Setting up WebSocket servers for signaling
- Peer-to-peer connection establishment
- Media capture and streaming
- ICE candidate gathering and exchange
- SDP offer/answer negotiation
- Handling real-time communication challenges
- NAT traversal and firewall issues
- Building responsive video interfaces
- Managing connection state and errors

## Challenge Source

This challenge is from [CodingChallenges.fyi](https://codingchallenges.fyi/challenges/challenge-video-chat)
