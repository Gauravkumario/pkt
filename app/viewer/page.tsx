"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function ViewerPage() {
  const [remotePeerId, setRemotePeerId] = useState("");
  const [status, setStatus] = useState("Enter Camera ID to connect");
  const [isConnected, setIsConnected] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const peerInstance = useRef<any>(null);

  const connectToCamera = async () => {
    if (!remotePeerId) {
      setStatus("Please enter a valid ID");
      return;
    }

    setStatus("Connecting to server...");

    try {
      const { default: Peer } = await import("peerjs");
      const peer = new Peer();
      peerInstance.current = peer;

      peer.on("open", () => {
        setStatus("Connection opened. Calling camera...");

        // Create a dummy stream with a black video track to ensure the browser creates a transceiver
        // This solves issues where "receive-only" calls don't trigger the stream event
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "black";
          ctx.fillRect(0, 0, 1, 1);
        }
        const dummyStream = canvas.captureStream(30);

        // Add silent audio track to ensure audio transceiver is created
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const dst = audioCtx.createMediaStreamDestination();
          osc.connect(dst);
          osc.start();
          const audioTrack = dst.stream.getAudioTracks()[0];
          dummyStream.addTrack(audioTrack);
        } catch (e) {
          console.warn("Could not create dummy audio track", e);
        }
        
        const call = peer.call(remotePeerId.trim(), dummyStream);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        call.on("stream", (remoteStream: any) => {
          console.log("Stream received!");
          setStatus("Connected. Streaming video...");
          setIsConnected(true);
          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
            videoRef.current.muted = false; // Ensure audio is on
            // Attempt to play just in case
            videoRef.current
              .play()
              .catch((e) => console.error("Auto-play blocked:", e));
          }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        call.on("error", (err: any) => {
          console.error("Call error:", err);
          setStatus("Call error: " + err.message);
        });

        call.on("close", () => {
          setStatus("Stream ended.");
          setIsConnected(false);
        });
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      peer.on("error", (err: any) => {
        setStatus("Connection error: " + err.message);
        console.error(err);
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setStatus("Failed to load PeerJS: " + err.message);
    }
  };

  const handleDisconnect = () => {
    if (peerInstance.current) {
      peerInstance.current.destroy();
      peerInstance.current = null;
    }
    setIsConnected(false);
    setStatus("Disconnected");
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerInstance.current) {
        peerInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFCF5] p-4 text-gray-800">
      <div className="w-full max-w-2xl bg-white p-4 rounded-2xl shadow-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-800 text-sm font-medium"
          >
            ← Back
          </Link>
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full ${status.includes("error") || status.includes("Failed") ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-700"}`}
          >
            {status}
          </span>
        </div>

        <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-6 shadow-inner flex items-center justify-center">
          {!isConnected && (
            <div className="text-gray-500 text-sm">No Signal</div>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            controls
            className={`w-full h-full object-contain ${isConnected ? "block" : "hidden"}`}
          />
        </div>

        {!isConnected ? (
          <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 transition-all">
            <label className="text-xs uppercase tracking-wider text-gray-400 font-bold">
              Camera ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={remotePeerId}
                onChange={(e) => setRemotePeerId(e.target.value)}
                placeholder="Enter the ID from the Camera device"
                className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
              <button
                onClick={connectToCamera}
                className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-sm"
              >
                Watch
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center p-4">
            <button
              onClick={handleDisconnect}
              className="bg-red-100 hover:bg-red-200 text-red-700 px-8 py-2 rounded-lg font-bold transition-colors border border-red-200"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
