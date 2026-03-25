"use client"

import { useState } from "react"
import { Camera, Mic, MapPin, ChevronRight, Info, RefreshCw } from "lucide-react"
import InstallPWAButton from '../components/custom/InstallPWAButton';

const colors = {
  bgColor: "#F3F8F6",
  white: "#FFFFFF",
  textColor: "#475467",
  primary2: "#1E5B4F",
  primary3: "#2E8B75",
  primary4: "#8AA39B",
  redColor: "#D64545",
}

type MediaUploadCardProps = {
  title: string
  subtitle: string
  icon: React.ReactNode
  isUploaded?: boolean
  uploadedText?: string
  onClick?: () => void
}

function MediaUploadCard({
  title,
  subtitle,
  icon,
  isUploaded,
  uploadedText,
  onClick,
}: MediaUploadCardProps) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-base font-semibold" style={{ color: colors.primary2 }}>
        {title}
      </p>

      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-2xl p-4 shadow-sm transition hover:shadow-md"
        style={{ backgroundColor: colors.white }}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center">
            <div
              className="mr-3 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: `${colors.primary3}20` }}
            >
              {icon}
            </div>

            <div className="text-left">
              <p className="text-[15px] font-medium" style={{ color: colors.primary2 }}>
                {subtitle}
              </p>

              {isUploaded && (
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-xs font-medium" style={{ color: colors.primary3 }}>
                    ✓ {uploadedText}
                  </span>
                </div>
              )}
            </div>
          </div>

          <ChevronRight size={22} color={colors.primary4} />
        </div>
      </button>
    </div>
  )
}

export default function IncidentReportPage() {
  const [description, setDescription] = useState("")
  const [incidentType, setIncidentType] = useState("")
  const [gpsLocation, setGpsLocation] = useState({ latitude: 27.7172, longitude: 85.324 })
  const [loadingLocation, setLoadingLocation] = useState(false)

  // UI-only mock states
  const [imageUploaded, setImageUploaded] = useState(false)
  const [audioUploaded, setAudioUploaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleMockLocationRefresh = () => {
    setLoadingLocation(true)
    setTimeout(() => {
      setGpsLocation({
        latitude: 27.7 + Math.random() * 0.05,
        longitude: 85.3 + Math.random() * 0.05,
      })
      setLoadingLocation(false)
    }, 600)
  }

  const resetForm = () => {
    setDescription("")
    setIncidentType("")
    setImageUploaded(false)
    setAudioUploaded(false)
  }

  const handleSubmit = () => {
    setSubmitting(true)
    setTimeout(() => setSubmitting(false), 900)
  }

  return (
    <main className="min-h-screen pb-28" style={{ backgroundColor: colors.bgColor }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b px-5 py-4 shadow-sm"
        style={{ backgroundColor: colors.white, borderColor: "#E4ECE8" }}
      >
        <h1 className="text-center text-2xl font-bold" style={{ color: colors.primary2 }}>
          घटना रिपोर्ट
        </h1>
        <p className="text-center text-sm" style={{ color: colors.textColor }}>
          Incident Report
          <InstallPWAButton/>
        </p>

      
      </header>

      <section className="mx-auto w-full max-w-3xl px-4 py-4">
        <MediaUploadCard
          title="फोटो/भिडियो (Photo/Video)"
          subtitle="फोटो तथा भिडियो खिच्नुहोस (Upload photo/video)"
          icon={<Camera size={26} color={colors.primary3} />}
          isUploaded={imageUploaded}
          uploadedText="Image uploaded successfully"
          onClick={() => setImageUploaded((v) => !v)}
        />

        {/* Description */}
        <div className="mb-5">
          <p className="mb-2 text-base font-semibold" style={{ color: colors.primary2 }}>
            विवरण (Description)
          </p>
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="छोटोमा घटनाको विवरण लेख्नुहोस (Write a short description....)"
              className="h-28 w-full resize-none rounded-xl border p-3 text-sm outline-none focus:ring-2"
              style={{
                color: colors.textColor,
                borderColor: "#E4ECE8",
              }}
            />
          </div>
        </div>

        {/* GPS */}
        <div className="mb-5">
          <p className="mb-2 text-base font-semibold" style={{ color: colors.primary2 }}>
            जीपीएस स्थान (GPS Location)
          </p>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <MapPin size={20} color={colors.redColor} />
              <p className="font-medium" style={{ color: colors.primary2 }}>
                Current Location
              </p>
              {loadingLocation && (
                <span className="ml-2 text-xs" style={{ color: colors.primary3 }}>
                  Loading...
                </span>
              )}
            </div>

            <div className="rounded-xl p-3" style={{ backgroundColor: "#F6FAF8" }}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span style={{ color: colors.textColor }}>Latitude:</span>
                <span className="font-semibold" style={{ color: colors.primary3 }}>
                  {gpsLocation.latitude.toFixed(6)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: colors.textColor }}>Longitude:</span>
                <span className="font-semibold" style={{ color: colors.primary3 }}>
                  {gpsLocation.longitude.toFixed(6)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleMockLocationRefresh}
              className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition hover:opacity-90"
              style={{ backgroundColor: `${colors.primary3}20`, color: colors.primary3 }}
            >
              <RefreshCw size={16} />
              Refresh Location
            </button>
          </div>
        </div>

        <MediaUploadCard
          title="अडियो (Audio)"
          subtitle="अडियो रेकर्ड गर्नुहोस (Record Audio)"
          icon={<Mic size={24} color={colors.primary3} />}
          isUploaded={audioUploaded}
          uploadedText="Audio recorded successfully"
          onClick={() => setAudioUploaded((v) => !v)}
        />

        {/* Incident Type */}
        <div className="mb-5">
          <p className="mb-2 text-base font-semibold" style={{ color: colors.primary2 }}>
            घटनाको प्रकार (Incident type)
          </p>
          <select
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value)}
            className="h-12 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none focus:ring-2"
            style={{ borderColor: "#E4ECE8", color: incidentType ? "#101828" : "#98A2B3" }}
          >
            <option value="">Select Incident Type</option>
            <option value="trade">Trade</option>
            <option value="rescue">Rescue</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Disclaimer */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Info size={18} color={colors.primary4} />
            <p className="font-semibold" style={{ color: colors.primary2 }}>
              अस्वीकरण (Disclaimer)
            </p>
          </div>
          <p className="mb-2 text-sm leading-6" style={{ color: colors.textColor }}>
            यस एपले कुनै पनि व्यक्तिगत रूपमा चिनिन सकिने जानकारी सङ्कलन वा साझा गर्दैन। सबै
            रिपोर्टहरू प्रयोगकर्ताको इनपुटमा आधारित हुन्छन् र तिनीहरूको सत्यता प्रमाणित गरिएको
            नहुन सक्छ।
          </p>
          <p className="text-xs italic leading-5" style={{ color: `${colors.textColor}CC` }}>
            This app does not collect or share any personally identifiable information. All
            reports are based solely on user input and may not be verified.
          </p>
        </div>
      </section>

      {/* Bottom Buttons */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t p-3"
        style={{ backgroundColor: colors.white, borderColor: "#E4ECE8" }}
      >
        <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="rounded-2xl py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: colors.redColor }}
          >
            रद्द गर्नुहोस्
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-2xl py-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: colors.primary2 }}
          >
            {submitting ? "पठाउँदै..." : "पठाउनुहोस्"}
          </button>
        </div>
      </div>
    </main>
  )
}