/**
 * Regional language packs for the 4-page Quick Executive Deck.
 * Trademark-safe competitive wording (Legacy Gatekeeper Apps / legacy platforms).
 */

export type BrochureLocale = 'en' | 'hi' | 'bn' | 'mr' | 'ta' | 'te'

export const BROCHURE_LOCALES: Array<{ code: BrochureLocale; label: string; native: string }> = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' }
]

export type ExecModuleCard = {
  icon: string
  title: string
  bullets: [string, string, string]
}

export type ExecDeckCopy = {
  brandBanner: string
  cover: {
    eyebrow: string
    title: string
    subtitle: string
    valueProps: [string, string, string, string]
    summaryTag: string
    summaryTitle: string
    summaryBody: string
  }
  matrix: {
    eyebrow: string
    title: string
    lead: string
    headers: [string, string, string]
    rows: Array<[string, string, string]>
  }
  modules: {
    eyebrow: string
    title: string
    lead: string
    cards: ExecModuleCard[]
  }
  close: {
    eyebrow: string
    title: string
    earnTitle: string
    earnItems: Array<{ title: string; body: string }>
    roadmapTitle: string
    roadmap: Array<{ step: string; title: string; body: string }>
    ctaTitle: string
    ctaBody: string
    contactTitle: string
    contactLines: string[]
    whatsappLabel: string
    whatsappUrl: string
    qrCaption: string
  }
  pageLabel: string
}

const WA_URL =
  'https://wa.me/?text=' +
  encodeURIComponent('Hi Syncra Systems — I want a maiSociety board demo / 18-page masterguide.')

const EN: ExecDeckCopy = {
  brandBanner: 'maiSociety by Syncra Systems',
  cover: {
    eyebrow: 'Quick Executive Deck · 4 pages',
    title: 'maiSociety — Next-Gen Autonomous AI Society OS',
    subtitle: 'Enterprise RWA software that replaces guard logbooks with autonomous, phone-first governance.',
    valueProps: [
      '100% Zero Hardware',
      'Cryptographic Governance',
      'AI Leakage Auditor',
      '1-Click Property Syndication'
    ],
    summaryTag: 'Executive summary',
    summaryTitle: 'From legacy guard logbooks → autonomous society governance',
    summaryBody:
      'Legacy gatekeeper apps stop at dues and visitor logs. maiSociety layers AI delivery clearance, predictive finance flags, cryptographic elections, parking monetization, and portal-ready rent/resale — licensed per society, with no gadgets to buy.'
  },
  matrix: {
    eyebrow: 'Competitive edge',
    title: 'Legacy Gatekeeper Apps vs maiSociety (AI OS)',
    lead: 'A board-ready matrix — where traditional apps stop, the AI society OS continues.',
    headers: ['Capability', 'Legacy Gatekeeper Apps', 'maiSociety (AI OS)'],
    rows: [
      ['Hardware Requirement', 'Often gate devices / sensors / kiosks', 'Phone + WhatsApp first · zero gadgets'],
      ['Elections', 'Paper ballot or basic polls', 'Cryptographic 1-Flat-1-Vote + recall motions'],
      ['Financial Audit', 'Manual ledgers after the fact', 'mAI Auditor flags invoice leakage before payment'],
      ['Delivery Clearance', 'Guard paste / call every time', 'SMS / notification interceptor pre-approves'],
      ['Parking Monetization', 'Static bays · no owner earnings', 'Hourly + monthly slot marketplace · UPI credits'],
      ['Lost Asset Finding', 'Notice board / WhatsApp chaos', 'Paired Bluetooth ping + Gate 1 Lost & Found photos'],
      ['Carpooling', 'Informal chat groups', 'Zero-commission in-society maiCommute'],
      ['Property Resale', 'Broker lock-in / portal re-entry', 'maiList 1-click multi-portal syndication']
    ]
  },
  modules: {
    eyebrow: 'Product depth',
    title: 'The 6 Core AI Modules',
    lead: 'High-density capabilities committees actually buy — each licensed as a modular add-on.',
    cards: [
      {
        icon: '🛡️',
        title: 'Universal Delivery Interceptor & Kid Safety',
        bullets: [
          'Auto pre-clear courier SMS / push on resident phones',
          'Parent time-window approvals for minor exits',
          'Guard loud alert when approval is missing'
        ]
      },
      {
        icon: '📊',
        title: 'mAI Auditor (Predictive Expense & Fraud AI)',
        bullets: [
          'MoM utility & vendor invoice variance flags',
          'Recommendations before dual-signatory payment',
          'Society expense ledger grounded — not guesswork'
        ]
      },
      {
        icon: '🔑',
        title: 'maiList (1-Click Rent/Resale Syndication)',
        bullets: [
          'Publish once · fan-out to major property portals',
          'Zero-brokerage networks + society renter graph',
          'Resale badges: dues clear · NOC · ₹/sqft context'
        ]
      },
      {
        icon: '🚗',
        title: 'maiCommute (Zero-Commission In-Society Carpool)',
        bullets: [
          'Flat-verified ride offers inside your society graph',
          'Seat booking without external commission apps',
          'Departure windows matched to neighbor routes'
        ]
      },
      {
        icon: '🅿️',
        title: 'Smart Parking Monetization',
        bullets: [
          'List vacant bays hourly while you are at work',
          'Monthly zero-brokerage lease to neighbors',
          'Auto-vacate reminder 30 min before return'
        ]
      },
      {
        icon: '🌿',
        title: 'mAI Botanist & Green Society',
        bullets: [
          'QR plant tags · care plans · weather-aware tasks',
          'Compost batch publish & flat doorstep orders',
          'Neighbor plant & seed swap inside the society'
        ]
      }
    ]
  },
  close: {
    eyebrow: 'Commercials · ROI · CTA',
    title: 'How societies earn — and go live in 24 hours',
    earnTitle: 'How Society Owners Earn',
    earnItems: [
      {
        title: 'Parking rental credits',
        body: 'Owners list vacant slots (hourly / monthly). Guests pay via UPI; credits land in the owner wallet — software listings only.'
      },
      {
        title: 'Zero-brokerage property deals',
        body: 'maiList syndicates rent & resale once. Committees keep trust badges; residents skip re-typing across portals.'
      }
    ],
    roadmapTitle: '24-Hour Onboarding Roadmap',
    roadmap: [
      {
        step: '01',
        title: 'Provision society',
        body: 'Create society · import flats · invite committee roles — no hardware install.'
      },
      {
        step: '02',
        title: 'Turn on modules',
        body: 'License gatekeeper, auditor, parking, maiList — only what the board approved.'
      },
      {
        step: '03',
        title: 'Go live on phones',
        body: 'Residents + guards use the app / WhatsApp. First visitor & dues cycle same day.'
      }
    ],
    ctaTitle: 'Want Full Technical & Security Architecture?',
    ctaBody:
      'Request the 18-Page Detailed Masterguide at maisociety.vercel.app — threat model, module map, and deployment runbook for your RWA.',
    contactTitle: 'Contact & Support',
    contactLines: [
      'Syncra Systems LLP · Platform Team',
      'Kolkata, West Bengal, India',
      'hello@syncrasystems.com'
    ],
    whatsappLabel: 'WhatsApp Sales',
    whatsappUrl: WA_URL,
    qrCaption: 'Scan · maisociety.vercel.app'
  },
  pageLabel: 'Page'
}

