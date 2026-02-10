"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function CameraPage() {
  const [peerId, setPeerId] = useState<string>("");
  const [status, setStatus] = useState("Initializing camera...");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const peerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize and get cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput",
        );
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Error listing devices", err);
      }
    };

    // Request Wake Lock to keep screen alive
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (navigator as any).wakeLock.request("screen");
          console.log("Wake Lock active!");
        }
      } catch (err) {
        console.error("Wake Lock failed:", err);
      }
    };

    getCameras();
    requestWakeLock();
  }, []);

  // Handle camera stream and peer connection
  useEffect(() => {
    if (!selectedDeviceId && devices.length > 0) return; // Wait for selection if devices exist

    const startCamera = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        // Attempt to find any available getUserMedia implementation (includes legacay webkit/moz prefixes)
        const getMedia =
          navigator.mediaDevices && navigator.mediaDevices.getUserMedia
            ? (c: MediaStreamConstraints) =>
                navigator.mediaDevices.getUserMedia(c)
            : // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (navigator as any).webkitGetUserMedia
              ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (c: any) =>
                  new Promise<MediaStream>((resolve, reject) =>
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (navigator as any).webkitGetUserMedia(c, resolve, reject),
                  )
              : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (navigator as any).mozGetUserMedia
                ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (c: any) =>
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

        const constraints = {
          video: selectedDeviceId
            ? { deviceId: { exact: selectedDeviceId } }
            : true,
          audio: true,
        };

        const stream = await getMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Initialize Peer only once or if destroyed
        if (!peerRef.current) {
          const { default: Peer } = await import("peerjs");
          const peer = new Peer();
          peerRef.current = peer;

          peer.on("open", (id) => {
            setPeerId(id);
            setStatus("Ready. Share ID below.");
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          peer.on("call", (call: any) => {
            console.log("Incoming call from viewer");
            setStatus("Viewer connected. Streaming...");
            call.answer(streamRef.current); // Answer with CURRENT stream

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
        } else {
          // If peer already exists, we might need to handle stream replacement for existing calls?
          // For simplicity, we just update the local video.
          // PeerJS doesn't easily support hot-swapping streams in an active call without renegotiation.
          // But calls answered AFTER this will get the new stream.
        }
      } catch (err: Error | unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("Camera access denied or error:", err);
        setStatus("Error accessing camera: " + errorMessage);
      }
    };

    startCamera();

    return () => {
      // Cleanup only on unmount (removed to allow stream persistence across renders if needed)
      // But here we want to restart on device change, so we might stop tracks
      // Actually, we handle track stopping at startCamera beginning
    };
  }, [selectedDeviceId]);

  // Cleanup on final unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerRef.current) {
        peerRef.current.destroy();
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
          <div className="flex flex-col items-end">
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full mb-1 ${status.includes("Error") ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}
            >
              {status}
            </span>
            {devices.length > 0 && (
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="text-xs p-1 border rounded bg-white text-gray-700 max-w-37.5"
              >
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${devices.indexOf(d) + 1}`}
                  </option>
                ))}
              </select>
            )}
          </div>
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
            <code className="flex-1 text-sm font-mono font-bold bg-white px-4 py-2 rounded border border-gray-200 text-gray-700 text-center select-all break-all">
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
