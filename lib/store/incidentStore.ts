import { create } from "zustand"

type GPSLocation = { latitude: number; longitude: number }
type RecordingState = "idle" | "recording" | "recorded" | "playing";

interface CapturedMedia {
  id: string;
  type: "photo" | "video";
  dataUrl?: string;
  blob?: Blob;
  timestamp: number;
} 

type IncidentStore = {
  // ─── State ───────────────────────────────
  media: CapturedMedia | null;
  description: string
  incidentType: string
  audioBlob: Blob | null
  audioDuration: number
  gpsLocation: GPSLocation | null
  recordingState: string

  // ─── Actions ─────────────────────────────
  setDescription: (val: string) => void
  setIncidentType: (val: string) => void
  setAudio: (blob: Blob | null, duration: number) => void
  setGPS: (coords: GPSLocation) => void
  addPhoto: (dataUrl: string) => void
  addVideo: (blob: Blob) => void
  reset: () => void
  setRecordingState:(state:string)=>void
}

const initialState = {
  media: null,
  description: "",
  incidentType: "",
  audioBlob: null,
  audioDuration: 0,
  gpsLocation: null,
   recordingState: "idle"
}

export const useIncidentStore = create<IncidentStore>((set) => ({
  ...initialState,

  setDescription:  (val) => set({ description: val }),
  setIncidentType: (val) => set({ incidentType: val }),
  setAudio:        (blob, duration) => set({ audioBlob: blob, audioDuration: duration }),
  setGPS:          (coords) => set({ gpsLocation: coords }),
  reset:           () => set(initialState),

  addPhoto: (dataUrl) =>
    set({
      media: { id: `photo-${Date.now()}`, type: "photo", dataUrl, timestamp: Date.now() },
    }),

  addVideo: (blob) =>
    set({
      media: { id: `video-${Date.now()}`, type: "video", blob, timestamp: Date.now() },
    }),
    setRecordingState: (state) => set({ recordingState: state })
}))