/** Compact regional packs — same structure, localized for board sharing. */
function localized(
  partial: Omit<ExecDeckCopy, 'modules' | 'matrix' | 'close'> & {
    matrix: ExecDeckCopy['matrix']
    modules: ExecDeckCopy['modules']
    close: ExecDeckCopy['close']
  }
): ExecDeckCopy {
  return partial
}

const HI: ExecDeckCopy = localized({
  brandBanner: 'maiSociety · Syncra Systems',
  cover: {
    eyebrow: 'क्विक एग्ज़ेक्यूटिव डेक · 4 पृष्ठ',
    title: 'maiSociety — नेक्स्ट-जेन ऑटोनॉमस AI सोसाइटी OS',
    subtitle: 'गार्ड लॉगबुक की जगह फ़ोन-फर्स्ट स्वायत्त गवर्नेंस।',
    valueProps: ['100% ज़ीरो हार्डवेयर', 'क्रिप्टोग्राफ़िक गवर्नेंस', 'AI लीकेज ऑडिटर', '1-क्लिक प्रॉपर्टी सिंडिकेशन'],
    summaryTag: 'कार्यकारी सारांश',
    summaryTitle: 'लीगेसी गार्ड लॉगबुक → स्वायत्त सोसाइटी गवर्नेंस',
    summaryBody:
      'पारंपरिक गेटकीपर ऐप्स बकाया और विज़िटर पर रुकते हैं। maiSociety AI डिलीवरी क्लियरेंस, वित्तीय फ़्लैग, क्रिप्टो चुनाव, पार्किंग मुद्रीकरण और पोर्टल-रेडी किराया/बिक्री जोड़ता है — बिना गैजेट खरीदे।'
  },
  matrix: {
    eyebrow: 'प्रतिस्पर्धी बढ़त',
    title: 'लीगेसी गेटकीपर ऐप्स बनाम maiSociety (AI OS)',
    lead: 'बोर्ड-रेडी मैट्रिक्स — जहाँ पारंपरिक ऐप्स रुकते हैं, AI OS आगे जाता है।',
    headers: ['क्षमता', 'लीगेसी गेटकीपर ऐप्स', 'maiSociety (AI OS)'],
    rows: [
      ['हार्डवेयर', 'अक्सर गेट डिवाइस / सेंसर', 'फ़ोन + WhatsApp · ज़ीरो गैजेट'],
      ['चुनाव', 'कागज़ी / साधारण पोल', 'क्रिप्टो 1-फ्लैट-1-वोट + रिकॉल'],
      ['वित्तीय ऑडिट', 'बाद में मैनुअल लेजर', 'mAI Auditor भुगतान से पहले फ़्लैग'],
      ['डिलीवरी क्लियरेंस', 'हर बार कॉल/पेस्ट', 'SMS/नोटिफिकेशन प्री-अप्रूव'],
      ['पार्किंग मुद्रीकरण', 'स्टैटिक बे · कोई कमाई नहीं', 'घंटेवार/मासिक मार्केटप्लेस · UPI'],
      ['खोई वस्तु', 'नोटिस/व्हाट्सऐप अराजकता', 'पेयर्ड BT पिंग + गेट 1 L&F'],
      ['कारपूल', 'अनौपचारिक चैट', 'ज़ीरो-कमीशन maiCommute'],
      ['प्रॉपर्टी रीसेल', 'ब्रोकर लॉक-इन', 'maiList 1-क्लिक मल्टी-पोर्टल']
    ]
  },
  modules: {
    eyebrow: 'उत्पाद गहराई',
    title: '6 कोर AI मॉड्यूल',
    lead: 'कमेटी जो वास्तव में खरीदती है — मॉड्यूलर ऐड-ऑन के रूप में।',
    cards: [
      {
        icon: '🛡️',
        title: 'यूनिवर्सल डिलीवरी इंटरसेप्टर व किड सेफ्टी',
        bullets: ['कूरियर SMS/पुश प्री-क्लियर', 'अभिभावक समय-खिड़की अनुमोदन', 'अप्रूवल न होने पर गार्ड अलर्ट']
      },
      {
        icon: '📊',
        title: 'mAI Auditor (खर्च व धोखाधड़ी AI)',
        bullets: ['MoM यूटिलिटी/इनवॉइस फ़्लैग', 'द्वि-हस्ताक्षर भुगतान से पहले', 'एक्सपेंस लेजर पर आधारित']
      },
      {
        icon: '🔑',
        title: 'maiList (1-क्लिक किराया/बिक्री)',
        bullets: ['एक बार पब्लिश · मल्टी-पोर्टल', 'ज़ीरो-ब्रोकरेज नेटवर्क', 'बकाया/NOC बैज']
      },
      {
        icon: '🚗',
        title: 'maiCommute (ज़ीरो-कमीशन कारपूल)',
        bullets: ['सोसाइटी ग्राफ़ में राइड', 'बिना बाहरी कमीशन', 'पड़ोस मार्ग मैच']
      },
      {
        icon: '🅿️',
        title: 'स्मार्ट पार्किंग मुद्रीकरण',
        bullets: ['काम पर होने पर घंटेवार लिस्ट', 'मासिक ज़ीरो-ब्रोकरेज लीज़', 'वापसी से 30 मि. पहले वैकेट रिमाइंडर']
      },
      {
        icon: '🌿',
        title: 'mAI Botanist व ग्रीन सोसाइटी',
        bullets: ['QR प्लांट टैग व केयर प्लान', 'कम्पोस्ट बैच व डोरस्टेप', 'पड़ोस प्लांट/सीड स्वैप']
      }
    ]
  },
  close: {
    eyebrow: 'व्यापार · ROI · CTA',
    title: 'सोसाइटी कैसे कमाए — और 24 घंटे में लाइव',
    earnTitle: 'सोसाइटी ओनर्स कैसे कमाते हैं',
    earnItems: [
      {
        title: 'पार्किंग किराया क्रेडिट',
        body: 'खाली स्लॉट लिस्ट करें (घंटे/माह)। अतिथि UPI से भुगतान; क्रेडिट ओनर वॉलेट में।'
      },
      {
        title: 'ज़ीरो-ब्रोकरेज प्रॉपर्टी डील',
        body: 'maiList एक बार सिंडिकेट करता है — पोर्टल पर दोबारा टाइपिंग नहीं।'
      }
    ],
    roadmapTitle: '24-घंटे ऑनबोर्डिंग रोडमैप',
    roadmap: [
      { step: '01', title: 'सोसाइटी प्रोविज़न', body: 'फ्लैट आयात · भूमिका आमंत्रण — कोई हार्डवेयर नहीं।' },
      { step: '02', title: 'मॉड्यूल चालू', body: 'बोर्ड-अनुमोदित ऐड-ऑन लाइसेंस करें।' },
      { step: '03', title: 'फ़ोन पर लाइव', body: 'निवासी + गार्ड ऐप/WhatsApp — उसी दिन पहला चक्र।' }
    ],
    ctaTitle: 'पूरी तकनीकी व सुरक्षा आर्किटेक्चर चाहिए?',
    ctaBody: '18-पृष्ठ मास्टरगाइड माँगें — maisociety.vercel.app',
    contactTitle: 'संपर्क व सहायता',
    contactLines: ['Syncra Systems LLP · प्लेटफ़ॉर्म टीम', 'कोलकाता, पश्चिम बंगाल', 'hello@syncrasystems.com'],
    whatsappLabel: 'WhatsApp सेल्स',
    whatsappUrl: WA_URL,
    qrCaption: 'स्कैन · maisociety.vercel.app'
  },
  pageLabel: 'पृष्ठ'
})

