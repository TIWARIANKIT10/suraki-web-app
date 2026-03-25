import Link from "next/link"

const colors = {
  bgColor: "#0B3D2E",
  primary2: "#14532D",
  white: "#FFFFFF",
  yellowColor: "#EAB308",
}

export default function AboutPage() {
  return (
    <main
      className="min-h-screen pb-24"
      style={{ backgroundColor: colors.bgColor, color: colors.white }}
    >
      <div className="mx-auto w-full max-w-4xl px-4 py-6">
        <section
          className="mt-4 rounded-xl p-4 md:p-5"
          style={{ backgroundColor: colors.primary2 }}
        >
          <h2 className="mb-3 text-xl font-bold">Report Wildlife Crimes</h2>
          <p className="mb-3 text-sm leading-6 text-justify">
            This app is designed for reporting criminal activities against wildlife and
            nature, including:
          </p>

          <p className="mb-2 text-sm">🦏 Poaching of animals</p>
          <p className="mb-2 text-sm">🌳 Illegal deforestation and tree cutting</p>
          <p className="mb-2 text-sm">💧 Water pollution and habitat destruction</p>
          <p className="mb-2 text-sm">🔥 Forest fires caused by human negligence</p>
          <p className="mb-2 text-sm">🚜 Encroachment of protected forest areas</p>

          <p className="mt-3 text-sm leading-6 text-justify">
            Help us protect nature by reporting any suspicious activities. Your information
            will be kept confidential.
          </p>
        </section>

        <section
          className="mt-4 rounded-xl p-4 md:p-5"
          style={{ backgroundColor: colors.primary2 }}
        >
          <h2 className="mb-3 text-xl font-bold">Ministry of Forest and Environment</h2>
          <p className="text-base leading-7 text-justify">
            गण्डकी प्रदेशभित्र रहेका प्राकृतिक स्रोतहरुको संरक्षण, सम्वर्द्धन, विकास, विस्तार र
            सदुपयोग गर्दै उक्त स्रोतहरु मार्फत् प्रदेशको समृद्धि र विकास गर्ने उद्देश्यले गण्डकी
            प्रदेश सरकारको प्रतिनिधित्व गर्दै प्रदेश सरकार स्थापना भई मिति २०७४/१०/२२ मा उद्योग,
            पर्यटन, वन तथा वातावरण मन्त्रालय स्थापना भयो । नेपालको संविधानको अनुसूची ६, ७ र ९ मा
            व्यवस्था भए वमोजिम प्रदेशको एकल र साझा अधिकार सूचीमा पर्ने उद्योग, पर्यटन, आपूर्ति,
            वाणिज्य, विज्ञान प्रविधि, वन तथा वातावरणसँग सम्बन्धित विषय वमोजिम मन्त्रालयले कार्य
            गरिरहेको थियो । नेपाल सरकार र स्थानीय तह बीच समन्वय र सहकार्य गर्दै प्रदेश समृद्धिका
            लागि औद्योगिकरणमा जोड दिने, पर्यटन क्षेत्रको विकास र विस्तार गरी नयाँ नयाँ रोजगारीको
            अवसर सृजना गर्ने, वनको दिगो व्यवस्थापन तथा तालतलैया र एकीकृत जलाधार व्यवस्थापन गरी
            वातावरण संरक्षणमा जोड दिनु, दैनिक उपभोग्य वस्तु तथा सेवाको सहज र सुलभ आपूर्ति
            व्यवस्थापन लगायतका कार्यहरु गर्दै आएको थियो ।
          </p>
        </section>

        <section
          className="mt-4 rounded-xl p-4 md:p-5"
          style={{ backgroundColor: colors.primary2 }}
        >
          <h2 className="mb-3 text-xl font-bold">About FON Nepal</h2>
          <p className="text-base leading-7 text-justify">
            Friends of Nature (FON) Nepal is a youth-led NGO dedicated to environmental
            conservation and biodiversity protection. Since 2005, FON Nepal has been
            conducting research, advocacy, and community-based projects to safeguard
            Nepal’s ecosystems, from the lowlands to the highlands.
          </p>
        </section>

        <section
          className="mt-4 rounded-xl p-4 md:p-5"
          style={{ backgroundColor: colors.primary2 }}
        >
          <h2 className="mb-3 text-xl font-bold">About NIC Nepal</h2>
          <p className="text-base leading-7 text-justify">
            Established in 2012, the National Innovation Center a nonprofit sharing
            organization is dedicated to creating the culture of research and innovation in
            Nepal. Inside Tribhuvan University, Kirtipur, Kathmandu, Nepal - 44618
          </p>
        </section>

        <section
          className="mt-4 rounded-xl p-4 md:p-5"
          style={{ backgroundColor: colors.primary2 }}
        >
          <h2 className="mb-3 text-xl font-bold">
            User Privacy Notes and Anonymization statement
          </h2>
          <p className="mb-3 text-sm leading-6 text-justify">
            सुराकी एप्लिकेशनले प्रयोगकर्ताको अनुमतिमा मात्र सामान्य जानकारी संकलन गर्नेछ जसमा
            प्रयोगकर्ताको नाम, इमेल र सुराकी गरेको स्थान आदि पर्दछ | स्वीकृतिबिना प्रयोगकर्ताको
            कुनै पनि जानकारी, कुनै पनि निकायलाई दिइनेछैन | सुराकी गर्नेको जानकारी पूर्णरुपमा गोप्य
            हुनेछ |
          </p>
          <p className="text-sm leading-6 text-justify">
            SURAKI application shall collect minimal personal information (in case permitted
            by user) to enhance user experience. This may include username, email, and
            location. We do not share this information without the user’s consent. The
            system will receive anonymous data.
          </p>
        </section>

        <section
          className="mt-4 rounded-xl p-4 md:p-5"
          style={{ backgroundColor: colors.primary2 }}
        >
          <h2 className="mb-3 text-xl font-bold">सम्पर्क सहायताका (Contact)</h2>
          <p className="mb-2 text-sm">📧 Email: moitfe4@gmail.com</p>
          <p className="mb-2 text-sm">📞 Phone: 061-458058/590304/457669/457668</p>
          <p className="mb-2 text-sm">🌐 Website: mofesc.gandaki.gov.np/</p>
        </section>

        <div className="mt-4">
          <Link
            href="https://mofesc.gandaki.gov.np/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-base font-medium"
            style={{ backgroundColor: colors.yellowColor, color: colors.white }}
          >
            थप जानकारी (Learn More)
          </Link>
        </div>
      </div>
    </main>
  )
}