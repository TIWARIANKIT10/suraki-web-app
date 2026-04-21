"use client";

/**
 * NativeCameraApp
 *
 * FLOW:
 *  PHOTO:  live → [shutter] → review screen (photo frozen fullscreen)
 *                → [Save]    → addPhoto() in Zustand → router.push("/")
 *                → [Discard] → back to live camera
 *
 *  VIDEO:  live → [shutter] → recording → [shutter] → review screen (video plays back)
 *                → [Save]    → addVideo() in Zustand → router.push("/")
 *                → [Discard] → back to live camera
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { create } from "zustand";

// ─── Zustand Store ────────────────────────────────────────────────────────────
// In your real project move this to e.g. store/useCameraStore.ts

interface CapturedMedia {
  id: string;
  type: "photo" | "video";
  dataUrl?: string; // photo
  blob?: Blob;      // video
  timestamp: number;
}

interface CameraStore {
  media: CapturedMedia[];
  addPhoto: (dataUrl: string) => void;
  addVideo: (blob: Blob) => void;
}

export const useCameraStore = create<CameraStore>((set) => ({
  media: [],
  addPhoto: (dataUrl) =>
    set((s) => ({
      media: [
        { id: `photo-${Date.now()}`, type: "photo", dataUrl, timestamp: Date.now() },
        ...s.media,
      ],
    })),
  addVideo: (blob) =>
    set((s) => ({
      media: [
        { id: `video-${Date.now()}`, type: "video", blob, timestamp: Date.now() },
        ...s.media,
      ],
    })),
}));

// ─── Types ────────────────────────────────────────────────────────────────────
type Mode = "photo" | "video";

// What screen is the user on?
type Screen =
  | "LIVE"          // Camera viewfinder (idle or recording)
  | "PHOTO_REVIEW"  // Frozen photo — save or discard
  | "VIDEO_REVIEW"; // Recorded video playback — save or discard

// ─── Component ────────────────────────────────────────────────────────────────
export default function NativeCameraApp() {
  const router = useRouter();
  const { addPhoto, addVideo } = useCameraStore();

  // Refs
  const videoRef         = useRef<HTMLVideoElement>(null);
  const recorderRef      = useRef<MediaRecorder | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const playbackUrlRef   = useRef<string | null>(null);
  const isStartingRef    = useRef(false);

  // Screen state
  const [screen, setScreen]             = useState<Screen>("LIVE");
  const [mode, setMode]                 = useState<Mode>("photo");
  const [isRecording, setIsRecording]   = useState(false);
  const [isBusy, setIsBusy]             = useState(false);

  // Captured data
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob]       = useState<Blob | null>(null);

  // UI extras
  const [facing, setFacing]             = useState<"user" | "environment">("environment");
  const [zoom, setZoom]                 = useState(1);
  const [recSecs, setRecSecs]           = useState(0);
  const [flashBang, setFlashBang]       = useState(false);

  // ── Recording timer ──────────────────────────────────────────────────────
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

  // ── Stop camera tracks ────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      (videoRef.current.srcObject as MediaStream | null)
        ?.getTracks()
        .forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // ── Start live camera ─────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setIsBusy(true);

    try {
      stopStream();
      // Revoke any leftover playback URL
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
      // Release busy immediately — shutter should be pressable as soon as
      // the video is playing. Don't wait for the finally block.
      setIsBusy(false);
    } catch (err) {
      console.error(err);
      alert("Camera access denied or unavailable.");
    } finally {
      setIsBusy(false);
      isStartingRef.current = false;
    }
  }, [facing, mode, stopStream]);

  // Auto-start camera (and restart when facing/mode changes)
  useEffect(() => {
    startCamera();
  }, [startCamera]);

  // Cleanup on unmount
  useEffect(() => () => {
    stopStream();
    if (playbackUrlRef.current) URL.revokeObjectURL(playbackUrlRef.current);
  }, [stopStream]);

  // ── PHOTO: capture → review ───────────────────────────────────────────────
  const capturePhoto = useCallback(() => {
    const vid = videoRef.current;

    // Guard: video element must exist and have actual video dimensions
    // NOTE: we intentionally do NOT check streamRef here — on some mobile
    // browsers the ref can lag behind; checking videoWidth > 0 is the real
    // signal that the camera is producing frames.
    if (!vid || vid.videoWidth === 0 || vid.readyState < 2) {
      console.warn("capturePhoto: video not ready", {
        vid: !!vid,
        videoWidth: vid?.videoWidth,
        readyState: vid?.readyState,
      });
      return;
    }

    console.log("capturePhoto: capturing", vid.videoWidth, "x", vid.videoHeight);

    // Flash animation
    setFlashBang(true);
    setTimeout(() => setFlashBang(false), 180);

    // Draw current frame to canvas
    const canvas = document.createElement("canvas");
    canvas.width  = vid.videoWidth;
    canvas.height = vid.videoHeight;
    const ctx = canvas.getContext("2d")!;

    // Mirror selfie camera
    if (facing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(vid, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.93);

    // Freeze live feed — keep stream alive so Discard → retake is instant
    vid.pause();

    console.log("capturePhoto: done, switching to PHOTO_REVIEW");
    setPhotoDataUrl(dataUrl);
    setScreen("PHOTO_REVIEW");
  }, [facing]);

  // ── VIDEO: start recording ────────────────────────────────────────────────
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
      const blob = new Blob(chunksRef.current, { type: mime || "video/webm" });

      // Stop live stream — we no longer need it
      stopStream();

      // Attach blob for playback
      const url = URL.createObjectURL(blob);
      playbackUrlRef.current = url;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = url;
        videoRef.current.muted = false;
        videoRef.current.controls = true;
        videoRef.current.loop = true;
        videoRef.current.play().catch(() => {});
      }

      setVideoBlob(blob);
      setIsRecording(false);
      setScreen("VIDEO_REVIEW");
    };

    recorder.start(1000);
    setIsRecording(true);
  }, [stopStream]);

  // ── VIDEO: stop recording → triggers recorder.onstop above ───────────────
  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }, []);

  // ── Shutter press ─────────────────────────────────────────────────────────
  const handleShutter = useCallback(() => {
    console.log("handleShutter:", { mode, isRecording, screen });
    if (mode === "photo") {
      capturePhoto();
    } else {
      isRecording ? stopRecording() : startRecording();
    }
  }, [mode, isRecording, screen, capturePhoto, stopRecording, startRecording]);

  // ── SAVE ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (screen === "PHOTO_REVIEW" && photoDataUrl) {
      addPhoto(photoDataUrl);
    } else if (screen === "VIDEO_REVIEW" && videoBlob) {
      addVideo(videoBlob);
    }
    // Clean up and go home
    stopStream();
    if (playbackUrlRef.current) {
      URL.revokeObjectURL(playbackUrlRef.current);
      playbackUrlRef.current = null;
    }
    router.push("/");
  }, [screen, photoDataUrl, videoBlob, addPhoto, addVideo, stopStream, router]);

  // ── DISCARD → back to live camera ────────────────────────────────────────
  const handleDiscard = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.controls = false;
      videoRef.current.loop     = false;
      videoRef.current.src      = "";
    }
    startCamera();
  }, [startCamera]);

  // ── Helpers ───────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white select-none">

      {/* ══════════════════════════════════════════════════
          VIDEO ELEMENT — live viewfinder AND playback
      ══════════════════════════════════════════════════ */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          transform:
            facing === "user" && screen !== "VIDEO_REVIEW"
              ? `scaleX(-1) scale(${zoom})`
              : `scale(${zoom})`,
        }}
      />

      {/* ══════════════════════════════════════════════════
          PHOTO REVIEW OVERLAY
          Sits on top of everything when screen = PHOTO_REVIEW
      ══════════════════════════════════════════════════ */}
      {screen === "PHOTO_REVIEW" && photoDataUrl && (
        <div className="absolute inset-0 z-30">
          {/* Fullscreen photo */}
          <img
            src={photoDataUrl}
            alt="Review"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* Top dim + label */}
          <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/70 to-transparent" />
          <p className="absolute top-14 inset-x-0 text-center text-xs font-semibold tracking-[0.18em] uppercase text-white/70">
            Review Photo
          </p>

          {/* ── Save / Discard bar ── */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-6 pb-14 pt-20">
            <div className="flex gap-4">

              {/* Discard */}
              <button
                onClick={handleDiscard}
                className="
                  flex flex-1 flex-col items-center justify-center gap-2
                  rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md
                  py-5 active:scale-95 transition-transform
                "
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                <span className="text-sm font-medium text-white/80">Discard</span>
              </button>

              {/* Save */}
              <button
                onClick={handleSave}
                className="
                  flex flex-[2] flex-col items-center justify-center gap-2
                  rounded-2xl bg-white
                  py-5 active:scale-95 transition-transform
                "
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span className="text-sm font-semibold text-black">Save Photo</span>
              </button>

            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          VIDEO REVIEW — Save / Discard bar only
          (the video plays back through the <video> element)
      ══════════════════════════════════════════════════ */}
      {screen === "VIDEO_REVIEW" && (
        <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-6 pb-14 pt-20">

          {/* Review label */}
          <p className="mb-5 text-center text-xs font-semibold tracking-[0.18em] uppercase text-white/60">
            Review Video
          </p>

          <div className="flex gap-4">

            {/* Discard */}
            <button
              onClick={handleDiscard}
              className="
                flex flex-1 flex-col items-center justify-center gap-2
                rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md
                py-5 active:scale-95 transition-transform
              "
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              <span className="text-sm font-medium text-white/80">Discard</span>
            </button>

            {/* Save */}
            <button
              onClick={handleSave}
              className="
                flex flex-[2] flex-col items-center justify-center gap-2
                rounded-2xl bg-white
                py-5 active:scale-95 transition-transform
              "
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span className="text-sm font-semibold text-black">Save Video</span>
            </button>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          LIVE CAMERA UI  (hidden during review screens)
      ══════════════════════════════════════════════════ */}
      {screen === "LIVE" && (
        <>
          {/* Flash bang */}
          {flashBang && (
            <div className="pointer-events-none absolute inset-0 z-50 animate-[flash_0.18s_ease-out] bg-white" />
          )}

          {/* ── Top bar ── */}
          <div className="absolute inset-x-0 top-0 z-40 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-5 pt-12 pb-8">
            {/* Back */}
            <button
              onClick={handleBack}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-md active:scale-90 transition-transform"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Recording badge */}
            {isRecording && (
              <div className="flex items-center gap-2 rounded-full bg-red-600/90 px-4 py-1.5 font-mono text-sm font-bold backdrop-blur-md">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                {recLabel}
              </div>
            )}

            {/* Flip camera */}
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

          {/* ── Zoom strip ── */}
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

          {/* ── Bottom shutter area ── */}
          <div className="absolute inset-x-0 bottom-0 z-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-10 pt-10">

            {/* Mode toggle */}
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

            {/* Shutter row */}
            <div className="flex items-center justify-center">
              <button
                onClick={handleShutter}
                className="relative flex h-20 w-20 items-center justify-center"
              >
                {/* Outer ring */}
                <span className={`absolute inset-0 rounded-full border-4 transition-all duration-200 ${
                  isRecording
                    ? "border-red-500 scale-110"
                    : mode === "video"
                    ? "border-red-400/80"
                    : "border-white"
                }`} />
                {/* Inner fill */}
                <span className={`transition-all duration-200 rounded-full ${
                  isRecording
                    ? "h-9 w-9 rounded-lg bg-red-500"   // square-ish = stop
                    : mode === "video"
                    ? "h-14 w-14 bg-red-500"             // red circle = record
                    : "h-14 w-14 bg-white"               // white circle = photo
                }`} />
              </button>
            </div>

            {/* Hint */}
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

      {/* Back button visible during review too */}
      {isReview && (
        <button
          onClick={handleBack}
          className="absolute top-12 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md active:scale-90 transition-transform"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <style jsx>{`
        @keyframes flash {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
      `}</style>
    </div>
  );
}