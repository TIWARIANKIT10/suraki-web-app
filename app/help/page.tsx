"use client"

import { useState } from "react"
import Link from "next/link"
import { MapPin, Mail, Phone, ChevronDown, ChevronUp } from "lucide-react"

const colors = {
  bgColor: "#0B3D2E",
  primary2: "#14532D",
  primary4: "#2F6B4B",
  white: "#FFFFFF",
  textColor: "#E5F7EC",
}

const faqs = [
  {
    question:
      "यो ‘सुराकी’ एप किन बनाइएको हो ?\nWhy is 'Suraki' application developed?",
    answer:
      "वन्यजन्तु तथा बन सम्बन्धित घट्ने अवैध घटनाहरुको विवरण सम्वन्धित निकायमा समयमै जानकारी दिएर, दोषी लाई कारबाहीको दाएरामा लिन तथा प्रचलित कानुन बमोजिम कारबाही अघि बढाउन मद्दत गर्ने उदेश्यले यो ‘सुराकी’ एप बनाइएको हो। अन्य गैरकानुनी घटनाहरु पनि रिपोर्ट गर्न भने सकिन्छ।\nThis application is primarily developed to penalize the culprit of wildlife and forest related crimes according to rule of law by reporting the crimes anonymously. Other crimes can also be reported.",
  },
  {
    question: "सुराकी एप कसरी प्रयोग गर्ने?\nHow to use SURAKI application?",
    answer:
      "गुगल प्लेस्टोरबाट एप डाउनलोड गर्ने, एप खोल्ने, आफ्नो फोनको जी.पी.एस. अन गर्ने अनि वन वा वन्यजन्तु सम्बन्धित घटनाहरुको फोटो, भिडियो तथा आवाज रेकर्ड गरि इन्टरनेटको माध्यमबाट सम्बन्धित निकाएलाइ जानकारी गरिदिने | आफ्नो खाता बनाउन, घटनाको विवरण भर्न तथा गोप्यरुपमा पठाउन सकिन्छ|\nDownload the application using Google Play store or this link (………), open it, turn on location of your device and you can immediately report wildlife/ forest related crime by uploading photos, videos or audios using internet. Users can make an account, write description of the incidents, or send the media anonymously.",
  },
  {
    question: "जीपीएस कसरी सुचारु गर्ने?\nHow to activate GPS ?",
    answer:
      "‘सुराकी’ एप खोल्दा जीपीएस सुचारु गर्न सुचना आउछ, त्यसमा सुचारु गर्नुहोस् मा थिच्नुहोस्|\nAfter opening the application a dialogue box appears with options to activate GPS, click on activate GPS.",
  },
  {
    question: "यो एप कसले बनाएको हो?\nWho developed this application?",
    answer:
      "यो ‘सुराकी’ एप राष्ट्रिय निकुञ्ज तथा वन्यजन्तु संरक्षण विभाग, वन तथा भू-संरक्षण विभाग, प्रकृतिका साथीहरू, रुफोर्ड फाउन्डेसन र राष्ट्रिय आविष्कार केन्द्रको संयुक्त  प्रयासमा बनेको हो |\nThe application is jointly developed in collaboration with Department of National Parks and Wildlife Conservation, Department of Forests and Soil, Friends of Nature (FON Nepal), Rufford Foundation, and National Innovation Center with an aim to curb illegal wildlife and forest related incidents by timely reporting and interventions.",
  },
  {
    question:
      "यो एपले कसरि वन्यजन्तु  तथा वन सम्बन्धित कसुर कम गर्न मद्दत गर्दछ?\n• How does the mobile application contribute to curbing illegal wildlife and forest related crimes?",
    answer:
      "वन्यजन्तु तथा बन सम्बन्धि घट्ने अवैध घटनाहरूलाई एप मार्फत गोप्य रूपमा जानकारीहरु  डिभिजन वन कार्यालय, संरक्षण कार्यालयहरु तथा जिल्ला प्रहरीमा जाने गर्छ | यसबाट कानुनी कारवाहीगर्न सहज र छिटो हुन्छ\nThis application is designed to quickly report crimes related to wildlife and forest of user’s locality. The report is sent to Divisional Forest Office and District Police anonymously.",
  },
  {
    question:
      "गैरकानुनी कामहरु भएको थाहापाए कसरि रिपोर्ट गर्ने?\nCan I report illegal activities through the app? How?",
    answer:
      "घटनास्थलमै खिचेको फोटो/ भिडियो सिधै पठाउन या खिचिसकेपछि ग्यालरीबाट पनि पठाउन सकिन्छ | यसको लागि इन्टरनेट जडान भएको हुनु पर्दछ |\nYes, the user can report illegal activities through the app. It needs internet connection to directly send the picture/ videos using the application. The user can record the incident using their device and upload it later in case of lack of internet at the time of incident.",
  },
  {
    question:
      "कस्ता प्रकारका रिपोर्टहरुको सुनुवाई हुन्छ?\nWhat types of reporting are acted upon?",
    answer:
      "विशेष गरी वन्यजन्तुको चोरी सिकारी, बेचबिखन, पालन, वन फडानी तथा अतिक्रमण र अन्य प्रकृति दोहनका क्रियाकलापहरूको बारेमा सुनुवाइ हुन्छ |  वन्यजन्तु उद्दारको लागि पनि यो यप प्रयोग गर्न सक्नु हुन्छ\nMostly wildlife hunting, wildlife trade, illegal wildlife farming, forest harvesting, forest encroachment, wildlife rescue and other nature related crimes.",
  },
  {
    question:
      "के प्रयोगकर्ताले घटनाको विवरण समेत पठाउन सक्छन?\nCan the user provide a description of the incidents?",
    answer:
      "प्रयोगकर्ताले फोटो /भिडियो वा अडियो फाइल राखेपछि नजिकै रहेको  बक्समा विवरण लेखेर पठाउन सक्छन् |\nYes, after uploading the media a dialogue box appears with description, which can be used to write comments.",
  },
  {
    question:
      "आफुले पठाएको रिपोर्टको  प्रगतिको बारेमा प्रयोगकर्ताले एपमार्फत थाहा पाउन सक्छन?\nCan users track the progress of my reported cases within the app?",
    answer:
      "प्रयोगकर्ताले तेस्रो पार्टीको वेबसाइट वा अन्य खबर मार्फत समग्र प्रगति हेर्न तथा सुन्न सक्छन्, तर गोप्यरुपमा सूचना लिइने हुँदा प्रत्येक रिपोर्टको प्रगति हेर्न मिल्ने छैन |\nYes, however as the data is acquired anonymously the user can access overall progress using third party websites.",
  },
  {
    question:
      "यो एपले कसरी प्रविधिको प्रयोग गरी गैर कानुनी  क्रियाकलाप बारे जानकारी लिन्छ?\nHow does the app use technology to detect and prevent nature crimes?",
    answer:
      "प्रयोगकर्ताले रिपोर्ट पठाएको लोकेसन अथवा विवरणको आधारमा गोप्यरुपमा जानकारी लिइन्छ | त्यसैको आधारमा सम्बन्धित निकायमा खबर पुग्दछ |\nThis application will only detect latitude and longitude (GPS Location) of user’s device anonymously. The concerned district/ Province authorities will receive the report and act upon it.",
  },
  {
    question:
      "के यो एप विदेशमा पनि प्रयोग गर्न मिल्छ?\nCan the app be used internationally?",
    answer:
      "नेपालमा खिचिएको या घटेको गैर कानुनी क्रियाकलाप संसारको जुनसुकै कुनाबाट पठाउन सकिन्छ |\nForeigners also can report wildlife/ forest crime related to Nepal from anywhere in the world.",
  },
  {
    question:
      "रिपोर्ट गरिएका घटनाहरू ठिक/साँचो भए नभएको कसरी प्रमाणित हुन्छ?\nHow does the app verify the authenticity of reported incidents to ensure accurate data?",
    answer:
      "सम्बन्धित निकायमा पुग्नु अगाडी एडमिन(हरू) ले रिपोर्ट रुजु गरी साँचो/ ठिक भए नभएको हेर्ने छन् |\nThe reports will reach to admin(s), who will verify the reports before being delivered to concerned district/ province authorities.",
  },
  {
    question:
      "के यो एप इन्टरनेट नभएको ठाउँमा प्रयोग गर्न सकिन्छ?\nCan the app be used offline in remote areas where internet connectivity is limited?",
    answer:
      "यो एप इन्टरनेट जडान भएको बेला मात्र प्रयोग गर्न सकिन्छ | अगाडी खिचिएको फोटो/ भिडियो इन्टरनेट उपलब्ध भएपछि पठाउन मिल्दछ | तर इन्टरनेट नभएको ठाउँमा फोटो खिच्दा पनि GPS भने खोल्नु पर्छ. यसको लागि इन्टरनेट चाहिँदैन |\nThe application will only work with a secure internet connection. Users can attach and send the media using their gallery when connected to the internet. Make sure to switch on the location on your device while clicking the media.",
  },
  {
    question:
      "एपको दुरुपयोग या गलत सामग्री सम्प्रेसण रोक्न के गरिएको छ?\nWhat measures are in place to prevent misuse of the app for false reporting or malicious intent?",
    answer:
      "प्रयोगकर्ताले पठाएको सामग्री एडमिन(हरु) ले जाँच गर्ने छन्, सही सामग्री मात्र सम्बन्धित निकायमा पठाउनेछन् भने दुरुपयोग भएको थाहा पाए सो उपकरणलाई ब्लक गरिदिने छन् |\nThe admin(s) will review and delete false reporting or malicious content, before sending the incident to authorities. Devices which sent false/ malicious content will be blocked by the system.",
  },
]

