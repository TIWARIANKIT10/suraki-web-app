import { CircleUserRound } from "lucide-react"

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[#0B3D2E] px-4 pb-24 pt-8 text-white">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center">
        <section className="w-full rounded-2xl border border-white/15 bg-[#14532D] p-6 shadow-xl backdrop-blur-sm md:p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
            <CircleUserRound className="h-9 w-9 text-white" />
          </div>

          <h1 className="text-center text-2xl font-bold tracking-tight md:text-3xl">
            प्रोफाइल
          </h1>

          <p className="mt-4 text-center text-lg font-medium text-white">
            युजरको प्रोफाइल उपलब्ध छैन।
          </p>

          <p className="mt-2 text-center text-sm text-white/75">
            User profile is not available.
          </p>

          <div className="mt-6 rounded-xl border border-amber-300/30 bg-amber-400/10 p-3 text-center text-sm text-amber-100">
            कृपया लग-इन गर्नुहोस् वा पछि पुन: प्रयास गर्नुहोस्।
          </div>
        </section>
      </div>
    </main>
  )
}