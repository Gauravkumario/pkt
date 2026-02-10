# Simple P2P Security Camera

A lightweight, web-based video streaming application using WebRTC (PeerJS).

## Features

- **Camera Mode**: Turns the device into a security camera (Audio + Video). Generates a unique ID.
- **Viewer Mode**: Connects to the camera using the ID to view the stream.
- **Privacy**: P2P connection. Video goes directly between devices.

## How to use

1. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
2. Open the app on two devices (or two browser windows) connected to the internet.
   - Note: For devices on different networks, PeerJS mostly works, but sometimes symmetric NATs block P2P. A TURN server is needed for 100% reliability, but this demo uses the public PeerJS STUN servers which work for most cases.

3. **Device A (Camera)**:
   - Select "Camera Mode".
   - Allow camera/microphone access.
   - Copy the "Your ID Code".

4. **Device B (Viewer)**:
   - Select "Viewer Mode".
   - Enter the ID Code from Device A.
   - Click "Watch".

## Deployment

can be deployed to Vercel/Netlify. Since it uses client-side WebRTC, it works on serverless platforms.
Note: You need HTTPS for camera access on non-localhost devices.