export default function HelpPage() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const toggleAnswer = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index))
  }

  return (
    <main
      className="min-h-screen pb-24"
      style={{ backgroundColor: colors.bgColor, color: colors.white }}
    >
      <div className="mx-auto w-full max-w-4xl px-4 py-6">
        <section className="rounded-xl p-4" style={{ backgroundColor: colors.bgColor }}>
          <p
            className="mb-5 text-center text-base"
            style={{ color: colors.textColor }}
          >
            Welcome to our app! We are dedicated to providing the best experience for our users.
          </p>

          <div className="space-y-3">
            <Link
              href="https://maps.app.goo.gl/tTC15PcFLbBjtdAH7"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border p-4"
              style={{ backgroundColor: colors.primary2, borderColor: colors.primary4 }}
            >
              <MapPin size={22} color={colors.white} />
              <span className="text-sm md:text-base text-white">
                Ministry of Forest and Environment, Gandaki Province, Pokhara, Nepal, Pokhara 33700
              </span>
            </Link>

            <Link
              href="mailto:moitfe4@gmail.com"
              className="flex items-center gap-3 rounded-xl border p-4"
              style={{ backgroundColor: colors.primary2, borderColor: colors.primary4 }}
            >
              <Mail size={22} color={colors.white} />
              <span className="text-sm md:text-base text-white">Email: moitfe4@gmail.com</span>
            </Link>

            <Link
              href="tel:061-458058"
              className="flex items-center gap-3 rounded-xl border p-4"
              style={{ backgroundColor: colors.primary2, borderColor: colors.primary4 }}
            >
              <Phone size={22} color={colors.white} />
              <span className="text-sm md:text-base text-white">Call Us: 061-458058</span>
            </Link>
          </div>
        </section>

        <h2
          className="mt-6 mb-3 text-lg font-bold"
          style={{ color: colors.textColor }}
        >
          ‘सुराकी’ एप को बारेमा धेरै सोधिने प्रश्नहरु
        </h2>

        <section className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = expandedIndex === index
            return (
              <div
                key={index}
                className="rounded-lg border-b pb-2"
                style={{ borderColor: colors.primary4 }}
              >
                <button
                  type="button"
                  onClick={() => toggleAnswer(index)}
                  className="flex w-full items-start justify-between gap-3 py-2 text-left"
                >
                  <span
                    className="whitespace-pre-line text-base font-semibold"
                    style={{ color: colors.textColor }}
                  >
                    {faq.question}
                  </span>
                  {isOpen ? (
                    <ChevronUp size={18} color={colors.textColor} className="mt-1 shrink-0" />
                  ) : (
                    <ChevronDown size={18} color={colors.textColor} className="mt-1 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <p
                    className="mt-1 whitespace-pre-line text-sm leading-6"
                    style={{ color: colors.textColor }}
                  >
                    {faq.answer}
                  </p>
                )}
              </div>
            )
          })}
        </section>
      </div>
    </main>
  )
}