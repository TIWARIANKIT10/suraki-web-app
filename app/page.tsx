"use client"

import { useState } from "react"
import { Camera, Mic, MapPin, ChevronRight, Info, RefreshCw, Check } from "lucide-react"
import InstallPWAButton from '../components/custom/InstallPWAButton';
import { useRouter } from 'next/navigation';
import GPSLocation from "@/components/custom/location";
import AudioRecordCard from '../components/custom/audio';
import { useIncidentStore } from "@/lib/store/incidentStore";

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
}: MediaUploadCardProps)



{
const media = useIncidentStore((s) => s.media);
console.log(media)
const click = media == null? false:true;
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
     <div className="flex flex-col">
          { click && (
                      <div className="ml-auto flex items-center gap-1 rounded-full px-2 py-1" style={{ backgroundColor: `${colors.primary3}18` }}>
                        <Check size={12} color={colors.primary3} />
                        <span className="text-xs font-medium" style={{ color: colors.primary3 }}>
                          Saved
                        </span>
                      </div>
                    )}
                    {!click && <ChevronRight size={22} color={colors.primary4} />}
                    </div>
          
        </div>
      </button>
    </div>
  )
}

export default function IncidentReportPage() {  


  
const {setIncidentType,
  setDescription ,reset

} = useIncidentStore()

const store = useIncidentStore();
console.log(store)
  
  
  

  

  // UI-only mock states
  const [imageUploaded, setImageUploaded] = useState(false)
  const [audioUploaded, setAudioUploaded] = useState(false)

  const resetForm = () => {
    setSubmitting(false);
    reset();
  }



  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle"|"success"|"error">("idle")

 const handleSubmit = async () => {
  setSubmitting(true);
  try {
    const { media, description, incidentType, audioBlob, gpsLocation, reset } = store;

    const FILE_URL = process.env.NEXT_PUBLIC_FILE_UPLOAD_URL!;
    const FILE_KEY = process.env.NEXT_PUBLIC_FILE_UPLOAD_KEY!;
    const API_URL  = process.env.NEXT_PUBLIC_API_URL!;

    // ── shared upload helper ──────────────────────────────────
    const uploadFile = async (blob: Blob, filename: string,apiurl:string): Promise<string> => {
      const form = new FormData();
      form.append("files", blob, filename);          // "files" field

      const res = await fetch(apiurl, {
        method: "POST",
        headers: { key: FILE_KEY },                 // no Content-Type — browser sets boundary
        body: form,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data = await res.json();
      const raw = data.url ?? data.file_url ?? data.path;
  const url = Array.isArray(raw) ? raw[0] : raw;

  if (!url) throw new Error(`No URL in response: ${JSON.stringify(data)}`);
  return url as string;
    };

    // ── Step 1: upload audio → array ──────────────────────────
    const voiceUrls: string[] = [];
    if (audioBlob) {
      const url = await uploadFile(audioBlob, "audio.webm",FILE_URL+"/suraki/");
      voiceUrls.push(url);
    }

    // ── Step 2: upload image/video → array ───────────────────
    const mediaUrls: string[] = [];
    if (media) {
      let blob: Blob | null = null;
      let filename = "";

      if (media.type === "photo" && media.dataUrl) {
        blob     = dataUrlToBlob(media.dataUrl);
        filename = `photo-${media.id}.jpg`;
       if (blob) {
        const url = await uploadFile(blob, filename,FILE_URL+"/suraki/");
        mediaUrls.push(url);
      }
      } else if (media.type === "video" && media.blob) {
        blob     = media.blob;
        filename = `video-${media.id}.webm`;
       if (blob) {
        const url = await uploadFile(blob, filename,FILE_URL+"/temp_fon/");
        mediaUrls.push(url);
      }
      }
    }

    // ── Step 3: submit report ─────────────────────────────────
    const payload = {
      description,
      incident_type: incidentType,
      ...(gpsLocation && {
        gps_location: `${gpsLocation.latitude},${gpsLocation.longitude}`,
      }),
      ...(voiceUrls.length  && { voice:voiceUrls[0] }),   // array
      ...(mediaUrls.length  && { image_video:mediaUrls[0] }),   // array
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(JSON.stringify(error));
    }

    setSubmitStatus("success");
    reset();
  } catch (err) {
    console.error(err);
    setSubmitStatus("error");
  } finally {
    setSubmitting(false);
  }
};
  const router = useRouter()
  function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

  return (
    <main className="min-h-screen pb-36" style={{ backgroundColor: colors.bgColor }}>
      
      {/* Header */}
      <header
  className="sticky top-0 z-10 border-b shadow-sm"
  style={{ backgroundColor: colors.white, borderColor: "#E4ECE8" }}
>
  <div className="flex items-center justify-between px-5 py-4">
    
    {/* Left: Install Button */}
    <div>
      <InstallPWAButton />
    </div>

    {/* Center: Title */}
    <div className="text-center flex-1">
      <h1
        className="text-xl sm:text-2xl font-bold"
        style={{ color: colors.primary2 }}
      >
        घटना रिपोर्ट
      </h1>
      <p
        className="text-xs sm:text-sm"
        style={{ color: colors.textColor }}
      >
        Incident Report
      </p>
    </div>

    {/* Right: Empty space (for balance or future icons) */}
    <div className="w-[40px]" />
  </div>
</header>
      <section className="mx-auto w-full max-w-3xl px-4 py-4">
        <MediaUploadCard
          title="फोटो/भिडियो (Photo/Video)"
          subtitle="फोटो तथा भिडियो खिच्नुहोस (Upload photo/video)"
          icon={<Camera size={26} color={colors.primary3} />}
          isUploaded={imageUploaded}
          uploadedText="Image uploaded successfully"
          onClick={() => router.push("/camara")}
        />

         <AudioRecordCard/>

        {/* Description */}
        <div className="mb-5">
          <p className="mb-2 text-base font-semibold" style={{ color: colors.primary2 }}>
            विवरण (Description)
          </p>
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <textarea
              value={store.description}
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

        

      

        {/* Incident Type */}
        <div className="mb-5">
          <p className="mb-2 text-base font-semibold" style={{ color: colors.primary2 }}>
            घटनाको प्रकार (Incident type)
          </p>
          <select
            value={store.incidentType}
            onChange={(e) => setIncidentType(e.target.value)}
            className="h-12 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none focus:ring-2"
            style={{ borderColor: "#E4ECE8", color: store.incidentType ? "#101828" : "#98A2B3" }}
          >
            <option value="">Select Incident Type</option>
            <option value="trade">Trade</option>
            <option value="rescue">Rescue</option>
            <option value="other">Other</option>
          </select>
        </div>
    {/* GPS */}
       <GPSLocation/>
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
        className="fixed bottom-15 left-0 right-0 border-t p-3"
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