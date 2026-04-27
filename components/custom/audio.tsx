import { useEffect, useRef, useState } from "react";
import { Mic, Square, Play, Pause, Trash2, ChevronRight, Check } from "lucide-react";
import { useIncidentStore } from "@/lib/store/incidentStore";

const colors = {
  bgColor: "#F3F8F6",
  white: "#FFFFFF",
  textColor: "#475467",
  primary2: "#1E5B4F",
  primary3: "#2E8B75",
  primary4: "#8AA39B",
  redColor: "#D64545",
};

type RecordingState = "idle" | "recording" | "recorded" | "playing";

export default function AudioRecordCard() {


    const setAudio = useIncidentStore((s) => s.setAudio)
    const audioBlob =  useIncidentStore((s) => s.audioBlob);
    const recordingState =  useIncidentStore((s) => s.recordingState);
    const setRecordingState = useIncidentStore((s)=>s.setRecordingState)
  const [duration, setDuration] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
  const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
  const url = URL.createObjectURL(blob);
  setAudioURL(url);
  setAudio(blob, duration); // ← move here, outside onended
  audioRef.current = new Audio(url);
  audioRef.current.onended = () => {
    setRecordingState("recorded");
    setPlaybackTime(0);
    clearInterval(playbackTimerRef.current!);
  };
  setRecordingState("recorded");
  stream.getTracks().forEach((t) => t.stop());
};

      mediaRecorder.start();
      setDuration(0);
      setRecordingState("recording");

      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone permission.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    clearInterval(timerRef.current!);
  };

  const playAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.play();
    setRecordingState("playing");
    playbackTimerRef.current = setInterval(() => {
      setPlaybackTime(Math.floor(audioRef.current?.currentTime ?? 0));
    }, 500);
  };

  const pauseAudio = () => {
    audioRef.current?.pause();
    setRecordingState("recorded");
    clearInterval(playbackTimerRef.current!);
  };

    const discardRecording = () => {
    setAudio(null, 0) 
    audioRef.current?.pause();
    clearInterval(timerRef.current!);
    clearInterval(playbackTimerRef.current!);
    if (audioURL) URL.revokeObjectURL(audioURL);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setAudioURL(null);
    setDuration(0);
    setPlaybackTime(0);
    setRecordingState("idle");
    setError(null);
  };
 
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current!);
      clearInterval(playbackTimerRef.current!);
      if (audioURL) URL.revokeObjectURL(audioURL);
    };
  }, [audioURL]);

  const isRecorded = recordingState === "recorded" || recordingState === "playing";
  const progressPercent =
    duration > 0 && isRecorded
      ? Math.min((playbackTime / duration) * 100, 100)
      : 0;

  return (
    <div className="mb-5">
      <p className="mb-2 text-base font-semibold" style={{ color: colors.primary2 }}>
        अडियो रेकर्डिङ (Audio Recording)
      </p>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        {/* Icon + Label Row */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              backgroundColor:
                recordingState === "recording"
                  ? `${colors.redColor}18`
                  : `${colors.primary3}18`,
            }}
          >
            <Mic
              size={22}
              color={
                recordingState === "recording" ? colors.redColor : colors.primary3
              }
            />
          </div>
          <div>
            <p className="text-[15px] font-medium" style={{ color: colors.primary2 }}>
              {recordingState === "idle" && "Record Audio"}
              {recordingState === "recording" && "Recording..."}
              {recordingState === "recorded" && "Recording Ready"}
              {recordingState === "playing" && "Playing..."}
            </p>
            <p className="text-xs" style={{ color: colors.primary4 }}>
              {recordingState === "idle" && "Tap the button to start"}
              {recordingState === "recording" && `${formatTime(duration)} elapsed`}
              {isRecorded && `Duration: ${formatTime(duration)}`}
            </p>
          </div>

          {audioBlob && (
            <div className="ml-auto flex items-center gap-1 rounded-full px-2 py-1" style={{ backgroundColor: `${colors.primary3}18` }}>
              <Check size={12} color={colors.primary3} />
              <span className="text-xs font-medium" style={{ color: colors.primary3 }}>
                Saved
              </span>
            </div>
          )}
        </div>

        {/* Recording Pulse Animation */}
      {recordingState === "recording" && (
  <div className="mb-4 flex items-center justify-center gap-1 py-3">
    {[...Array(20)].map((_, i) => (
      <div
        key={i}
        className="rounded-full"
        style={{
          width: 3,
          backgroundColor: colors.redColor,
          height: Math.random() * 28 + 8,
          opacity: 0.6 + Math.random() * 0.4,
          animationName: "pulse",
          animationDuration: `${0.4 + Math.random() * 0.6}s`,
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
          animationDirection: "alternate",
          animationDelay: `${i * 0.05}s`,
        }}
      />
    ))}
    <style>{`@keyframes pulse { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }`}</style>
  </div>
)}
        {/* Playback Progress Bar */}
        {isRecorded && (
          <div className="mb-4">
            <div className="mb-1 h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: `${colors.primary3}20` }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%`, backgroundColor: colors.primary3 }}
              />
            </div>
            <div className="flex justify-between text-xs" style={{ color: colors.primary4 }}>
              <span>{formatTime(playbackTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-3 rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: "#FFF0F0", color: colors.redColor }}>
            ⚠️ {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Start / Stop */}
          {recordingState === "idle" && (
            <button
              onClick={startRecording}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition hover:opacity-90"
              style={{ backgroundColor: colors.primary3, color: colors.white }}
            >
              <Mic size={16} />
              Start Recording
            </button>
          )}

          {recordingState === "recording" && (
            <button
              onClick={stopRecording}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition hover:opacity-90"
              style={{ backgroundColor: colors.redColor, color: colors.white }}
            >
              <Square size={16} />
              Stop Recording
            </button>
          )}

          {/* Play / Pause */}
          {isRecorded && (
            <>
              <button
                onClick={recordingState === "playing" ? pauseAudio : playAudio}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition hover:opacity-90"
                style={{ backgroundColor: colors.primary3, color: colors.white }}
              >
                {recordingState === "playing" ? <Pause size={16} /> : <Play size={16} />}
                {recordingState === "playing" ? "Pause" : "Play"}
              </button>

              <button
                onClick={discardRecording}
                className="flex items-center justify-center rounded-xl p-2.5 transition hover:opacity-90"
                style={{ backgroundColor: `${colors.redColor}15`, color: colors.redColor }}
                title="Discard recording"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}