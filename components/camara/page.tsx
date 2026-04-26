"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useIncidentStore } from "@/lib/store/incidentStore";


// ─── Zustand Store ────────────────────────────────────────────────────────────


type Mode = "photo" | "video";
type Screen = "LIVE" | "PHOTO_REVIEW" | "VIDEO_REVIEW";

export default function NativeCameraApp() {
  const router = useRouter();

  const { addPhoto, addVideo } = useIncidentStore();

  const videoRef       = useRef<HTMLVideoElement>(null);
  const reviewVideoRef = useRef<HTMLVideoElement>(null); // dedicated review video element
  const recorderRef    = useRef<MediaRecorder | null>(null);
  const streamRef      = useRef<MediaStream | null>(null);
  const chunksRef      = useRef<Blob[]>([]);
  const playbackUrlRef = useRef<string | null>(null);
  const isStartingRef  = useRef(false);

  const [screen, setScreen]           = useState<Screen>("LIVE");
  const [mode, setMode]               = useState<Mode>("photo");
  const [isRecording, setIsRecording] = useState(false);
  const [isBusy, setIsBusy]           = useState(false);

  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob]       = useState<Blob | null>(null);
  const [videoPlaybackUrl, setVideoPlaybackUrl] = useState<string | null>(null);

  const [facing, setFacing]   = useState<"user" | "environment">("environment");
  const [zoom, setZoom]       = useState(1);
  const [recSecs, setRecSecs] = useState(0);
  const [flashBang, setFlashBang] = useState(false);

  // Saved toast state
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isRecording) { setRecSecs(0); return; }
    const t = setInterval(() => setRecSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isRecording]);

  const recLabel = useMemo(() => {
    const m = String(Math.floor(recSecs / 60)).padStart(2, "0");
    const s = String(recSecs % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, [recSecs]);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      (videoRef.current.srcObject as MediaStream | null)
        ?.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setIsBusy(true);

    try {
      stopStream();
      if (playbackUrlRef.current) {
        URL.revokeObjectURL(playbackUrlRef.current);
        playbackUrlRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: mode === "video",
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = "";
        videoRef.current.muted = true;
        videoRef.current.controls = false;
        videoRef.current.srcObject = stream;
        videoRef.current.playsInline = true;
        try {
          await videoRef.current.play();
        } catch (e) {
          if (e instanceof Error && e.name !== "AbortError") throw e;
        }
      }

      setScreen("LIVE");
      setIsRecording(false);
      setPhotoDataUrl(null);
      setVideoBlob(null);
      setVideoPlaybackUrl(null);
      setIsBusy(false);
    } catch (err) {
      console.error(err);
      alert("Camera access denied or unavailable.");
    } finally {
      setIsBusy(false);
      isStartingRef.current = false;
    }
  }, [facing, mode, stopStream]);

  useEffect(() => { startCamera(); }, [startCamera]);

  useEffect(() => () => {
    stopStream();
    if (playbackUrlRef.current) URL.revokeObjectURL(playbackUrlRef.current);
  }, [stopStream]);

  // Auto-play review video when it becomes available
useEffect(() => {
  if (screen === "VIDEO_REVIEW" && reviewVideoRef.current && videoPlaybackUrl) {
    const vid = reviewVideoRef.current;

    vid.srcObject = null; // 🔴 IMPORTANT
    vid.src = videoPlaybackUrl;

    vid.onloadeddata = () => {
      vid.play().catch(() => {});
    };
  }
}, [screen, videoPlaybackUrl]);

  const capturePhoto = useCallback(() => {
  const vid = videoRef.current;
  if (!vid || vid.readyState < 2) return;

  const canvas = document.createElement("canvas");
  canvas.width = vid.videoWidth;
  canvas.height = vid.videoHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  if (facing === "user") {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(vid, 0, 0);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

  // 🔴 STOP CAMERA BEFORE PREVIEW
  stopStream();

  setPhotoDataUrl(dataUrl);
  setScreen("PHOTO_REVIEW");
}, [facing, stopStream]);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];

    const mime = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
      .find((t) => MediaRecorder.isTypeSupported(t)) ?? "";

    const recorder = new MediaRecorder(
      streamRef.current,
      mime ? { mimeType: mime } : undefined
    );
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data?.size > 0) chunksRef.current.push(e.data);
    };