const BN: ExecDeckCopy = localized({
  brandBanner: 'maiSociety · Syncra Systems',
  cover: {
    eyebrow: 'কুইক এক্সিক ডেক · ৪ পৃষ্ঠা',
    title: 'maiSociety — নেক্সট-জেন অটোনমাস AI সোসাইটি OS',
    subtitle: 'গার্ড লগবুকের বদলে ফোন-ফার্স্ট স্বায়ত্তশাসিত গভর্নেন্স।',
    valueProps: ['১০০% জিরো হার্ডওয়্যার', 'ক্রিপ্টোগ্রাফিক গভর্নেন্স', 'AI লিকেজ অডিটর', '১-ক্লিক প্রপার্টি সিন্ডিকেশন'],
    summaryTag: 'নির্বাহী সারাংশ',
    summaryTitle: 'লিগ্যাসি গার্ড লগবুক → স্বায়ত্তশাসিত সোসাইটি গভর্নেন্স',
    summaryBody:
      'প্রথাগত গেটকিপার অ্যাপ বকেয়া ও ভিজিটরে থেমে যায়। maiSociety AI ডেলিভারি, ফাইন্যান্স ফ্ল্যাগ, ক্রিপ্টো নির্বাচন, পার্কিং মুদ্রায়ন ও পোর্টাল-রেডি ভাড়া/বিক্রি যোগায় — কোনো গ্যাজেট ছাড়া।'
  },
  matrix: {
    eyebrow: 'প্রতিযোগিতামূলক এজ',
    title: 'লিগ্যাসি গেটকিপার অ্যাপ বনাম maiSociety (AI OS)',
    lead: 'বোর্ড-রেডি ম্যাট্রিক্স।',
    headers: ['সক্ষমতা', 'লিগ্যাসি গেটকিপার অ্যাপ', 'maiSociety (AI OS)'],
    rows: [
      ['হার্ডওয়্যার', 'প্রায়ই গেট ডিভাইস', 'ফোন + WhatsApp · জিরো গ্যাজেট'],
      ['নির্বাচন', 'কাগজ / সাধারণ ভোট', 'ক্রিপ্টো ১-ফ্ল্যাট-১-ভোট + রিকল'],
      ['আর্থিক অডিট', 'পরে ম্যানুয়াল লেজার', 'mAI Auditor পেমেন্টের আগে'],
      ['ডেলিভারি', 'প্রতিবার কল/পেস্ট', 'SMS/নোটিফিকেশন প্রি-অ্যাপ্রুভ'],
      ['পার্কিং মুদ্রায়ন', 'স্ট্যাটিক বে', 'ঘণ্টা/মাসিক মার্কেটপ্লেস · UPI'],
      ['হারানো জিনিস', 'নোটিশ/হোয়াটসঅ্যাপ', 'পেয়ার্ড BT পিং + গেট ১ L&F'],
      ['কারপুল', 'অনানুষ্ঠানিক চ্যাট', 'জিরো-কমিশন maiCommute'],
      ['রিসেল', 'ব্রোকার লক-ইন', 'maiList ১-ক্লিক মাল্টি-পোর্টাল']
    ]
  },
  modules: {
    eyebrow: 'প্রোডাক্ট গভীরতা',
    title: '৬টি কোর AI মডিউল',
    lead: 'কমিটি যা সত্যি কেনে — মডুলার অ্যাড-অন।',
    cards: [
      { icon: '🛡️', title: 'ইউনিভার্সাল ডেলিভারি ও কিড সেফটি', bullets: ['কুরিয়ার SMS প্রি-ক্লিয়ার', 'অভিভাবক সময়-উইন্ডো', 'গার্ড লাউড অ্যালার্ট'] },
      { icon: '📊', title: 'mAI Auditor', bullets: ['MoM ইনভয়েস ফ্ল্যাগ', 'দ্বৈত স্বাক্ষরের আগে', 'এক্সপেন্স লেজার ভিত্তিক'] },
      { icon: '🔑', title: 'maiList সিন্ডিকেশন', bullets: ['একবার পাবলিশ', 'জিরো-ব্রোকারেজ নেটওয়ার্ক', 'বকেয়া/NOC ব্যাজ'] },
      { icon: '🚗', title: 'maiCommute', bullets: ['সোসাইটি গ্রাফে রাইড', 'বহিরাগত কমিশন নেই', 'রুট ম্যাচ'] },
      { icon: '🅿️', title: 'স্মার্ট পার্কিং মুদ্রায়ন', bullets: ['ঘণ্টায় তালিকা', 'মাসিক লিজ', '৩০ মি. ভ্যাকेट রিমাইন্ডার'] },
      { icon: '🌿', title: 'mAI Botanist ও গ্রিন সোসাইটি', bullets: ['QR প্ল্যান্ট ট্যাগ', 'কম্পোস্ট ব্যাচ', 'প্ল্যান্ট/সিড সোয়াপ'] }
    ]
  },
  close: {
    eyebrow: 'কমার্শিয়াল · ROI · CTA',
    title: 'সোসাইটি কীভাবে আয় করে — ২৪ ঘণ্টায় লাইভ',
    earnTitle: 'মালিকরা কীভাবে আয় করেন',
    earnItems: [
      { title: 'পার্কিং ভাড়া ক্রেডিট', body: 'খালি স্লট তালিকা · UPI · ওয়ালেট ক্রেডিট।' },
      { title: 'জিরো-ব্রোকারেজ ডিল', body: 'maiList একবার সিন্ডিকেট — পোর্টালে পুনরায় টাইপ নয়।' }
    ],
    roadmapTitle: '২৪-ঘণ্টা অনবোর্ডিং',
    roadmap: [
      { step: '০১', title: 'সোসাইটি প্রোভিশন', body: 'ফ্ল্যাট ইমপোর্ট · রোল আমন্ত্রণ।' },
      { step: '০২', title: 'মডিউল চালু', body: 'বোর্ড-অনুমোদিত অ্যাড-অন।' },
      { step: '০৩', title: 'ফোনে লাইভ', body: 'অ্যাপ/WhatsApp · একই দিন প্রথম চক্র।' }
    ],
    ctaTitle: 'পূর্ণ টেকনিক্যাল ও সিকিউরিটি আর্কিটেকচার?',
    ctaBody: '১৮-পৃষ্ঠার মাস্টারগাইড চান — maisociety.vercel.app',
    contactTitle: 'যোগাযোগ',
    contactLines: ['Syncra Systems LLP · প্ল্যাটফর্ম টিম', 'কলকাতা, পশ্চিমবঙ্গ', 'hello@syncrasystems.com'],
    whatsappLabel: 'WhatsApp সেলস',
    whatsappUrl: WA_URL,
    qrCaption: 'স্ক্যান · maisociety.vercel.app'
  },
  pageLabel: 'পৃষ্ঠা'
})

