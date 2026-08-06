/**
 * Regional language packs for the 4-page Quick Executive Deck.
 * Trademark-safe competitive wording (Legacy Platforms / legacy gatekeeper apps).
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

export type ExecFailCard = { icon: string; title: string; body: string }
export type ExecModuleCard = { icon: string; title: string; bullets: [string, string, string, string] }

export type ExecDeckCopy = {
  brandBanner: string
  pitchTag: string
  cover: {
    eyebrow: string
    title: string
    subtitle: string
    metrics: [string, string, string, string]
    failTag: string
    failTitle: string
    failCards: [ExecFailCard, ExecFailCard, ExecFailCard]
    overviewTag: string
    overviewTitle: string
    overviewBody: string
    architectureTitle: string
    architectureItems: [string, string, string, string]
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
    monetizationTitle: string
    monetizationItems: Array<{ title: string; body: string }>
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
  pitchTag: 'Official RWA Executive Pitch Deck',
  cover: {
    eyebrow: 'Quick Executive Deck · 4 pages',
    title: 'maiSociety — Next-Gen Autonomous AI Society OS',
    subtitle: 'Replace guard logbooks with phone-first autonomous governance — zero gadgets to buy.',
    metrics: ['100% Zero Hardware', '24-Hour Deployment', 'Cryptographic Voting', '0% Brokerage'],
    failTag: 'Market gap',
    failTitle: 'Why traditional apps fail RWA boards',
    failCards: [
      {
        icon: '📒',
        title: 'Logbook ops',
        body: 'Guards paste OTPs and call every flat. Delivery chaos scales with society size.'
      },
      {
        icon: '🧾',
        title: 'Blind finance',
        body: 'Invoices get paid from habit. Leakage shows up months later in audits.'
      },
      {
        icon: '🔓',
        title: 'No trust layer',
        body: 'Paper elections, broker lock-in, and static parking — no owner earnings.'
      }
    ],
    overviewTag: 'Executive overview',
    overviewTitle: 'One society OS for residents, guards, and the committee',
    overviewBody:
      'maiSociety layers AI delivery clearance, predictive expense flags, cryptographic 1-Flat-1-Vote, parking monetization, and 1-click rent/resale syndication on top of billing, notices, gatekeeper, and helpdesk — licensed per society.',
    architectureTitle: 'Platform architecture map',
    architectureItems: [
      'Core stack: Billing · Notices · Gatekeeper · Helpdesk',
      'Edge AI: Delivery interceptor · Auditor · Kid safety',
      'Monetization: Parking marketplace · maiList syndication',
      'Trust: Cryptographic votes · Dual-sign finance gates'
    ]
  },
  matrix: {
    eyebrow: 'Competitive edge',
    title: 'Legacy Platforms vs maiSociety',
    lead: 'Board-ready matrix — where traditional gatekeeper apps stop, the AI society OS continues.',
    headers: ['Capability', 'Legacy Platforms', 'maiSociety'],
    rows: [
      ['Hardware Requirement', 'Gate devices / sensors / kiosks', 'Phone + WhatsApp · zero gadgets'],
      ['Elections', 'Paper ballot or basic polls', 'Cryptographic 1-Flat-1-Vote + recall'],
      ['Financial Audit', 'Manual ledgers after the fact', 'mAI Auditor flags leakage pre-payment'],
      ['Delivery Clearance', 'Guard paste / call every time', 'SMS / push interceptor pre-approves'],
      ['Parking Monetization', 'Static bays · no owner earnings', 'Hourly + monthly marketplace · UPI'],
      ['Lost Asset Finding', 'Notice board / WhatsApp chaos', 'Paired BT ping + Gate 1 photo L&F'],
      ['Carpooling', 'Informal chat groups', 'Zero-commission in-society maiCommute'],
      ['Property Resale', 'Broker lock-in / re-entry', 'maiList 1-click multi-portal syndication']
    ]
  },
  modules: {
    eyebrow: 'Product depth',
    title: 'The 6 Core AI Modules',
    lead: 'High-density add-ons committees actually license — phone-first, no IoT lock-in.',
    cards: [
      {
        icon: '🛡️',
        title: 'Universal Delivery Interceptor & Kid Safety',
        bullets: [
          'Auto pre-clear courier SMS / push on phones',
          'Parent time-window approvals for minor exits',
          'Guard loud alert when approval is missing',
          'HITL override kept for disputed exits'
        ]
      },
      {
        icon: '📊',
        title: 'mAI Auditor (Predictive Expense & Fraud AI)',
        bullets: [
          'MoM utility & vendor invoice variance flags',
          'Recommendations before dual-signatory pay',
          'Grounded in society expense ledger data',
          'Human finance gate stays mandatory'
        ]
      },
      {
        icon: '🔑',
        title: 'maiList (1-Click Rent/Resale Syndication)',
        bullets: [
          'Publish once · fan-out to major portals',
          'Zero-brokerage networks + society renters',
          'Resale badges: dues clear · NOC · ₹/sqft',
          'No re-typing listings across sites'
        ]
      },
      {
        icon: '🚗',
        title: 'maiCommute (Zero-Commission Carpool)',
        bullets: [
          'Flat-verified rides inside society graph',
          'Seat booking without external commissions',
          'Departure windows matched to neighbor routes',
          'Trust via verified resident identity'
        ]
      },
      {
        icon: '🅿️',
        title: 'Smart Parking Monetization',
        bullets: [
          'List vacant bays hourly while at work',
          'Monthly zero-brokerage lease to neighbors',
          'UPI pay → instant owner wallet credits',
          'Auto-vacate reminder 30 min before return'
        ]
      },
      {
        icon: '🌿',
        title: 'mAI Botanist & Green Society',
        bullets: [
          'QR plant tags · care plans · weather tasks',
          'Compost batch publish & doorstep orders',
          'Neighbor plant & seed swap in-society',
          'Landscape ops without nursery hardware'
        ]
      }
    ]
  },
  close: {
    eyebrow: 'Commercials · ROI · CTA',
    title: 'Monetization, onboarding, and next step',
    monetizationTitle: 'Monetization ROI',
    monetizationItems: [
      {
        title: 'Parking earnings',
        body: 'List vacant slots hourly or monthly. Guests pay UPI; credits land in the owner wallet — software only.'
      },
      {
        title: 'Zero-brokerage property deals',
        body: 'maiList syndicates rent & resale once. Skip portal re-entry and broker lock-in.'
      }
    ],
    roadmapTitle: '24-Hour Onboarding Timeline',
    roadmap: [
      { step: '1', title: 'Provision', body: 'Create society · import flats · invite roles — no hardware.' },
      { step: '2', title: 'License modules', body: 'Turn on only what the board approved.' },
      { step: '3', title: 'Go live', body: 'Residents + guards on app / WhatsApp same day.' }
    ],
    ctaTitle: 'Want Full Technical & Security Architecture?',
    ctaBody:
      'Request the 18-Page Detailed Masterguide at maisociety.vercel.app — threat model, module map, and deployment runbook.',
    contactTitle: 'Syncra Systems · Official Contact',
    contactLines: [
      'Syncra Systems LLP · Platform Team',
      'Kolkata, West Bengal, India',
      'hello@syncrasystems.com'
    ],
    whatsappLabel: 'WhatsApp Sales',
    whatsappUrl: WA_URL,
    qrCaption: 'maisociety.vercel.app'
  },
  pageLabel: 'Page'
}

function pack(p: ExecDeckCopy): ExecDeckCopy {
  return p
}

const HI = pack({
  brandBanner: 'maiSociety by Syncra Systems',
  pitchTag: 'आधिकारिक RWA एग्ज़ेक्यूटिव पिच डेक',
  cover: {
    eyebrow: 'क्विक एग्ज़ेक्यूटिव डेक · 4 पृष्ठ',
    title: 'maiSociety — नेक्स्ट-जेन ऑटोनॉमस AI सोसाइटी OS',
    subtitle: 'गार्ड लॉगबुक की जगह फ़ोन-फर्स्ट स्वायत्त गवर्नेंस — बिना गैजेट।',
    metrics: ['100% ज़ीरो हार्डवेयर', '24-घंटे डिप्लॉयमेंट', 'क्रिप्टोग्राफ़िक वोटिंग', '0% ब्रोकरेज'],
    failTag: 'मार्केट गैप',
    failTitle: 'पारंपरिक ऐप्स बोर्ड क्यों निराश करते हैं',
    failCards: [
      { icon: '📒', title: 'लॉगबुक ऑपरेशन', body: 'हर डिलीवरी पर कॉल/पेस्ट — स्केल नहीं होता।' },
      { icon: '🧾', title: 'अंधा वित्त', body: 'लीकेज महीने बाद ऑडिट में दिखता है।' },
      { icon: '🔓', title: 'बिना ट्रस्ट लेयर', body: 'कागज़ी चुनाव, ब्रोकर लॉक-इन, स्थिर पार्किंग।' }
    ],
    overviewTag: 'कार्यकारी अवलोकन',
    overviewTitle: 'निवासी, गार्ड और कमेटी — एक सोसाइटी OS',
    overviewBody:
      'maiSociety AI डिलीवरी, खर्चे के फ़्लैग, क्रिप्टो वोट, पार्किंग मुद्रीकरण और 1-क्लिक सिंडिकेशन जोड़ता है — प्रति सोसाइटी लाइसेंस।',
    architectureTitle: 'प्लेटफ़ॉर्म आर्किटेक्चर मैप',
    architectureItems: [
      'कोर: बिलिंग · नोटिस · गेटकीपर · हेल्पडेस्क',
      'एज AI: डिलीवरी · ऑडिटर · किड सेफ्टी',
      'मुद्रीकरण: पार्किंग · maiList',
      'ट्रस्ट: क्रिप्टो वोट · द्वि-हस्ताक्षर वित्त'
    ]
  },
  matrix: {
    eyebrow: 'प्रतिस्पर्धी बढ़त',
    title: 'लीगेसी प्लेटफ़ॉर्म बनाम maiSociety',
    lead: 'बोर्ड-रेडी मैट्रिक्स।',
    headers: ['क्षमता', 'लीगेसी प्लेटफ़ॉर्म', 'maiSociety'],
    rows: [
      ['हार्डवेयर', 'गेट डिवाइस / सेंसर', 'फ़ोन + WhatsApp · ज़ीरो गैजेट'],
      ['चुनाव', 'कागज़ी / साधारण पोल', 'क्रिप्टो 1-फ्लैट-1-वोट + रिकॉल'],
      ['वित्तीय ऑडिट', 'बाद में मैनुअल लेजर', 'mAI Auditor भुगतान से पहले'],
      ['डिलीवरी', 'हर बार कॉल/पेस्ट', 'SMS/पुश प्री-अप्रूव'],
      ['पार्किंग मुद्रीकरण', 'स्टैटिक बे', 'घंटे/माह मार्केटप्लेस · UPI'],
      ['खोई वस्तु', 'नोटिस/व्हाट्सऐप', 'पेयर्ड BT + गेट 1 L&F'],
      ['कारपूल', 'अनौपचारिक चैट', 'ज़ीरो-कमीशन maiCommute'],
      ['प्रॉपर्टी रीसेल', 'ब्रोकर लॉक-इन', 'maiList 1-क्लिक सिंडिकेशन']
    ]
  },
  modules: {
    eyebrow: 'उत्पाद गहराई',
    title: '6 कोर AI मॉड्यूल',
    lead: 'कमेटी जो वास्तव में लाइसेंस करती है।',
    cards: [
      { icon: '🛡️', title: 'डिलीवरी इंटरसेप्टर व किड सेफ्टी', bullets: ['कूरियर SMS प्री-क्लियर', 'अभिभावक समय-खिड़की', 'गार्ड लाउड अलर्ट', 'HITL ओवरराइड'] },
      { icon: '📊', title: 'mAI Auditor', bullets: ['MoM इनवॉइस फ़्लैग', 'द्वि-हस्ताक्षर से पहले', 'एक्सपेंस लेजर', 'मानव वित्त गेट'] },
      { icon: '🔑', title: 'maiList सिंडिकेशन', bullets: ['एक बार पब्लिश', 'ज़ीरो-ब्रोकरेज', 'बकाया/NOC बैज', 'दोबारा टाइपिंग नहीं'] },
      { icon: '🚗', title: 'maiCommute', bullets: ['सोसाइटी ग्राफ़ राइड', 'बिना कमीशन', 'मार्ग मैच', 'सत्यापित निवासी'] },
      { icon: '🅿️', title: 'स्मार्ट पार्किंग', bullets: ['घंटेवार लिस्ट', 'मासिक लीज़', 'UPI → वॉलेट', '30 मि. वैकेट रिमाइंडर'] },
      { icon: '🌿', title: 'mAI Botanist', bullets: ['QR प्लांट टैग', 'कम्पोस्ट बैच', 'प्लांट स्वैप', 'बिना नर्सरी हार्डवेयर'] }
    ]
  },
  close: {
    eyebrow: 'व्यापार · ROI · CTA',
    title: 'मुद्रीकरण, ऑनबोर्डिंग और अगला कदम',
    monetizationTitle: 'मुद्रीकरण ROI',
    monetizationItems: [
      { title: 'पार्किंग कमाई', body: 'खाली स्लॉट लिस्ट करें · UPI · ओनर वॉलेट क्रेडिट।' },
      { title: 'ज़ीरो-ब्रोकरेज डील', body: 'maiList एक बार सिंडिकेट — पोर्टल री-एंट्री नहीं।' }
    ],
    roadmapTitle: '24-घंटे ऑनबोर्डिंग',
    roadmap: [
      { step: '1', title: 'प्रोविज़न', body: 'सोसाइटी बनाएँ · फ्लैट आयात · भूमिकाएँ।' },
      { step: '2', title: 'मॉड्यूल', body: 'बोर्ड-अनुमोदित ऐड-ऑन चालू करें।' },
      { step: '3', title: 'लाइव', body: 'ऐप/WhatsApp — उसी दिन पहला चक्र।' }
    ],
    ctaTitle: 'पूरी तकनीकी व सुरक्षा आर्किटेक्चर?',
    ctaBody: '18-पृष्ठ मास्टरगाइड माँगें — maisociety.vercel.app',
    contactTitle: 'Syncra Systems · आधिकारिक संपर्क',
    contactLines: ['Syncra Systems LLP · प्लेटफ़ॉर्म टीम', 'कोलकाता, पश्चिम बंगाल', 'hello@syncrasystems.com'],
    whatsappLabel: 'WhatsApp सेल्स',
    whatsappUrl: WA_URL,
    qrCaption: 'maisociety.vercel.app'
  },
  pageLabel: 'पृष्ठ'
})

const BN = pack({
  ...EN,
  brandBanner: 'maiSociety by Syncra Systems',
  pitchTag: 'অফিসিয়াল RWA এক্সিকুটিভ পিচ ডেক',
  cover: {
    ...EN.cover,
    eyebrow: 'কুইক এক্সিক ডেক · ৪ পৃষ্ঠা',
    title: 'maiSociety — নেক্সট-জেন অটোনমাস AI সোসাইটি OS',
    subtitle: 'গার্ড লগবুকের বদলে ফোন-ফার্স্ট স্বায়ত্তশাসিত গভর্নেন্স।',
    metrics: ['১০০% জিরো হার্ডওয়্যার', '২৪-ঘণ্টা ডিপ্লয়মেন্ট', 'ক্রিপ্টোগ্রাফিক ভোটিং', '০% ব্রোকারেজ'],
    failTag: 'মার্কেট গ্যাপ',
    failTitle: 'প্রথাগত অ্যাপ বোর্ডকে কেন ব্যর্থ করে',
    failCards: [
      { icon: '📒', title: 'লগবুক অপস', body: 'প্রতি ডেলিভারিতে কল/পেস্ট — স্কেল হয় না।' },
      { icon: '🧾', title: 'অন্ধ ফাইন্যান্স', body: 'লিকেজ মাস পরে অডিটে ধরা পড়ে।' },
      { icon: '🔓', title: 'ট্রাস্ট নেই', body: 'কাগজের ভোট, ব্রোকার লক-ইন, স্থির পার্কিং।' }
    ],
    overviewTag: 'নির্বাহী ওভারভিউ',
    overviewTitle: 'বাসী, গার্ড ও কমিটি — এক সোসাইটি OS',
    overviewBody: 'maiSociety AI ডেলিভারি, খরচ ফ্ল্যাগ, ক্রিপ্টো ভোট, পার্কিং মুদ্রায়ন ও ১-ক্লিক সিন্ডিকেশন যোগায়।',
    architectureTitle: 'প্ল্যাটফর্ম আর্কিটেকচার ম্যাপ',
    architectureItems: [
      'কোর: বিলিং · নোটিশ · গেটকিপার · হেল্পডেস্ক',
      'এজ AI: ডেলিভারি · অডিটর · কিড সেফটি',
      'মুদ্রায়ন: পার্কিং · maiList',
      'ট্রাস্ট: ক্রিপ্টো ভোট · দ্বৈত স্বাক্ষর'
    ]
  },
  matrix: {
    eyebrow: 'প্রতিযোগিতামূলক এজ',
    title: 'লিগ্যাসি প্ল্যাটফর্ম বনাম maiSociety',
    lead: 'বোর্ড-রেডি ম্যাট্রিক্স।',
    headers: ['সক্ষমতা', 'লিগ্যাসি প্ল্যাটফর্ম', 'maiSociety'],
    rows: [
      ['হার্ডওয়্যার', 'গেট ডিভাইস / সেন্সর', 'ফোন + WhatsApp · জিরো গ্যাজেট'],
      ['নির্বাচন', 'কাগজ / সাধারণ ভোট', 'ক্রিপ্টো ১-ফ্ল্যাট-১-ভোট + রিকল'],
      ['আর্থিক অডিট', 'পরে ম্যানুয়াল লেজার', 'mAI Auditor পেমেন্টের আগে'],
      ['ডেলিভারি', 'প্রতিবার কল/পেস্ট', 'SMS/পুশ প্রি-অ্যাপ্রুভ'],
      ['পার্কিং মুদ্রায়ন', 'স্ট্যাটিক বে', 'ঘণ্টা/মাস মার্কেটপ্লেস · UPI'],
      ['হারানো জিনিস', 'নোটিশ/WhatsApp', 'পেয়ার্ড BT + গেট ১ L&F'],
      ['কারপুল', 'অনানুষ্ঠানিক চ্যাট', 'জিরো-কমিশন maiCommute'],
      ['রিসেল', 'ব্রোকার লক-ইন', 'maiList ১-ক্লিক সিন্ডিকেশন']
    ]
  },
  modules: {
    eyebrow: 'প্রোডাক্ট গভীরতা',
    title: '৬টি কোর AI মডিউল',
    lead: 'কমিটি যা সত্যি লাইসেন্স করে।',
    cards: [
      { icon: '🛡️', title: 'ডেলিভারি ও কিড সেফটি', bullets: ['কুরিয়ার SMS প্রি-ক্লিয়ার', 'অভিভাবক সময়-উইন্ডো', 'গার্ড অ্যালার্ট', 'HITL ওভাররাইড'] },
      { icon: '📊', title: 'mAI Auditor', bullets: ['MoM ইনভয়েস ফ্ল্যাগ', 'দ্বৈত স্বাক্ষরের আগে', 'এক্সপেন্স লেজার', 'মানব ফাইন্যান্স গেট'] },
      { icon: '🔑', title: 'maiList', bullets: ['একবার পাবলিশ', 'জিরো-ব্রোকারেজ', 'বকেয়া/NOC ব্যাজ', 'পুনরায় টাইপ নয়'] },
      { icon: '🚗', title: 'maiCommute', bullets: ['সোসাইটি গ্রাফ রাইড', 'কমিশন নেই', 'রুট ম্যাচ', 'যাচাইকৃত বাসিন্দা'] },
      { icon: '🅿️', title: 'স্মার্ট পার্কিং', bullets: ['ঘণ্টায় তালিকা', 'মাসিক লিজ', 'UPI → ওয়ালেট', '৩০ মি. ভ্যাকেট'] },
      { icon: '🌿', title: 'mAI Botanist', bullets: ['QR প্ল্যান্ট ট্যাগ', 'কম্পোস্ট ব্যাচ', 'প্ল্যান্ট সোয়াপ', 'নার্সারি হার্ডওয়্যার নেই'] }
    ]
  },
  close: {
    ...EN.close,
    eyebrow: 'কমার্শিয়াল · ROI · CTA',
    title: 'মুদ্রায়ন, অনবোর্ডিং ও পরবর্তী ধাপ',
    monetizationTitle: 'মুদ্রায়ন ROI',
    monetizationItems: [
      { title: 'পার্কিং আয়', body: 'খালি স্লট তালিকা · UPI · ওয়ালেট ক্রেডিট।' },
      { title: 'জিরো-ব্রোকারেজ ডিল', body: 'maiList একবার সিন্ডিকেট।' }
    ],
    roadmapTitle: '২৪-ঘণ্টা অনবোর্ডিং',
    roadmap: [
      { step: '1', title: 'প্রোভিশন', body: 'সোসাইটি · ফ্ল্যাট · রোল।' },
      { step: '2', title: 'মডিউল', body: 'বোর্ড-অনুমোদিত অ্যাড-অন।' },
      { step: '3', title: 'লাইভ', body: 'অ্যাপ/WhatsApp একই দিন।' }
    ],
    ctaTitle: 'পূর্ণ টেকনিক্যাল ও সিকিউরিটি আর্কিটেকচার?',
    ctaBody: '১৮-পৃষ্ঠার মাস্টারগাইড — maisociety.vercel.app',
    contactTitle: 'Syncra Systems · অফিসিয়াল যোগাযোগ',
    whatsappLabel: 'WhatsApp সেলস'
  },
  pageLabel: 'পৃষ্ঠা'
})
const MR = pack({
  ...EN,
  pitchTag: 'अधिकृत RWA एक्झेक्युटिव पिच डेक',
  cover: {
    ...EN.cover,
    eyebrow: 'क्विक एक्झेक डेक · ४ पृष्ठे',
    title: 'maiSociety — नेक्स्ट-जेन ऑटोनॉमस AI सोसायटी OS',
    subtitle: 'गार्ड लॉगबुकऐवजी फोन-फर्स्ट स्वायत्त गव्हर्नन्स.',
    metrics: ['१००% झिरो हार्डवेअर', '२४-तास डिप्लॉयमेंट', 'क्रिप्टोग्राफिक व्होटिंग', '०% ब्रोकरेज'],
    failTag: 'मार्केट गॅप',
    failTitle: 'पारंपरिक अॅप्स बोर्ड का निराश करतात',
    failCards: [
      { icon: '📒', title: 'लॉगबुक ऑप्स', body: 'प्रत्येक डिलिव्हरीवर कॉल/पेस्ट.' },
      { icon: '🧾', title: 'अंध वित्त', body: 'लीकेज महिन्यांनी ऑडिटमध्ये दिसते.' },
      { icon: '🔓', title: 'ट्रस्ट नाही', body: 'कागदी मत, ब्रोकर लॉक-इन.' }
    ],
    overviewTag: 'कार्यकारी आढावा',
    overviewTitle: 'रहिवासी, गार्ड, समिती — एक सोसायटी OS',
    overviewBody: 'maiSociety AI डिलिव्हरी, खर्च फ्लॅग, क्रिप्टो व्होट, पार्किंग मुद्रीकरण आणि १-क्लिक सिंडिकेशन जोडते.',
    architectureTitle: 'प्लॅटफॉर्म आर्किटेक्चर मॅप',
    architectureItems: [
      'कोर: बिलिंग · नोटीस · गेटकीपर · हेल्पडेस्क',
      'एज AI: डिलिव्हरी · ऑडिटर · किड सेफ्टी',
      'मुद्रीकरण: पार्किंग · maiList',
      'ट्रस्ट: क्रिप्टो व्होट · द्वि-स्वाक्षरी'
    ]
  },
  matrix: {
    eyebrow: 'स्पर्धात्मक एज',
    title: 'लेगसी प्लॅटफॉर्म विरुद्ध maiSociety',
    lead: 'बोर्ड-रेडी मॅट्रिक्स.',
    headers: ['क्षमता', 'लेगसी प्लॅटफॉर्म', 'maiSociety'],
    rows: [
      ['हार्डवेअर', 'गेट डिव्हाइस / सेन्सर', 'फोन + WhatsApp · झिरो गॅजेट'],
      ['निवडणुका', 'कागदी / साधे मत', 'क्रिप्टो १-फ्लॅट-१-वोट + रिकॉल'],
      ['आर्थिक ऑडिट', 'नंतर मॅन्युअल लेजर', 'mAI Auditor पेमेंटपूर्वी'],
      ['डिलिव्हरी', 'प्रत्येक वेळी कॉल', 'SMS/पुश प्री-अप्रूव्ह'],
      ['पार्किंग मुद्रीकरण', 'स्टॅटिक बे', 'तास/मासिक मार्केटप्लेस · UPI'],
      ['हरवलेली वस्तू', 'नोटीस/WhatsApp', 'पेअर्ड BT + गेट १'],
      ['कारपूल', 'अनौपचारिक चॅट', 'झिरो-कमिशन maiCommute'],
      ['रीसेल', 'ब्रोकर लॉक-इन', 'maiList १-क्लिक सिंडिकेशन']
    ]
  },
  modules: {
    eyebrow: 'उत्पाद खोली',
    title: '६ कोर AI मॉड्यूल्स',
    lead: 'समिती जे खरेदी करते.',
    cards: [
      { icon: '🛡️', title: 'डिलिव्हरी व किड सेफ्टी', bullets: ['कुरिअर SMS प्री-क्लिअर', 'पालक वेळ-विंडो', 'गार्ड अलर्ट', 'HITL'] },
      { icon: '📊', title: 'mAI Auditor', bullets: ['MoM इनव्हॉइस फ्लॅग', 'द्वि-स्वाक्षरीपूर्वी', 'एक्सपेन्स लेजर', 'मानव वित्त गेट'] },
      { icon: '🔑', title: 'maiList', bullets: ['एकदा पब्लिश', 'झिरो-ब्रोकरेज', 'थकबाकी/NOC', 'पुन्हा टायपिंग नाही'] },
      { icon: '🚗', title: 'maiCommute', bullets: ['सोसायटी ग्राफ', 'कमिशन नाही', 'मार्ग जुळवणी', 'सत्यापित रहिवासी'] },
      { icon: '🅿️', title: 'स्मार्ट पार्किंग', bullets: ['तासवार यादी', 'मासिक लीज', 'UPI → वॉलेट', '३० मि. व्हॅकेट'] },
      { icon: '🌿', title: 'mAI Botanist', bullets: ['QR प्लांट टॅग', 'कंपोस्ट बॅच', 'प्लांट स्वॅप', 'नर्सरी हार्डवेअर नाही'] }
    ]
  },
  close: {
    ...EN.close,
    eyebrow: 'व्यावसायिक · ROI · CTA',
    title: 'मुद्रीकरण, ऑनबोर्डिंग आणि पुढील पाऊल',
    monetizationTitle: 'मुद्रीकरण ROI',
    monetizationItems: [
      { title: 'पार्किंग कमाई', body: 'रिकामे स्लॉट · UPI · वॉलेट क्रेडिट.' },
      { title: 'झिरो-ब्रोकरेज डील', body: 'maiList एकदा सिंडिकेट.' }
    ],
    roadmapTitle: '२४-तास ऑनबोर्डिंग',
    roadmap: [
      { step: '1', title: 'प्रोव्हिजन', body: 'सोसायटी · फ्लॅट · भूमिका.' },
      { step: '2', title: 'मॉड्यूल', body: 'बोर्ड-मंजूर अॅड-ऑन.' },
      { step: '3', title: 'लाइव्ह', body: 'अॅप/WhatsApp त्याच दिवशी.' }
    ],
    ctaTitle: 'पूर्ण तांत्रिक व सुरक्षा आर्किटेक्चर?',
    ctaBody: '१८-पृष्ठ मास्टरगाईड — maisociety.vercel.app',
    contactTitle: 'Syncra Systems · अधिकृत संपर्क',
    whatsappLabel: 'WhatsApp सेल्स'
  },
  pageLabel: 'पृष्ठ'
})

const TA = pack({
  ...EN,
  pitchTag: 'அதிகாரப்பூர்வ RWA எக்ஸிக்யூட்டிவ் பிட்ச் டெக்',
  cover: {
    ...EN.cover,
    eyebrow: 'விரைவு எக்ஸிக்யூட்டிவ் டெக் · 4 பக்கங்கள்',
    title: 'maiSociety — நெக்ஸ்ட்-ஜென் தன்னியக்க AI சொசைட்டி OS',
    subtitle: 'காவலர் பதிவேடுகளுக்கு பதிலாக போன்-முதல் தன்னியக்க ஆட்சி.',
    metrics: ['100% ஜீரோ ஹார்ட்வேர்', '24-மணிநேர டெப்ளாய்மென்ட்', 'கிரிப்டோ வாக்கு', '0% தரகு'],
    failTag: 'சந்தை இடைவெளி',
    failTitle: 'பாரம்பரிய ஆப்ஸ் வாரியத்தை ஏன் தோற்கடிக்கும்',
    failCards: [
      { icon: '📒', title: 'பதிவேட்டு ஆப்ஸ்', body: 'ஒவ்வொரு டெலிவரிக்கும் அழைப்பு/பேஸ்ட்.' },
      { icon: '🧾', title: 'குருட்டு நிதி', body: 'கசிவு மாதங்கள் கழித்து ஆடிட்டில்.' },
      { icon: '🔓', title: 'நம்பிக்கை இல்லை', body: 'காகித வாக்கு, தரகர் பூட்டு.' }
    ],
    overviewTag: 'நிர்வாக மேலோட்டம்',
    overviewTitle: 'குடியிருப்பாளர், காவலர், குழு — ஒரே OS',
    overviewBody: 'maiSociety AI டெலிவரி, செலவுக் கொடிகள், கிரிப்டோ வாக்கு, பார்க்கிங் வருவாய் மற்றும் 1-கிளிக் சிண்டிகேஷன் சேர்க்கும்.',
    architectureTitle: 'பிளாட்ஃபார்ம் கட்டமைப்பு வரைபடம்',
    architectureItems: [
      'கோர்: பில்லிங் · அறிவிப்பு · கேட்கீப்பர் · உதவி',
      'எட்ஜ் AI: டெலிவரி · ஆடிட்டர் · குழந்தை பாதுகாப்பு',
      'வருவாய்: பார்க்கிங் · maiList',
      'நம்பிக்கை: கிரிப்டோ வாக்கு · இரட்டை கையொப்பம்'
    ]
  },
  matrix: {
    eyebrow: 'போட்டி மேன்மை',
    title: 'பாரம்பரிய தளங்கள் vs maiSociety',
    lead: 'வாரிய அணிவரிசை.',
    headers: ['திறன்', 'பாரம்பரிய தளங்கள்', 'maiSociety'],
    rows: [
      ['ஹார்ட்வேர்', 'கேட் சாதனம் / சென்சார்', 'போன் + WhatsApp · ஜீரோ கேஜெட்'],
      ['தேர்தல்', 'காகித / எளிய வாக்கு', 'கிரிப்டோ 1-பிளாட்-1-வாக்கு + ரீகால்'],
      ['நிதி ஆடிட்', 'பின் மானுவல் லெட்ஜர்', 'mAI Auditor பணத்திற்கு முன்'],
      ['டெலிவரி', 'ஒவ்வொரு முறை அழைப்பு', 'SMS/புஷ் முன் அனுமதி'],
      ['பார்க்கிங் வருவாய்', 'நிலையான பே', 'மணி/மாத சந்தை · UPI'],
      ['தொலைந்த பொருள்', 'அறிவிப்பு/WhatsApp', 'ஜோடி BT + கேட் 1'],
      ['கார்பூல்', 'முறைசாரா அரட்டை', 'ஜீரோ-கமிஷன் maiCommute'],
      ['மறுவிற்பனை', 'தரகர் பூட்டு', 'maiList 1-கிளிக் சிண்டிகேஷன்']
    ]
  },
  modules: {
    eyebrow: 'தயாரிப்பு ஆழம்',
    title: '6 முக்கிய AI தொகுதிகள்',
    lead: 'குழுக்கள் உண்மையில் உரிமம் பெறும்.',
    cards: [
      { icon: '🛡️', title: 'டெலிவரி & குழந்தை பாதுகாப்பு', bullets: ['கூரியர் SMS முன் அனுமதி', 'பெற்றோர் நேர சாளரம்', 'காவலர் எச்சரிக்கை', 'HITL'] },
      { icon: '📊', title: 'mAI Auditor', bullets: ['MoM இன்வாய்ஸ் கொடி', 'இரட்டை கையொப்பத்திற்கு முன்', 'செலவு லெட்ஜர்', 'மனித நிதி வாயில்'] },
      { icon: '🔑', title: 'maiList', bullets: ['ஒருமுறை வெளியீடு', 'ஜீரோ-தரகு', 'நிலுவை/NOC', 'மீண்டும் தட்டச்சு இல்லை'] },
      { icon: '🚗', title: 'maiCommute', bullets: ['சொசைட்டி கிராஃப்', 'கமிஷன் இல்லை', 'பாதை பொருத்தம்', 'சரிபார்க்கப்பட்ட குடியிருப்பாளர்'] },
      { icon: '🅿️', title: 'ஸ்மார்ட் பார்க்கிங்', bullets: ['மணிநேர பட்டியல்', 'மாத வாடகை', 'UPI → வாலட்', '30 நிமி. காலி'] },
      { icon: '🌿', title: 'mAI Botanist', bullets: ['QR தாவர குறி', 'கம்போஸ்ட்', 'தாவர பரிமாற்றம்', 'நர்சரி ஹார்ட்வேர் இல்லை'] }
    ]
  },
  close: {
    ...EN.close,
    eyebrow: 'வணிகம் · ROI · CTA',
    title: 'வருவாய், ஆன்போர்டிங் மற்றும் அடுத்த படி',
    monetizationTitle: 'வருவாய் ROI',
    monetizationItems: [
      { title: 'பார்க்கிங் வருமானம்', body: 'காலி ஸ்லாட் · UPI · வாலட் கிரெடிட்.' },
      { title: 'ஜீரோ-தரகு ஒப்பந்தம்', body: 'maiList ஒருமுறை சிண்டிகேட்.' }
    ],
    roadmapTitle: '24-மணிநேர ஆன்போர்டிங்',
    roadmap: [
      { step: '1', title: 'அமைப்பு', body: 'சொசைட்டி · பிளாட் · பங்கு.' },
      { step: '2', title: 'தொகுதி', body: 'வாரிய அனுமதி ஆட்-ஆன்.' },
      { step: '3', title: 'நேரலை', body: 'ஆப்/WhatsApp அதே நாள்.' }
    ],
    ctaTitle: 'முழு தொழில்நுட்ப & பாதுகாப்பு கட்டமைப்பு?',
    ctaBody: '18-பக்க மாஸ்டர்கைடு — maisociety.vercel.app',
    contactTitle: 'Syncra Systems · அதிகாரப்பூர்வ தொடர்பு',
    whatsappLabel: 'WhatsApp விற்பனை'
  },
  pageLabel: 'பக்கம்'
})

const TE = pack({
  ...EN,
  pitchTag: 'అధికారిక RWA ఎగ్జిక్యూటివ్ పిచ్ డెక్',
  cover: {
    ...EN.cover,
    eyebrow: 'క్విక్ ఎగ్జిక్యూటివ్ డెక్ · 4 పేజీలు',
    title: 'maiSociety — నెక్స్ట్-జెన్ అటానమస్ AI సొసైటీ OS',
    subtitle: 'గార్డ్ లాగ్‌బుక్‌ల స్థానంలో ఫోన్-ఫస్ట్ స్వయంచాలక పాలన.',
    metrics: ['100% జీరో హార్డ్‌వేర్', '24-గంట డిప్లాయ్‌మెంట్', 'క్రిప్టో ఓటింగ్', '0% బ్రోకరేజ్'],
    failTag: 'మార్కెట్ గ్యాప్',
    failTitle: 'సాంప్రదాయ యాప్‌లు బోర్డులను ఎందుకు విఫలం చేస్తాయి',
    failCards: [
      { icon: '📒', title: 'లాగ్‌బుక్ ఆప్స్', body: 'ప్రతి డెలివరీకి కాల్/పేస్ట్.' },
      { icon: '🧾', title: 'గుడ్డి ఫైనాన్స్', body: 'లీకేజ్ నెలల తర్వాత ఆడిట్‌లో.' },
      { icon: '🔓', title: 'ట్రస్ట్ లేదు', body: 'కాగిత ఓటు, బ్రోకర్ లాక్-ఇన్.' }
    ],
    overviewTag: 'ఎగ్జిక్యూటివ్ అవలోకనం',
    overviewTitle: 'నివాసి, గార్డు, కమిటీ — ఒకే OS',
    overviewBody: 'maiSociety AI డెలివరీ, ఖర్చు ఫ్లాగ్‌లు, క్రిప్టో ఓటు, పార్కింగ్ ఆదాయం మరియు 1-క్లిక్ సిండికేషన్ జోడిస్తుంది.',
    architectureTitle: 'ప్లాట్‌ఫారమ్ ఆర్కిటెక్చర్ మ్యాప్',
    architectureItems: [
      'కోర్: బిల్లింగ్ · నోటీసులు · గేట్‌కీపర్ · హెల్ప్‌డెస్క్',
      'ఎడ్జ్ AI: డెలివరీ · ఆడిటర్ · కిడ్ సేఫ్టీ',
      'ఆదాయం: పార్కింగ్ · maiList',
      'ట్రస్ట్: క్రిప్టో ఓటు · డ్యూయల్ సంతకం'
    ]
  },
  matrix: {
    eyebrow: 'పోటీ ఎడ్జ్',
    title: 'లెగసీ ప్లాట్‌ఫారమ్‌లు vs maiSociety',
    lead: 'బోర్డు-రెడీ మ్యాట్రిక్స్.',
    headers: ['సామర్థ్యం', 'లెగసీ ప్లాట్‌ఫారమ్‌లు', 'maiSociety'],
    rows: [
      ['హార్డ్‌వేర్', 'గేట్ పరికరం / సెన్సార్', 'ఫోన్ + WhatsApp · జీరో గాడ్జెట్'],
      ['ఎన్నికలు', 'కాగితం / సాధారణ ఓటు', 'క్రిప్టో 1-ఫ్లాట్-1-ఓటు + రికాల్'],
      ['ఆర్థిక ఆడిట్', 'తర్వాత మాన్యువల్ లెడ్జర్', 'mAI Auditor చెల్లింపు ముందు'],
      ['డెలివరీ', 'ప్రతిసారి కాల్', 'SMS/పుష్ ప్రీ-అప్రూవ్'],
      ['పార్కింగ్ ఆదాయం', 'స్టాటిక్ బే', 'గంట/నెల మార్కెట్‌ప్లేస్ · UPI'],
      ['కోల్పోయిన వస్తువు', 'నోటీసు/WhatsApp', 'పెయిర్డ్ BT + గేట్ 1'],
      ['కార్‌పూల్', 'అనధికార చాట్', 'జీరో-కమిషన్ maiCommute'],
      ['రీసేల్', 'బ్రోకర్ లాక్-ఇన్', 'maiList 1-క్లిక్ సిండికేషన్']
    ]
  },
  modules: {
    eyebrow: 'ప్రొడక్ట్ లోతు',
    title: '6 కోర్ AI మాడ్యూళ్లు',
    lead: 'కమిటీలు నిజంగా లైసెన్స్ చేసేవి.',
    cards: [
      { icon: '🛡️', title: 'డెలివరీ & కిడ్ సేఫ్టీ', bullets: ['కొరియర్ SMS ప్రీ-క్లియర్', 'తల్లిదండ్రుల టైమ్ విండో', 'గార్డ్ అలర్ట్', 'HITL'] },
      { icon: '📊', title: 'mAI Auditor', bullets: ['MoM ఇన్వాయిస్ ఫ్లాగ్', 'డ్యూయల్ సంతకం ముందు', 'ఎక్స్‌పెన్స్ లెడ్జర్', 'మానవ ఫైనాన్స్ గేట్'] },
      { icon: '🔑', title: 'maiList', bullets: ['ఒక్కసారి పబ్లిష్', 'జీరో-బ్రోకరేజ్', 'బకాయి/NOC', 'మళ్లీ టైపింగ్ లేదు'] },
      { icon: '🚗', title: 'maiCommute', bullets: ['సొసైటీ గ్రాఫ్', 'కమిషన్ లేదు', 'రూట్ మ్యాచ్', 'వెరిఫైడ్ రెసిడెంట్'] },
      { icon: '🅿️', title: 'స్మార్ట్ పార్కింగ్', bullets: ['గంటవారీ జాబితా', 'నెలవారీ లీజ్', 'UPI → వాలెట్', '30 ని. వేకేట్'] },
      { icon: '🌿', title: 'mAI Botanist', bullets: ['QR ప్లాంట్ ట్యాగ్', 'కంపోస్ట్ బ్యాచ్', 'ప్లాంట్ స్వాప్', 'నర్సరీ హార్డ్‌వేర్ లేదు'] }
    ]
  },
  close: {
    ...EN.close,
    eyebrow: 'కమర్షియల్స్ · ROI · CTA',
    title: 'ఆదాయం, ఆన్‌బోర్డింగ్ మరియు తదుపరి అడుగు',
    monetizationTitle: 'మానిటైజేషన్ ROI',
    monetizationItems: [
      { title: 'పార్కింగ్ ఆదాయం', body: 'ఖాళీ స్లాట్ · UPI · వాలెట్ క్రెడిట్.' },
      { title: 'జీరో-బ్రోకరేజ్ డీల్', body: 'maiList ఒక్కసారి సిండికేట్.' }
    ],
    roadmapTitle: '24-గంట ఆన్‌బోర్డింగ్',
    roadmap: [
      { step: '1', title: 'ప్రొవిజన్', body: 'సొసైటీ · ఫ్లాట్ · రోల్.' },
      { step: '2', title: 'మాడ్యూళ్లు', body: 'బోర్డు-ఆమోదిత యాడ్-ఆన్.' },
      { step: '3', title: 'లైవ్', body: 'యాప్/WhatsApp అదే రోజు.' }
    ],
    ctaTitle: 'పూర్తి టెక్నికల్ & సెక్యూరిటీ ఆర్కిటెక్చర్?',
    ctaBody: '18-పేజీ మాస్టర్‌గైడ్ — maisociety.vercel.app',
    contactTitle: 'Syncra Systems · అధికారిక సంప్రదింపు',
    whatsappLabel: 'WhatsApp సేల్స్'
  },
  pageLabel: 'పేజీ'
})

const PACKS: Record<BrochureLocale, ExecDeckCopy> = { en: EN, hi: HI, bn: BN, mr: MR, ta: TA, te: TE }

export function getExecDeckCopy(locale: BrochureLocale): ExecDeckCopy {
  return PACKS[locale] ?? EN
}