recorder.onstop = () => {
  const blob = new Blob(chunksRef.current, { type: "video/webm" });

  // 🔴 STOP CAMERA FIRST
  stopStream();

  const url = URL.createObjectURL(blob);

  setVideoBlob(blob);
  setVideoPlaybackUrl(url);
  setScreen("VIDEO_REVIEW");
  setIsRecording(false);
};

    recorder.start(1000);
    setIsRecording(true);
  }, [stopStream]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }, []);

  const handleShutter = useCallback(() => {
    if (mode === "photo") {
      capturePhoto();
    } else {
      isRecording ? stopRecording() : startRecording();
    }
  }, [mode, isRecording, capturePhoto, stopRecording, startRecording]);

  const handleSave = useCallback(() => {
    console.log("save button working ")
    if (screen === "PHOTO_REVIEW" && photoDataUrl) {
      addPhoto(photoDataUrl);

    } else if (screen === "VIDEO_REVIEW" && videoBlob) {
      addVideo(videoBlob);
    }
    setSaved(true);
    setTimeout(() => {
      stopStream();
      if (playbackUrlRef.current) {
        URL.revokeObjectURL(playbackUrlRef.current);
        playbackUrlRef.current = null;
      }
      router.push("/");
    }, 900);
  }, [screen, photoDataUrl, videoBlob, addPhoto, addVideo, stopStream, router]);

  const handleDiscard = useCallback(() => {
  setPhotoDataUrl(null);
  setVideoBlob(null);

  if (videoPlaybackUrl) {
    URL.revokeObjectURL(videoPlaybackUrl);
    setVideoPlaybackUrl(null);
  }

  startCamera(); // 🔴 restart camera cleanly
}, [videoPlaybackUrl, startCamera]); 

  const handleBack = () => {
    if (isRecording) stopRecording();
    stopStream();
    if (playbackUrlRef.current) URL.revokeObjectURL(playbackUrlRef.current);
    setTimeout(() => router.push("/"), 80);
  };

  const handleModeSwitch = (m: Mode) => {
    if (isRecording) stopRecording();
    setMode(m);
  };

  const isReview = screen === "PHOTO_REVIEW" || screen === "VIDEO_REVIEW";

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white select-none">

      {/* Live viewfinder — always mounted, hidden during review */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
        style={{
          opacity: isReview ? 0 : 1,
          transform:
            facing === "user" && screen !== "VIDEO_REVIEW"
              ? `scaleX(-1) scale(${zoom})`
              : `scale(${zoom})`,
        }}
      />

      {/* ══════════════════════════════════════════
          PHOTO REVIEW SCREEN
      ══════════════════════════════════════════ */}
      {screen === "PHOTO_REVIEW" && photoDataUrl && (
        <div className="absolute inset-0 z-30 flex flex-col bg-black">

          {/* Fullscreen photo */}
          <div className="relative flex-1 overflow-hidden">
            <img
              src={photoDataUrl}
              alt="Captured photo"
              className="h-full w-full object-contain"
              style={{ animation: "reviewFadeIn 0.35s ease-out" }}
            />

            {/* Top gradient + label */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 to-transparent" />
            <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-12">
              <button
                onClick={handleDiscard}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md active:scale-90 transition-transform"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-white/80 bg-black/30 px-3 py-1 rounded-full backdrop-blur-md">
                📷 Photo Preview
              </span>
              <div className="w-10" />
            </div>

            {/* Saved overlay */}
            {saved && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                style={{ animation: "reviewFadeIn 0.2s ease-out" }}>
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                      stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-white">Photo Saved!</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom action bar */}
          <div className="flex-shrink-0 bg-black px-5 pb-10 pt-5">
            <p className="mb-4 text-center text-xs text-white/40 tracking-wide">
              Choose what to do with this photo
            </p>
            <div className="flex gap-3">

              {/* Discard */}
              <button
                onClick={handleDiscard}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/8 py-4 active:scale-95 transition-transform backdrop-blur-md"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                <span className="text-sm font-semibold text-red-400">Retake</span>
              </button>

              {/* Save / Add */}
              <button
                onClick={handleSave}
                disabled={saved}
                className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-white py-4 active:scale-95 transition-transform disabled:opacity-60"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span className="text-sm font-bold text-black">Add Photo</span>
              </button>

            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          VIDEO REVIEW SCREEN
      ══════════════════════════════════════════ */}
      {screen === "VIDEO_REVIEW" && videoPlaybackUrl && (
        <div className="absolute inset-0 z-30 flex flex-col bg-black">

          {/* Video player area */}
          <div className="relative flex-1 overflow-hidden bg-black">
            <video
              ref={reviewVideoRef}
              playsInline
              controls
              loop
              muted={false}
              className="h-full w-full object-contain"
              style={{ animation: "reviewFadeIn 0.35s ease-out" }}
            />

            {/* Top overlay */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 to-transparent" />
            <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-12 pointer-events-none">
              <div className="w-10" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-white/80 bg-black/30 px-3 py-1 rounded-full backdrop-blur-md">
                🎬 Video Preview
              </span>
              <div className="w-10" />
            </div>

            {/* Back button — pointer events enabled */}
            <button
              onClick={handleDiscard}
              className="absolute top-12 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md active:scale-90 transition-transform"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Saved overlay */}
            {saved && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                style={{ animation: "reviewFadeIn 0.2s ease-out" }}>
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                      stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-white">Video Saved!</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom action bar */}
          <div className="flex-shrink-0 bg-black px-5 pb-10 pt-5">
            <p className="mb-4 text-center text-xs text-white/40 tracking-wide">
              Review your video, then choose an action
            </p>
            <div className="flex gap-3">

              {/* Discard / Retake */}
              <button
                onClick={handleDiscard}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/8 py-4 active:scale-95 transition-transform backdrop-blur-md"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                <span className="text-sm font-semibold text-red-400">Retake</span>
              </button>

              {/* Save / Add */}
              <button
                onClick={handleSave}
                disabled={saved}
                className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-white py-4 active:scale-95 transition-transform disabled:opacity-60"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span className="text-sm font-bold text-black">Add Video</span>
              </button>

            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          LIVE CAMERA UI
      ══════════════════════════════════════════ */}
      {screen === "LIVE" && (
        <>
          {flashBang && (
            <div className="pointer-events-none absolute inset-0 z-50 bg-white"
              style={{ animation: "flash 0.18s ease-out forwards" }} />
          )}

          {/* Top bar */}
          <div className="absolute inset-x-0 top-0 z-40 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-5 pt-12 pb-8">
            <button
              onClick={handleBack}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-md active:scale-90 transition-transform"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
              </svg>
            </button>

            {isRecording && (
              <div className="flex items-center gap-2 rounded-full bg-red-600/90 px-4 py-1.5 font-mono text-sm font-bold backdrop-blur-md">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                {recLabel}
              </div>
            )}

            <button
              onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
              disabled={isBusy || isRecording}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-md active:scale-90 transition-transform disabled:opacity-40"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
            </button>
          </div>

          {/* Zoom strip */}
          {!isRecording && (
            <div className="absolute bottom-36 inset-x-0 z-40 flex justify-center">
              <div className="flex items-center gap-3 rounded-full bg-black/30 px-2 py-1.5 backdrop-blur-md">
                {[1, 1.5, 2].map((z) => (
                  <button
                    key={z}
                    onClick={() => setZoom(z)}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                      zoom === z ? "bg-white text-black" : "text-white/70"
                    }`}
                  >
                    {z}×
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom shutter area */}
          <div className="absolute inset-x-0 bottom-0 z-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-10 pt-10">
            <div className="mb-7 flex justify-center gap-8">
              {(["photo", "video"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => handleModeSwitch(m)}
                  className={`relative pb-1 text-sm font-semibold tracking-widest transition-all ${
                    mode === m
                      ? m === "photo" ? "text-yellow-400" : "text-red-400"
                      : "text-white/50"
                  }`}
                >
                  {m.toUpperCase()}
                  {mode === m && (
                    <span className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full ${
                      m === "photo" ? "bg-yellow-400" : "bg-red-400"
                    }`} />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center">
              <button
                onClick={handleShutter}
                className="relative flex h-20 w-20 items-center justify-center"
              >
                <span className={`absolute inset-0 rounded-full border-4 transition-all duration-200 ${
                  isRecording
                    ? "border-red-500 scale-110"
                    : mode === "video"
                    ? "border-red-400/80"
                    : "border-white"
                }`} />
                <span className={`transition-all duration-200 rounded-full ${
                  isRecording
                    ? "h-9 w-9 rounded-lg bg-red-500"
                    : mode === "video"
                    ? "h-14 w-14 bg-red-500"
                    : "h-14 w-14 bg-white"
                }`} />
              </button>
            </div>

            <p className="mt-4 text-center text-[11px] text-white/35 tracking-wide">
              {mode === "photo"
                ? "Tap to capture"
                : isRecording
                ? "Tap to stop recording"
                : "Tap to start recording"}
            </p>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes flash {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes reviewFadeIn {
          from { opacity: 0; transform: scale(1.03); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}