const MR: ExecDeckCopy = localized({
  brandBanner: 'maiSociety · Syncra Systems',
  cover: {
    eyebrow: 'क्विक एक्झेक डेक · ४ पृष्ठे',
    title: 'maiSociety — नेक्स्ट-जेन ऑटोनॉमस AI सोसायटी OS',
    subtitle: 'गार्ड लॉगबुकऐवजी फोन-फर्स्ट स्वायत्त गव्हर्नन्स.',
    valueProps: ['१००% झिरो हार्डवेअर', 'क्रिप्टोग्राफिक गव्हर्नन्स', 'AI लीकेज ऑडिटर', '१-क्लिक प्रॉपर्टी सिंडिकेशन'],
    summaryTag: 'कार्यकारी सारांश',
    summaryTitle: 'लेगसी गार्ड लॉगबुक → स्वायत्त सोसायटी गव्हर्नन्स',
    summaryBody:
      'पारंपरिक गेटकीपर अॅप्स थकबाकी व व्हिजिटरवर थांबतात. maiSociety AI डिलिव्हरी, फायनान्स फ्लॅग, क्रिप्टो निवडणुका, पार्किंग मुद्रीकरण आणि पोर्टल-रेडी भाडे/विक्री जोडते — गॅजेट न घेता.'
  },
  matrix: {
    eyebrow: 'स्पर्धात्मक एज',
    title: 'लेगसी गेटकीपर अॅप्स विरुद्ध maiSociety (AI OS)',
    lead: 'बोर्ड-रेडी मॅट्रिक्स.',
    headers: ['क्षमता', 'लेगसी गेटकीपर अॅप्स', 'maiSociety (AI OS)'],
    rows: [
      ['हार्डवेअर', 'बहुधा गेट डिव्हाइस', 'फोन + WhatsApp · झिरो गॅजेट'],
      ['निवडणुका', 'कागदी / साधे मत', 'क्रिप्टो १-फ्लॅट-१-वोट + रिकॉल'],
      ['आर्थिक ऑडिट', 'नंतर मॅन्युअल लेजर', 'mAI Auditor पेमेंटपूर्वी'],
      ['डिलिव्हरी', 'प्रत्येक वेळी कॉल', 'SMS/नोटिफिकेशन प्री-अप्रूव्ह'],
      ['पार्किंग मुद्रीकरण', 'स्टॅटिक बे', 'तास/मासिक मार्केटप्लेस · UPI'],
      ['हरवलेली वस्तू', 'नोटीस/व्हॉट्सअॅप', 'पेअर्ड BT पिंग + गेट १'],
      ['कारपूल', 'अनौपचारिक चॅट', 'झिरो-कमिशन maiCommute'],
      ['रीसेल', 'ब्रोकर लॉक-इन', 'maiList १-क्लिक मल्टी-पोर्टल']
    ]
  },
  modules: {
    eyebrow: 'उत्पाद खोली',
    title: '६ कोर AI मॉड्यूल्स',
    lead: 'समिती खरेदी करते ते — मॉड्युलर अॅड-ऑन.',
    cards: [
      { icon: '🛡️', title: 'डिलिव्हरी इंटरसेप्टर व किड सेफ्टी', bullets: ['कुरिअर SMS प्री-क्लिअर', 'पालक वेळ-विंडो', 'गार्ड अलर्ट'] },
      { icon: '📊', title: 'mAI Auditor', bullets: ['MoM इनव्हॉइस फ्लॅग', 'द्वि-स्वाक्षरीपूर्वी', 'एक्सपेन्स लेजर'] },
      { icon: '🔑', title: 'maiList सिंडिकेशन', bullets: ['एकदा पब्लिश', 'झिरो-ब्रोकरेज', 'थकबाकी/NOC बॅज'] },
      { icon: '🚗', title: 'maiCommute', bullets: ['सोसायटी ग्राफ राइड्स', 'बाह्य कमिशन नाही', 'मार्ग जुळवणी'] },
      { icon: '🅿️', title: 'स्मार्ट पार्किंग मुद्रीकरण', bullets: ['तासवार यादी', 'मासिक लीज', '३० मि. व्हॅकेट रिमाइंडर'] },
      { icon: '🌿', title: 'mAI Botanist व ग्रीन सोसायटी', bullets: ['QR प्लांट टॅग', 'कंपोस्ट बॅच', 'प्लांट/सीड स्वॅप'] }
    ]
  },
  close: {
    eyebrow: 'व्यावसायिक · ROI · CTA',
    title: 'सोसायटी कशी कमवते — २४ तासात लाइव्ह',
    earnTitle: 'मालक कसे कमवतात',
    earnItems: [
      { title: 'पार्किंग भाडे क्रेडिट', body: 'रिकामे स्लॉट यादी · UPI · वॉलेट क्रेडिट.' },
      { title: 'झिरो-ब्रोकरेज डील', body: 'maiList एकदा सिंडिकेट — पुन्हा टायपिंग नाही.' }
    ],
    roadmapTitle: '२४-तास ऑनबोर्डिंग',
    roadmap: [
      { step: '०१', title: 'सोसायटी प्रोव्हिजन', body: 'फ्लॅट इंपोर्ट · भूमिका आमंत्रण.' },
      { step: '०२', title: 'मॉड्यूल सुरू', body: 'बोर्ड-मंजूर अॅड-ऑन.' },
      { step: '०३', title: 'फोनवर लाइव्ह', body: 'अॅप/WhatsApp · त्याच दिवशी पहिले चक्र.' }
    ],
    ctaTitle: 'पूर्ण तांत्रिक व सुरक्षा आर्किटेक्चर हवे?',
    ctaBody: '१८-पृष्ठ मास्टरगाईड — maisociety.vercel.app',
    contactTitle: 'संपर्क',
    contactLines: ['Syncra Systems LLP · प्लॅटफॉर्म टीम', 'कोलकाता, पश्चिम बंगाल', 'hello@syncrasystems.com'],
    whatsappLabel: 'WhatsApp सेल्स',
    whatsappUrl: WA_URL,
    qrCaption: 'स्कॅन · maisociety.vercel.app'
  },
  pageLabel: 'पृष्ठ'
})

