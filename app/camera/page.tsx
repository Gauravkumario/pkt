"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function CameraPage() {
  const [peerId, setPeerId] = useState<string>("");
  const [status, setStatus] = useState("Initializing camera...");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let peerInstance: any = null;
    let localStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        // Attempt to find any available getUserMedia implementation (includes legacay webkit/moz prefixes)
        const getMedia =
          navigator.mediaDevices && navigator.mediaDevices.getUserMedia
            ? (c: MediaStreamConstraints) => navigator.mediaDevices.getUserMedia(c)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            : (navigator as any).webkitGetUserMedia
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ? (c: any) =>
                  new Promise<MediaStream>((resolve, reject) =>
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (navigator as any).webkitGetUserMedia(c, resolve, reject),
                  )
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              : (navigator as any).mozGetUserMedia
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ? (c: any) =>
                    new Promise<MediaStream>((resolve, reject) =>
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (navigator as any).mozGetUserMedia(c, resolve, reject),
                    )
                : null;

        if (!getMedia) {
          throw new Error(
            "Camera API missing. Notes: Chrome/iOS requires HTTPS for camera access.",
          );
        }

        const stream = await getMedia({
          video: true,
          audio: true,
        });
        localStream = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const { default: Peer } = await import("peerjs");
        const peer = new Peer();
        peerInstance = peer;

        peer.on("open", (id) => {
          setPeerId(id);
          setStatus("Ready. Share ID below.");
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        peer.on("call", (call: any) => {
          console.log("Incoming call from viewer");
          setStatus("Viewer connected. Streaming...");
          call.answer(stream);

          call.on("close", () => {
            setStatus("Viewer disconnected. Ready.");
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          call.on("error", (e: any) => {
            console.error("Call error:", e);
            setStatus("Connection error: " + e.message);
          });
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        peer.on("error", (err: any) => {
          console.error(err);
          setStatus("Error: " + err.message);
        });

        peer.on("disconnected", () => {
          setStatus("Disconnected from server.");
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Camera access denied or error:", err);
        setStatus("Error accessing camera: " + err.message);
      }
    };

    startCamera();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (peerInstance) {
        peerInstance.destroy();
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
            className={`text-xs font-bold px-2 py-1 rounded-full ${status.includes("Error") ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}
          >
            {status}
          </span>
        </div>

        <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-6 shadow-inner">
          <video
            ref={videoRef}
            muted
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">
            Camera Feed (You)
          </div>
        </div>

        <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <label className="text-xs uppercase tracking-wider text-gray-400 font-bold">
            Your ID Code
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-2xl font-mono font-bold bg-white px-4 py-2 rounded border border-gray-200 text-gray-700 text-center select-all">
              {peerId || "Loading..."}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(peerId);
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Enter this code on the Viewer device to start watching.
          </p>
        </div>
      </div>
    </div>
  );
}
