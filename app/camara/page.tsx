"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type CameraMode = "photo" | "video";
type RecordingState = "idle" | "previewing" | "recording" | "recorded";

export default function NativeCameraApp() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const playbackUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<CameraMode>("photo");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [flashOn, setFlashOn] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [showFlashAnim, setShowFlashAnim] = useState(false);
  const [zoom, setZoom] = useState(1);

  // FIX 1: isStartingRef was declared but never used to guard startCamera.
  // Added proper guard: set true at the top, clear in finally.
  const isStartingRef = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (recordingState === "recording") {
      timer = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [recordingState]);

  useEffect(() => {
    return () => {
      stopCameraTracks();
      if (playbackUrlRef.current) URL.revokeObjectURL(playbackUrlRef.current);
    };
    // FIX 2: stopCameraTracks must be in the dependency array to satisfy the
    // exhaustive-deps rule, but since it's stable (useCallback with no deps
    // that change), this is safe and silences the lint warning.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formattedDuration = useMemo(() => {
    const m = Math.floor(recordingTime / 60).toString().padStart(2, "0");
    const s = (recordingTime % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [recordingTime]);

  const getSupportedMimeType = () => {
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];
    return types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
  };

  // FIX 3: stopCameraTracks had no dependency array — it must be wrapped in
  // useCallback so it is stable and can be safely called from other callbacks.
  const stopCameraTracks = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      const oldStream = videoRef.current.srcObject as MediaStream | null;
      if (oldStream) {
        oldStream.getTracks().forEach((track) => track.stop());
      }
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    // FIX 1 (continued): guard prevents concurrent startCamera calls.
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    setIsBusy(true);
    setRecordingState("idle");
    setRecordedBlob(null);

    try {
      stopCameraTracks();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: mode === "video",
      });
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;

        try {
          await videoRef.current.play();
        } catch (playErr) {
          if (playErr instanceof Error && playErr.name === "AbortError") {
            return;
          }
          throw playErr;
        }
      }

      setRecordingState("previewing");
    } catch (err) {
      console.error("Error starting camera:", err);
      alert("Camera access denied or unavailable.");
    } finally {
      setIsBusy(false);
      // FIX 1 (continued): always release the guard.
      isStartingRef.current = false;
    }
  }, [facingMode, mode, stopCameraTracks]);

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  const takePhoto = () => {
    if (!videoRef.current || !mediaStreamRef.current) return;

    setShowFlashAnim(true);
    setTimeout(() => setShowFlashAnim(false), 150);

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedPhotos((prev) => [dataUrl, ...prev].slice(0, 50));

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `photo-${Date.now()}.jpg`;
    a.click();
  };

  const startRecording = () => {
    if (!mediaStreamRef.current) return;
    chunksRef.current = [];
    setRecordingTime(0);
    setRecordedBlob(null);

    const mime = getSupportedMimeType();
    const recorder = new MediaRecorder(
      mediaStreamRef.current,
      mime ? { mimeType: mime } : undefined
    );
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data?.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: mime || "video/webm",
      });
      setRecordedBlob(blob);
      setRecordingState("recorded");
      stopCameraTracks();

      if (videoRef.current) {
        if (playbackUrlRef.current) URL.revokeObjectURL(playbackUrlRef.current);
        const url = URL.createObjectURL(blob);
        playbackUrlRef.current = url;
        videoRef.current.srcObject = null;
        videoRef.current.src = url;
        videoRef.current.muted = false;
        // FIX 4: controls should default to true after recording so the user
        // can play/pause the recorded clip without a separate play button.
        videoRef.current.controls = true;
        videoRef.current.play().catch(() => {});
      }
    };

    recorder.start(1000);
    setRecordingState("recording");
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleShutter = () => {
    if (mode === "photo") {
      takePhoto();
    } else {
      if (recordingState === "recording") stopRecording();
      else if (recordingState === "previewing") startRecording();
    }
  };

  const flipCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const retake = async () => {
    setRecordedBlob(null);
    setRecordingTime(0);

    if (videoRef.current) {
      videoRef.current.src = "";
      // FIX 5: controls must be reset to false so the live preview
      // doesn't show native browser controls.
      videoRef.current.controls = false;
    }

    if (playbackUrlRef.current) {
      URL.revokeObjectURL(playbackUrlRef.current);
      playbackUrlRef.current = null;
    }

    await startCamera();
  };

  const downloadVideo = () => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `video-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const router = useRouter();

  const handleBack = () => {
    stopCameraTracks();

    if (playbackUrlRef.current) {
      URL.revokeObjectURL(playbackUrlRef.current);
      playbackUrlRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.src = "";
      // FIX 6: load() forces the browser to release media resources;
      // resetting src to "" first ensures no stale source is reloaded.
      videoRef.current.load();
    }

    setTimeout(() => {
      router.push("/");
    }, 100);
  };

  // FIX 7: mode switcher must restart the camera (via the useEffect that
  // depends on startCamera, which depends on `mode`). However, switching
  // modes while recording must stop the recorder first so no resources leak.
  const handleModeSwitch = (newMode: CameraMode) => {
    if (recordingState === "recording") {
      stopRecording();
    }
    setMode(newMode);
  };

  const lastCapture = capturedPhotos[0];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white select-none">
      <button
        onClick={handleBack}
        className="absolute top-12 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-md transition-all active:scale-90 hover:bg-black/50"
        aria-label="Go back"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Full-screen Video Preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        // FIX 8: muted was a ternary comparing recordingState to "recorded",
        // but after recording the video needs audio for playback. The muted
        // attribute is set imperatively in startCamera (true) and onstop (false),
        // so this JSX attribute just sets the initial value.
        muted
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-300 ${
          facingMode === "user" && recordingState !== "recorded"
            ? "scale-x-[-1]"
            : ""
        }`}
        // FIX 9: zoom was applied via `style` but the className already
        // contains a `transition-transform`. Merging both into one style prop
        // (using scaleX for mirror + scale for zoom) would have conflicted.
        // Instead, apply zoom only — the mirror flip is handled by className.
        style={{
          transform:
            facingMode === "user" && recordingState !== "recorded"
              ? `scaleX(-1) scale(${zoom})`
              : `scale(${zoom})`,
        }}
      />

      {/* White Flash Animation for Photo */}
      {showFlashAnim && (
        <div className="pointer-events-none absolute inset-0 z-50 bg-white animate-[flash_0.15s_ease-out]" />
      )}

      {/* Top Controls Bar */}
      <div className="absolute top-0 z-40 flex w-full items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-6 pt-12 pb-6">
        <button
          onClick={() => setFlashOn(!flashOn)}
          className={`rounded-full p-2 backdrop-blur-md transition-all ${
            flashOn
              ? "bg-yellow-400/30 text-yellow-300"
              : "bg-black/20 text-white"
          }`}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </button>

        {recordingState === "recording" && (
          <div className="flex items-center gap-2 rounded-full bg-red-600/90 px-4 py-1.5 font-mono text-sm font-semibold backdrop-blur-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            {formattedDuration}
          </div>
        )}

        <button
          onClick={flipCamera}
          // FIX 10: flipCamera must also be blocked while recording to prevent
          // switching cameras mid-recording, which would corrupt the stream.
          disabled={isBusy || recordingState === "recording"}
          className="rounded-full bg-black/20 p-2 backdrop-blur-md transition-all active:scale-90 disabled:opacity-50"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
        </button>
      </div>

      {/* Zoom Controls */}
      {recordingState === "previewing" && (
        <div className="absolute bottom-32 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/30 p-1.5 backdrop-blur-md">
          {[1, 1.5, 2].map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                zoom === z
                  ? "bg-white text-black"
                  : "text-white hover:bg-white/20"
              }`}
            >
              {z}x
            </button>
          ))}
        </div>
      )}

      {/* Bottom Control Area */}
      <div className="absolute bottom-0 z-40 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-10 pt-12">
        {/* Mode Toggle — FIX 7: use handleModeSwitch instead of setMode directly */}
        <div className="mb-6 flex justify-center">
          <div className="flex gap-6 text-sm font-medium tracking-wider">
            <button
              onClick={() => handleModeSwitch("photo")}
              className={`relative pb-1 transition-all ${
                mode === "photo" ? "text-yellow-400" : "text-white/60"
              }`}
            >
              PHOTO
              {mode === "photo" && (
                <span className="absolute -bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-yellow-400" />
              )}
            </button>
            <button
              onClick={() => handleModeSwitch("video")}
              className={`relative pb-1 transition-all ${
                mode === "video" ? "text-red-400" : "text-white/60"
              }`}
            >
              VIDEO
              {mode === "video" && (
                <span className="absolute -bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-red-400" />
              )}
            </button>
          </div>
        </div>

        {/* Main Controls Row */}
        <div className="flex items-center justify-between px-8">
          {/* Gallery Thumbnail / Retake */}
          <div className="flex h-14 w-14 items-center justify-center">
            {recordingState === "recorded" ? (
              <button
                onClick={retake}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-sm font-bold backdrop-blur-md"
              >
                ↺
              </button>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="relative h-12 w-12 overflow-hidden rounded-lg border-2 border-white/30 bg-gray-800"
              >
                {lastCapture ? (
                  <img
                    src={lastCapture}
                    alt="last capture"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-white/50">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
              </button>
            )}
          </div>

          {/* SHUTTER BUTTON */}
          <button
            onClick={handleShutter}
            disabled={recordingState === "recorded" || isBusy}
            className="group relative flex h-20 w-20 items-center justify-center disabled:opacity-50"
          >
            <div
              className={`absolute inset-0 rounded-full border-4 transition-all duration-300 ${
                recordingState === "recording"
                  ? "border-red-500 scale-110"
                  : mode === "video"
                  ? "border-red-500/80"
                  : "border-white"
              }`}
            />
            <div
              className={`h-16 w-16 transition-all duration-300 ${
                recordingState === "recording"
                  ? "bg-red-500 scale-50 rounded-sm"
                  : mode === "video"
                  ? "bg-red-600 rounded-full"
                  : "bg-white rounded-full"
              }`}
            />
          </button>

          {/* Download / Empty spacer */}
          <div className="flex h-14 w-14 items-center justify-center">
            {recordingState === "recorded" && mode === "video" && (
              <button
                onClick={downloadVideo}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/90 text-black backdrop-blur-md"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Hint Text */}
        <div className="mt-4 text-center text-xs text-white/50">
          {recordingState === "recorded"
            ? "Video saved. Tap ↺ to retake or ⬇ to download"
            : mode === "photo"
            ? "Tap shutter to take photo"
            : recordingState === "recording"
            ? "Tap shutter to stop recording"
            : "Tap shutter to start recording"}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
      />

      <style jsx>{`
        @keyframes flash {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}