const TA: ExecDeckCopy = localized({
  brandBanner: 'maiSociety · Syncra Systems',
  cover: {
    eyebrow: 'விரைவு எக்ஸிக்யூட்டிவ் டெக் · 4 பக்கங்கள்',
    title: 'maiSociety — நெக்ஸ்ட்-ஜென் தன்னியக்க AI சொசைட்டி OS',
    subtitle: 'காவலர் பதிவேடுகளுக்கு பதிலாக போன்-முதல் தன்னியக்க ஆட்சி.',
    valueProps: ['100% ஜீரோ ஹார்ட்வேர்', 'கிரிப்டோ ஆட்சி', 'AI கசிவு ஆடிட்டர்', '1-கிளிக் சொத்து சிண்டிகேஷன்'],
    summaryTag: 'நிர்வாக சுருக்கம்',
    summaryTitle: 'பாரம்பரிய காவலர் பதிவேடு → தன்னியக்க சொசைட்டி ஆட்சி',
    summaryBody:
      'பாரம்பரிய கேட்கீப்பர் ஆப்ஸ் நிலுவை/பார்வையாளரில் நிற்கும். maiSociety AI டெலிவரி, நிதிக் கொடிகள், கிரிப்டோ தேர்தல், பார்க்கிங் வருவாய் மற்றும் போர்டல் வாடகை/விற்பனையைச் சேர்க்கும் — கேஜெட் இல்லாமல்.'
  },
  matrix: {
    eyebrow: 'போட்டி மேன்மை',
    title: 'பாரம்பரிய கேட்கீப்பர் ஆப்ஸ் vs maiSociety (AI OS)',
    lead: 'வாரியத்திற்கான அணிவரிசை.',
    headers: ['திறன்', 'பாரம்பரிய கேட்கீப்பர் ஆப்ஸ்', 'maiSociety (AI OS)'],
    rows: [
      ['ஹார்ட்வேர்', 'அடிக்கடி கேட் சாதனம்', 'போன் + WhatsApp · ஜீரோ கேஜெட்'],
      ['தேர்தல்', 'காகித / எளிய வாக்கு', 'கிரிப்டோ 1-பிளாட்-1-வாக்கு + ரீகால்'],
      ['நிதி ஆடிட்', 'பின் மானுவல் லெட்ஜர்', 'mAI Auditor பணத்திற்கு முன்'],
      ['டெலிவரி', 'ஒவ்வொரு முறை அழைப்பு', 'SMS/நோட்டிஃபிகேஷன் முன் அனுமதி'],
      ['பார்க்கிங் வருவாய்', 'நிலையான பே', 'மணி/மாத சந்தை · UPI'],
      ['தொலைந்த பொருள்', 'அறிவிப்பு/WhatsApp', 'ஜோடி BT பிங் + கேட் 1'],
      ['கார்பூல்', 'முறைசாரா அரட்டை', 'ஜீரோ-கமிஷன் maiCommute'],
      ['மறுவிற்பனை', 'தரகர் பூட்டு', 'maiList 1-கிளிக் மல்டி-போர்டல்']
    ]
  },
  modules: {
    eyebrow: 'தயாரிப்பு ஆழம்',
    title: '6 முக்கிய AI தொகுதிகள்',
    lead: 'குழுக்கள் வாங்கும் திறன்கள் — மாடுலர் ஆட்-ஆன்.',
    cards: [
      { icon: '🛡️', title: 'டெலிவரி இன்டர்செப்டர் & குழந்தை பாதுகாப்பு', bullets: ['கூரியர் SMS முன் அனுமதி', 'பெற்றோர் நேர சாளரம்', 'காவலர் எச்சரிக்கை'] },
      { icon: '📊', title: 'mAI Auditor', bullets: ['MoM இன்வாய்ஸ் கொடி', 'இரட்டை கையொப்பத்திற்கு முன்', 'செலவு லெட்ஜர்'] },
      { icon: '🔑', title: 'maiList சிண்டிகேஷன்', bullets: ['ஒருமுறை வெளியீடு', 'ஜீரோ-தரகு வலை', 'நிலுவை/NOC பேட்ஜ்'] },
      { icon: '🚗', title: 'maiCommute', bullets: ['சொசைட்டி கிராஃப் சவாரி', 'வெளி கமிஷன் இல்லை', 'பாதை பொருத்தம்'] },
      { icon: '🅿️', title: 'ஸ்மார்ட் பார்க்கிங் வருவாய்', bullets: ['மணிநேர பட்டியல்', 'மாத வாடகை', '30 நிமி. காலி நினைவூட்டல்'] },
      { icon: '🌿', title: 'mAI Botanist & கிரீன் சொசைட்டி', bullets: ['QR தாவர குறி', 'கம்போஸ்ட் தொகுப்பு', 'தாவரம்/விதை பரிமாற்றம்'] }
    ]
  },
  close: {
    eyebrow: 'வணிகம் · ROI · CTA',
    title: 'சொசைட்டி எப்படி சம்பாதிக்கும் — 24 மணிநேரத்தில் நேரலை',
    earnTitle: 'உரிமையாளர்கள் எப்படி சம்பாதிக்கிறார்கள்',
    earnItems: [
      { title: 'பார்க்கிங் வாடகை கிரெடிட்', body: 'காலி ஸ்லாட் பட்டியல் · UPI · வாலட் கிரெடிட்.' },
      { title: 'ஜீரோ-தரகு ஒப்பந்தம்', body: 'maiList ஒருமுறை சிண்டிகேட் — மீண்டும் தட்டச்சு இல்லை.' }
    ],
    roadmapTitle: '24-மணிநேர ஆன்போர்டிங்',
    roadmap: [
      { step: '01', title: 'சொசைட்டி அமைப்பு', body: 'பிளாட் இறக்குமதி · பங்கு அழைப்பு.' },
      { step: '02', title: 'தொகுதி இயக்கம்', body: 'வாரிய அனுமதி ஆட்-ஆன்.' },
      { step: '03', title: 'போனில் நேரலை', body: 'ஆப்/WhatsApp · அதே நாள் முதல் சுழற்சி.' }
    ],
    ctaTitle: 'முழு தொழில்நுட்ப & பாதுகாப்பு கட்டமைப்பு வேண்டுமா?',
    ctaBody: '18-பக்க மாஸ்டர்கைடு — maisociety.vercel.app',
    contactTitle: 'தொடர்பு',
    contactLines: ['Syncra Systems LLP · பிளாட்ஃபார்ம் குழு', 'கொல்கத்தா, மேற்கு வங்கம்', 'hello@syncrasystems.com'],
    whatsappLabel: 'WhatsApp விற்பனை',
    whatsappUrl: WA_URL,
    qrCaption: 'ஸ்கேன் · maisociety.vercel.app'
  },
  pageLabel: 'பக்கம்'
})

