import { create } from "zustand"

type GPSLocation = { latitude: number; longitude: number }

type IncidentStore = {
  // ─── State ───────────────────────────────
  description: string
  incidentType: string
  imageFile: File | null
  audioBlob: Blob | null
  audioDuration: number
  gpsLocation: GPSLocation | null

  // ─── Actions ─────────────────────────────
  setDescription: (val: string) => void
  setIncidentType: (val: string) => void
  setImage: (file: File | null) => void
  setAudio: (blob: Blob | null, duration: number) => void
  setGPS: (coords: GPSLocation) => void
  reset: () => void
}

const initialState = {
  description: "",
  incidentType: "",
  imageFile: null,
  audioBlob: null,
  audioDuration: 0,
  gpsLocation: null,
}

export const useIncidentStore = create<IncidentStore>((set) => ({
  ...initialState,

  setDescription:  (val) => set({ description: val }),
  setIncidentType: (val) => set({ incidentType: val }),
  setImage:        (file) => set({ imageFile: file }),
  setAudio:        (blob, duration) => set({ audioBlob: blob, audioDuration: duration }),
  setGPS:          (coords) => set({ gpsLocation: coords }),
  reset:           () => set(initialState),
}))