const TE: ExecDeckCopy = localized({
  brandBanner: 'maiSociety · Syncra Systems',
  cover: {
    eyebrow: 'క్విక్ ఎగ్జిక్యూటివ్ డెక్ · 4 పేజీలు',
    title: 'maiSociety — నెక్స్ట్-జెన్ అటానమస్ AI సొసైటీ OS',
    subtitle: 'గార్డ్ లాగ్‌బుక్‌ల స్థానంలో ఫోన్-ఫస్ట్ స్వయంచాలక పాలన.',
    valueProps: ['100% జీరో హార్డ్‌వేర్', 'క్రిప్టో గవర్నెన్స్', 'AI లీకేజ్ ఆడిటర్', '1-క్లిక్ ప్రాపర్టీ సిండికేషన్'],
    summaryTag: 'ఎగ్జిక్యూటివ్ సారాంశం',
    summaryTitle: 'లెగసీ గార్డ్ లాగ్‌బుక్ → స్వయంచాలక సొసైటీ పాలన',
    summaryBody:
      'సాంప్రదాయ గేట్‌కీపర్ యాప్‌లు బకాయి/సందర్శకుల వద్ద ఆగుతాయి. maiSociety AI డెలివరీ, ఫైనాన్స్ ఫ్లాగ్‌లు, క్రిప్టో ఎన్నికలు, పార్కింగ్ ఆదాయం మరియు పోర్టల్ అద్దె/అమ్మకం జోడిస్తుంది — గాడ్జెట్‌లు లేకుండా.'
  },
  matrix: {
    eyebrow: 'పోటీ ఎడ్జ్',
    title: 'లెగసీ గేట్‌కీపర్ యాప్‌లు vs maiSociety (AI OS)',
    lead: 'బోర్డు-రెడీ మ్యాట్రిక్స్.',
    headers: ['సామర్థ్యం', 'లెగసీ గేట్‌కీపర్ యాప్‌లు', 'maiSociety (AI OS)'],
    rows: [
      ['హార్డ్‌వేర్', 'తరచుగా గేట్ పరికరం', 'ఫోన్ + WhatsApp · జీరో గాడ్జెట్'],
      ['ఎన్నికలు', 'కాగితం / సాధారణ ఓటు', 'క్రిప్టో 1-ఫ్లాట్-1-ఓటు + రికాల్'],
      ['ఆర్థిక ఆడిట్', 'తర్వాత మాన్యువల్ లెడ్జర్', 'mAI Auditor చెల్లింపు ముందు'],
      ['డెలివరీ', 'ప్రతిసారి కాల్', 'SMS/నోటిఫికేషన్ ప్రీ-అప్రూవ్'],
      ['పార్కింగ్ ఆదాయం', 'స్టాటిక్ బే', 'గంట/నెల మార్కెట్‌ప్లేస్ · UPI'],
      ['కోల్పోయిన వస్తువు', 'నోటీసు/WhatsApp', 'పెయిర్డ్ BT పింగ్ + గేట్ 1'],
      ['కార్‌పూల్', 'అనధికార చాట్', 'జీరో-కమిషన్ maiCommute'],
      ['రీసేల్', 'బ్రోకర్ లాక్-ఇన్', 'maiList 1-క్లిక్ మల్టీ-పోర్టల్']
    ]
  },
  modules: {
    eyebrow: 'ప్రొడక్ట్ లోతు',
    title: '6 కోర్ AI మాడ్యూళ్లు',
    lead: 'కమిటీలు కొనే సామర్థ్యాలు — మాడ్యులర్ యాడ్-ఆన్.',
    cards: [
      { icon: '🛡️', title: 'డెలివరీ ఇంటర్‌సెప్టర్ & కిడ్ సేఫ్టీ', bullets: ['కొరియర్ SMS ప్రీ-క్లియర్', 'తల్లిదండ్రుల టైమ్ విండో', 'గార్డ్ అలర్ట్'] },
      { icon: '📊', title: 'mAI Auditor', bullets: ['MoM ఇన్వాయిస్ ఫ్లాగ్', 'డ్యూయల్ సంతకం ముందు', 'ఎక్స్‌పెన్స్ లెడ్జర్'] },
      { icon: '🔑', title: 'maiList సిండికేషన్', bullets: ['ఒక్కసారి పబ్లిష్', 'జీరో-బ్రోకరేజ్', 'బకాయి/NOC బ్యాడ్జ్'] },
      { icon: '🚗', title: 'maiCommute', bullets: ['సొసైటీ గ్రాఫ్ రైడ్స్', 'బాహ్య కమిషన్ లేదు', 'రూట్ మ్యాచ్'] },
      { icon: '🅿️', title: 'స్మార్ట్ పార్కింగ్ ఆదాయం', bullets: ['గంటవారీ జాబితా', 'నెలవారీ లీజ్', '30 ని. వేకేట్ రిమైండర్'] },
      { icon: '🌿', title: 'mAI Botanist & గ్రీన్ సొసైటీ', bullets: ['QR ప్లాంట్ ట్యాగ్', 'కంపోస్ట్ బ్యాచ్', 'ప్లాంట్/సీడ్ స్వాప్'] }
    ]
  },
  close: {
    eyebrow: 'కమర్షియల్స్ · ROI · CTA',
    title: 'సొసైటీలు ఎలా సంపాదిస్తాయి — 24 గంటల్లో లైవ్',
    earnTitle: 'యజమానులు ఎలా సంపాదిస్తారు',
    earnItems: [
      { title: 'పార్కింగ్ అద్దె క్రెడిట్', body: 'ఖాళీ స్లాట్ జాబితా · UPI · వాలెట్ క్రెడిట్.' },
      { title: 'జీరో-బ్రోకరేజ్ డీల్', body: 'maiList ఒక్కసారి సిండికేట్ — మళ్లీ టైపింగ్ లేదు.' }
    ],
    roadmapTitle: '24-గంట ఆన్‌బోర్డింగ్',
    roadmap: [
      { step: '01', title: 'సొసైటీ ప్రొవిజన్', body: 'ఫ్లాట్ ఇంపోర్ట్ · రోల్ ఆహ్వానం.' },
      { step: '02', title: 'మాడ్యూళ్లు ఆన్', body: 'బోర్డు-ఆమోదిత యాడ్-ఆన్.' },
      { step: '03', title: 'ఫోన్‌లో లైవ్', body: 'యాప్/WhatsApp · అదే రోజు మొదటి సైకిల్.' }
    ],
    ctaTitle: 'పూర్తి టెక్నికల్ & సెక్యూరిటీ ఆర్కిటెక్చర్ కావాలా?',
    ctaBody: '18-పేజీ మాస్టర్‌గైడ్ — maisociety.vercel.app',
    contactTitle: 'సంప్రదింపు',
    contactLines: ['Syncra Systems LLP · ప్లాట్‌ఫారమ్ టీమ్', 'కోల్‌కతా, పశ్చిమ బెంగాల్', 'hello@syncrasystems.com'],
    whatsappLabel: 'WhatsApp సేల్స్',
    whatsappUrl: WA_URL,
    qrCaption: 'స్కాన్ · maisociety.vercel.app'
  },
  pageLabel: 'పేజీ'
})

const PACKS: Record<BrochureLocale, ExecDeckCopy> = {
  en: EN,
  hi: HI,
  bn: BN,
  mr: MR,
  ta: TA,
  te: TE
}

export function getExecDeckCopy(locale: BrochureLocale): ExecDeckCopy {
  return PACKS[locale] ?? EN
}
