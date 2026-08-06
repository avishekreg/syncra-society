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
    metrics: [string, string, string]
    summaryTag: string
    summaryTitle: string
    summaryBody: string
    summaryBullets: [string, string, string, string]
  }
  matrix: {
    eyebrow: string
    title: string
    lead: string
    headers: [string, string, string]
    rows: Array<[string, string, string]>
    costTitle: string
    costHeaders: [string, string, string]
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
    wasteTitle: string
    paysTitle: string
    netTitle: string
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

const CONTACT_EN = [
  'Syncra Systems LLP · Platform Team',
  'Kolkata, West Bengal, India',
  'hello@syncrasystems.com'
]

const MATRIX_ROWS: Array<[string, string, string]> = [
  ['Hardware', 'Gate devices / sensors / kiosks', 'Phone + WhatsApp · zero gadgets'],
  ['Elections', 'Paper ballot or basic polls', 'Cryptographic 1-Flat-1-Vote + recall'],
  ['Financial audit', 'Manual ledgers after the fact', 'mAI Auditor flags leakage pre-payment'],
  ['Delivery clearance', 'Guard paste / call every time', 'SMS / push interceptor pre-approves'],
  ['Parking', 'Static bays · no owner earnings', 'Hourly + monthly marketplace · UPI'],
  ['Property listings', 'Broker lock-in / re-entry', 'maiList 1-click multi-portal syndication']
]

const MODULE_CARDS_EN: ExecModuleCard[] = [
  {
    icon: '🛡️',
    title: 'Delivery Interceptor',
    bullets: [
      'Auto pre-clear courier SMS / push',
      'Parent time-window kid exits',
      'Guard loud alert if missing',
      'HITL override for disputes'
    ]
  },
  {
    icon: '📊',
    title: 'mAI Auditor',
    bullets: [
      'MoM utility & invoice variance',
      'Flags before dual-sign pay',
      'Grounded in society ledger',
      'Human finance gate mandatory'
    ]
  },
  {
    icon: '🔑',
    title: 'maiList',
    bullets: [
      'Publish once · fan-out portals',
      'Zero-brokerage in-society',
      'Resale: dues · NOC · ₹/sqft',
      'No re-typing across sites'
    ]
  },
  {
    icon: '🚗',
    title: 'maiCommute',
    bullets: [
      'Flat-verified society rides',
      'Zero external commission',
      'Matched departure windows',
      'Trust via resident identity'
    ]
  },
  {
    icon: '🅿️',
    title: 'Monetized Parking',
    bullets: [
      'Hourly vacant-bay listings',
      'Monthly neighbor leases',
      'UPI → owner wallet credits',
      'Vacate reminder 30 min prior'
    ]
  },
  {
    icon: '🌿',
    title: 'mAI Botanist',
    bullets: [
      'QR plant tags · care plans',
      'Weather-aware garden tasks',
      'Compost & neighbor swap',
      'No nursery hardware lock-in'
    ]
  }
]

const EN: ExecDeckCopy = {
  brandBanner: 'maiSociety by Syncra Systems',
  pitchTag: 'Official RWA Executive Pitch Deck',
  cover: {
    eyebrow: 'Quick Executive Deck · 4 pages',
    title: 'maiSociety — Next-Gen Autonomous AI Society OS',
    subtitle:
      'Phone-first society operating system for RWAs — billing, gate, governance, finance AI, and owner earnings. Zero gadgets to buy.',
    metrics: ['0 Hardware', '24h Deployment', '300% ROI'],
    summaryTag: 'Executive summary',
    summaryTitle: 'A net-profit platform — not another society expense line',
    summaryBody:
      'maiSociety replaces logbook gate ops and post-facto ledgers with autonomous delivery clearance, predictive expense flags, cryptographic votes, parking monetization, and 1-click rent/resale syndication — licensed per society, no IoT purchase.',
    summaryBullets: [
      'Stop 15–20% vendor / tanker leakage with pre-payment Auditor holds',
      'Eliminate ₹60k–₹1.2L/year hardware AMC — software only',
      'Recover 8–12% dues lag with digital billing follow-through',
      'Earn ₹8k–₹25k/mo from idle visitor parking slots'
    ]
  },
  matrix: {
    eyebrow: 'Competitive edge',
    title: 'Legacy Gatekeeper Apps vs maiSociety',
    lead: 'Board-ready matrix — where traditional apps stop, the AI society OS continues.',
    headers: ['Capability', 'Legacy Gatekeeper Apps', 'maiSociety'],
    rows: MATRIX_ROWS,
    costTitle: 'Cost comparison — why gadgets lose to software',
    costHeaders: ['Line item', 'Legacy path', 'maiSociety']
  },
  modules: {
    eyebrow: 'Product depth',
    title: 'Six core AI modules committees license',
    lead: 'Dense, phone-first add-ons — no forced sensors or kiosks.',
    cards: MODULE_CARDS_EN
  },
  close: {
    eyebrow: 'ROI · Onboarding · CTA',
    title: 'Why the society pays ₹0 net',
    wasteTitle: 'Traditional RWA financial waste',
    paysTitle: 'How maiSociety pays for itself (300% ROI)',
    netTitle: 'Net bottom line for the committee',
    roadmapTitle: '24-Hour Onboarding Roadmap',
    roadmap: [
      { step: '1', title: 'Provision', body: 'Create society · import flats · invite roles — no hardware.' },
      { step: '2', title: 'License modules', body: 'Enable only board-approved AI add-ons.' },
      { step: '3', title: 'Go live', body: 'Residents + guards on app / WhatsApp same day.' }
    ],
    ctaTitle: 'Want the 18-Page Technical Masterguide?',
    ctaBody:
      'Full architecture, security threat model, module deep-dives, and 2-page financial ROI framework at maisociety.vercel.app.',
    contactTitle: 'Syncra Systems · Official Contact',
    contactLines: CONTACT_EN,
    whatsappLabel: 'WhatsApp Sales',
    whatsappUrl: WA_URL,
    qrCaption: 'maisociety.vercel.app'
  },
  pageLabel: 'Page'
}

const HI: ExecDeckCopy = {
  ...EN,
  brandBanner: 'maiSociety by Syncra Systems',
  pitchTag: 'आधिकारिक RWA एग्ज़ेक्यूटिव पिच डेक',
  cover: {
    ...EN.cover,
    eyebrow: 'क्विक एग्ज़ेक्यूटिव डेक · 4 पृष्ठ',
    title: 'maiSociety — नेक्स्ट-जेन ऑटोनॉमस AI सोसाइटी OS',
    subtitle: 'फ़ोन-फर्स्ट सोसाइटी OS — बिलिंग, गेट, गवर्नेंस, फाइनेंस AI। बिना गैजेट।',
    metrics: ['0 हार्डवेयर', '24घं डिप्लॉय', '300% ROI'],
    summaryTag: 'कार्यकारी सारांश',
    summaryTitle: 'खर्च नहीं — नेट प्रॉफिट प्लेटफ़ॉर्म',
    summaryBody:
      'लॉगबुक गेट और बाद में ऑडिट की जगह — डिलीवरी क्लियरेंस, खर्च फ्लैग, क्रिप्टो वोट, पार्किंग कमाई, 1-क्लिक लिस्टिंग।',
    summaryBullets: [
      'वेंडर/टैंकर लीकेज 15–20% रोकें',
      'हार्डवेयर AMC ₹60k–₹1.2L/वर्ष बचाएँ',
      'ड्यूज़ लैग 8–12% घटाएँ',
      'पार्किंग से ₹8k–₹25k/माह कमाएँ'
    ]
  },
  matrix: {
    ...EN.matrix,
    eyebrow: 'प्रतिस्पर्धी बढ़त',
    title: 'Legacy Gatekeeper Apps बनाम maiSociety',
    lead: 'बोर्ड-रेडी मैट्रिक्स — जहाँ पुराने ऐप रुकते हैं, AI OS जारी रहता है।',
    costTitle: 'लागत तुलना — गैजेट बनाम सॉफ़्टवेयर'
  },
  modules: {
    ...EN.modules,
    eyebrow: 'उत्पाद गहराई',
    title: 'छह मुख्य AI मॉड्यूल',
    lead: 'फ़ोन-फर्स्ट ऐड-ऑन — बिना IoT लॉक-इन।'
  },
  close: {
    ...EN.close,
    eyebrow: 'ROI · ऑनबोर्डिंग · CTA',
    title: 'सोसाइटी नेट ₹0 क्यों देती है',
    wasteTitle: 'पारंपरिक RWA वित्तीय बर्बादी',
    paysTitle: 'maiSociety खुद कैसे चुकाता है (300% ROI)',
    netTitle: 'कमेटी के लिए नेट बॉटम लाइन',
    roadmapTitle: '24-घंटे ऑनबोर्डिंग रोडमैप',
    roadmap: [
      { step: '1', title: 'प्रोविज़न', body: 'सोसाइटी बनाएँ · फ्लैट इम्पोर्ट · भूमिकाएँ — बिना हार्डवेयर।' },
      { step: '2', title: 'मॉड्यूल लाइसेंस', body: 'केवल बोर्ड-अनुमोदित AI ऐड-ऑन चालू करें।' },
      { step: '3', title: 'गो लाइव', body: 'निवासी + गार्ड ऐप/WhatsApp पर उसी दिन।' }
    ],
    ctaTitle: '18-पेज टेक्निकल मास्टरगाइड चाहिए?',
    ctaBody: 'पूर्ण आर्किटेक्चर, सिक्योरिटी और ROI फ्रेमवर्क — maisociety.vercel.app',
    contactTitle: 'Syncra Systems · आधिकारिक संपर्क',
    whatsappLabel: 'WhatsApp सेल्स'
  },
  pageLabel: 'पृष्ठ'
}

const BN: ExecDeckCopy = {
  ...EN,
  pitchTag: 'অফিসিয়াল RWA এক্সিকিউটিভ পিচ ডেক',
  cover: {
    ...EN.cover,
    eyebrow: 'কুইক এক্সিকিউটিভ ডেক · ৪ পৃষ্ঠা',
    title: 'maiSociety — নেক্সট-জেন অটোনমাস AI সোসাইটি OS',
    subtitle: 'ফোন-ফার্স্ট সোসাইটি OS — বিলিং, গেট, গভর্নেন্স, ফাইন্যান্স AI। কোনো গ্যাজেট নয়।',
    metrics: ['০ হার্ডওয়্যার', '২৪ঘণ্টা ডিপ্লয়', '৩০০% ROI'],
    summaryTag: 'এক্সিকিউটিভ সারাংশ',
    summaryTitle: 'খরচ নয় — নেট লাভের প্ল্যাটফর্ম',
    summaryBody: 'লগবুক গেট ও পোস্ট-ফ্যাক্টো লেজারের বদলে স্বায়ত্তশাসিত ক্লিয়ারেন্স, খরচ ফ্ল্যাগ, ভোট, পার্কিং আয়।',
    summaryBullets: [
      'ভেন্ডর/ট্যাংকার লিকেজ ১৫–২০% থামান',
      'হার্ডওয়্যার AMC ₹৬০k–₹১.২L/বছর বাঁচান',
      'ডিউজ ল্যাগ ৮–১২% কমান',
      'পার্কিং থেকে ₹৮k–₹২৫k/মাস আয়'
    ]
  },
  matrix: {
    ...EN.matrix,
    eyebrow: 'প্রতিযোগিতামূলক সুবিধা',
    title: 'Legacy Gatekeeper Apps বনাম maiSociety',
    costTitle: 'খরচ তুলনা — গ্যাজেট বনাম সফটওয়্যার'
  },
  modules: {
    ...EN.modules,
    eyebrow: 'প্রোডাক্ট গভীরতা',
    title: 'ছয়টি মূল AI মডিউল',
    lead: 'ফোন-ফার্স্ট অ্যাড-অন — IoT লক-ইন ছাড়া।'
  },
  close: {
    ...EN.close,
    eyebrow: 'ROI · অনবোর্ডিং · CTA',
    title: 'সোসাইটি নেট ₹০ কেন দেয়',
    wasteTitle: 'ঐতিহ্যবাহী RWA আর্থিক অপচয়',
    paysTitle: 'maiSociety নিজে কীভাবে শোধ করে (৩০০% ROI)',
    netTitle: 'কমিটির নেট বটম লাইন',
    roadmapTitle: '২৪-ঘণ্টা অনবোর্ডিং রোডম্যাপ',
    roadmap: [
      { step: '1', title: 'প্রোভিশন', body: 'সোসাইটি তৈরি · ফ্ল্যাট ইমপোর্ট · রোল — হার্ডওয়্যার নেই।' },
      { step: '2', title: 'মডিউল লাইসেন্স', body: 'শুধু বোর্ড-অনুমোদিত AI চালু করুন।' },
      { step: '3', title: 'গো লাইভ', body: 'রেসিডেন্ট + গার্ড অ্যাপ/WhatsApp একই দিন।' }
    ],
    ctaTitle: '১৮-পৃষ্ঠার টেকনিক্যাল মাস্টারগাইড?',
    contactTitle: 'Syncra Systems · অফিসিয়াল যোগাযোগ',
    whatsappLabel: 'WhatsApp সেলস'
  },
  pageLabel: 'পৃষ্ঠা'
}

const MR: ExecDeckCopy = {
  ...EN,
  pitchTag: 'अधिकृत RWA एक्झिक्युटिव पिच डेक',
  cover: {
    ...EN.cover,
    eyebrow: 'क्विक एक्झिक्युटिव डेक · ४ पृष्ठे',
    title: 'maiSociety — नेक्स्ट-जेन ऑटोनॉमस AI सोसायटी OS',
    subtitle: 'फोन-फर्स्ट सोसायटी OS — बिलिंग, गेट, गव्हर्नन्स, फायनान्स AI. गॅझेट नाही.',
    metrics: ['० हार्डवेअर', '२४तास डिप्लॉय', '३००% ROI'],
    summaryTag: 'कार्यकारी सारांश',
    summaryTitle: 'खर्च नाही — नेट नफा प्लॅटफॉर्म',
    summaryBody: 'लॉगबुक गेट आणि उशिरा ऑडिटऐवजी — डिलिव्हरी क्लिअरन्स, खर्च फ्लॅग, मतदान, पार्किंग कमाई.',
    summaryBullets: [
      'वेंडर/टँकर लीकेज १५–२०% थांबवा',
      'हार्डवेअर AMC ₹६०k–₹१.२L/वर्ष वाचवा',
      'ड्यूज लाग ८–१२% कमी करा',
      'पार्किंगने ₹८k–₹२५k/महिना कमवा'
    ]
  },
  matrix: {
    ...EN.matrix,
    eyebrow: 'स्पर्धात्मक धार',
    title: 'Legacy Gatekeeper Apps विरुद्ध maiSociety',
    costTitle: 'खर्च तुलना — गॅझेट विरुद्ध सॉफ्टवेअर'
  },
  modules: {
    ...EN.modules,
    eyebrow: 'उत्पादन खोली',
    title: 'सहा मुख्य AI मॉड्यूल्स',
    lead: 'फोन-फर्स्ट अॅड-ऑन — IoT लॉक-इन नाही.'
  },
  close: {
    ...EN.close,
    eyebrow: 'ROI · ऑनबोर्डिंग · CTA',
    title: 'सोसायटी नेट ₹० का देते',
    wasteTitle: 'पारंपरिक RWA आर्थिक अपव्यय',
    paysTitle: 'maiSociety स्वतः कसे भरते (३००% ROI)',
    netTitle: 'समितीसाठी नेट तळाची ओळ',
    roadmapTitle: '२४-तास ऑनबोर्डिंग रोडमॅप',
    roadmap: [
      { step: '1', title: 'प्रोव्हिजन', body: 'सोसायटी तयार · फ्लॅट इम्पोर्ट · भूमिका — हार्डवेअर नाही.' },
      { step: '2', title: 'मॉड्यूल परवाना', body: 'फक्त बोर्ड-मंजूर AI चालू करा.' },
      { step: '3', title: 'गो लाइव्ह', body: 'रहिवासी + गार्ड अॅप/WhatsApp त्याच दिवशी.' }
    ],
    ctaTitle: '१८-पृष्ठ टेक्निकल मास्टरगाईड?',
    contactTitle: 'Syncra Systems · अधिकृत संपर्क',
    whatsappLabel: 'WhatsApp सेल्स'
  },
  pageLabel: 'पृष्ठ'
}

const TA: ExecDeckCopy = {
  ...EN,
  pitchTag: 'அதிகாரப்பூர்வ RWA எக்ஸிக்யூட்டிவ் பிட்ச் டெக்',
  cover: {
    ...EN.cover,
    eyebrow: 'குயிக் எக்ஸிக்யூட்டிவ் டெக் · 4 பக்கங்கள்',
    title: 'maiSociety — நெக்ஸ்ட்-ஜென் ஆட்டோனமஸ் AI சொசைட்டி OS',
    subtitle: 'போன்-ஃபர்ஸ்ட் சொசைட்டி OS — பில்லிங், கேட், கவர்னன்ஸ், நிதி AI. கேஜெட் இல்லை.',
    metrics: ['0 வன்பொருள்', '24மணி டிப்ளாய்', '300% ROI'],
    summaryTag: 'நிர்வாக சுருக்கம்',
    summaryTitle: 'செலவு அல்ல — நிகர லாப தளம்',
    summaryBody: 'லாக்புக் கேட் மற்றும் பிறகு ஆடிட் இடத்தில் — டெலிவரி கிளியரன்ஸ், செலவு கொடி, வாக்கெடுப்பு, பார்க்கிங் வருவாய்.',
    summaryBullets: [
      'வெண்டர்/டேங்கர் கசிவு 15–20% நிறுத்துங்கள்',
      'வன்பொருள் AMC ₹60k–₹1.2L/ஆண்டு சேமியுங்கள்',
      'டியூஸ் தாமதம் 8–12% குறையுங்கள்',
      'பார்க்கிங்கிலிருந்து ₹8k–₹25k/மாதம் ஈட்டுங்கள்'
    ]
  },
  matrix: {
    ...EN.matrix,
    eyebrow: 'போட்டி நன்மை',
    title: 'Legacy Gatekeeper Apps vs maiSociety',
    costTitle: 'செலவு ஒப்பீடு — கேஜெட் vs மென்பொருள்'
  },
  modules: {
    ...EN.modules,
    eyebrow: 'தயாரிப்பு ஆழம்',
    title: 'ஆறு முக்கிய AI தொகுதிகள்',
    lead: 'போன்-ஃபர்ஸ்ட் ஆட்-ஆன் — IoT பூட்டு இல்லை.'
  },
  close: {
    ...EN.close,
    eyebrow: 'ROI · ஆன்போர்டிங் · CTA',
    title: 'சொசைட்டி நிகர ₹0 ஏன் செலுத்துகிறது',
    wasteTitle: 'பாரம்பரிய RWA நிதி வீண்',
    paysTitle: 'maiSociety தானே எப்படி செலுத்துகிறது (300% ROI)',
    netTitle: 'குழுவுக்கான நிகர அடிவரி',
    roadmapTitle: '24-மணிநேர ஆன்போர்டிங் வரைபடம்',
    roadmap: [
      { step: '1', title: 'அமைப்பு', body: 'சொசைட்டி உருவாக்கு · பிளாட் இறக்கு · பங்குகள் — வன்பொருள் இல்லை.' },
      { step: '2', title: 'தொகுதி உரிமம்', body: 'போர்டு அனுமதித்த AI மட்டும் இயக்குங்கள்.' },
      { step: '3', title: 'லைவ்', body: 'வாசி + காவலர் ஆப்/WhatsApp அதே நாள்.' }
    ],
    ctaTitle: '18-பக்க தொழில்நுட்ப மாஸ்டர்கைடு?',
    contactTitle: 'Syncra Systems · அதிகாரப்பூர்வ தொடர்பு',
    whatsappLabel: 'WhatsApp விற்பனை'
  },
  pageLabel: 'பக்கம்'
}

const TE: ExecDeckCopy = {
  ...EN,
  pitchTag: 'అధికారిక RWA ఎగ్జిక్యూటివ్ పిచ్ డెక్',
  cover: {
    ...EN.cover,
    eyebrow: 'క్విక్ ఎగ్జిక్యూటివ్ డెక్ · 4 పేజీలు',
    title: 'maiSociety — నెక్స్ట్-జెన్ ఆటానమస్ AI సొసైటీ OS',
    subtitle: 'ఫోన్-ఫస్ట్ సొసైటీ OS — బిల్లింగ్, గేట్, గవర్నెన్స్, ఫైనాన్స్ AI. గాడ్జెట్ లేదు.',
    metrics: ['0 హార్డ్‌వేర్', '24గం డిప్లాయ్', '300% ROI'],
    summaryTag: 'ఎగ్జిక్యూటివ్ సారాంశం',
    summaryTitle: 'ఖర్చు కాదు — నెట్ లాభ ప్లాట్‌ఫామ్',
    summaryBody: 'లాగ్‌బుక్ గేట్ మరియు తర్వాత ఆడిట్ బదులు — డెలివరీ క్లియరెన్స్, ఖర్చు ఫ్లాగ్, ఓటు, పార్కింగ్ ఆదాయం.',
    summaryBullets: [
      'వెండర్/ట్యాంకర్ లీకేజ్ 15–20% ఆపండి',
      'హార్డ్‌వేర్ AMC ₹60k–₹1.2L/సంవత్సరం ఆదా',
      'డ్యూస్ లాగ్ 8–12% తగ్గించండి',
      'పార్కింగ్ నుండి ₹8k–₹25k/నెల సంపాదించండి'
    ]
  },
  matrix: {
    ...EN.matrix,
    eyebrow: 'పోటీ ప్రయోజనం',
    title: 'Legacy Gatekeeper Apps vs maiSociety',
    costTitle: 'ఖర్చు పోలిక — గాడ్జెట్ vs సాఫ్ట్‌వేర్'
  },
  modules: {
    ...EN.modules,
    eyebrow: 'ఉత్పత్తి లోతు',
    title: 'ఆరు కోర్ AI మాడ్యూళ్లు',
    lead: 'ఫోన్-ఫస్ట్ యాడ్-ఆన్ — IoT లాక్-ఇన్ లేదు.'
  },
  close: {
    ...EN.close,
    eyebrow: 'ROI · ఆన్‌బోర్డింగ్ · CTA',
    title: 'సొసైటీ నెట్ ₹0 ఎందుకు చెల్లిస్తుంది',
    wasteTitle: 'సాంప్రదాయ RWA ఆర్థిక వృథా',
    paysTitle: 'maiSociety తానే ఎలా చెల్లిస్తుంది (300% ROI)',
    netTitle: 'కమిటీకి నెట్ బాటమ్ లైన్',
    roadmapTitle: '24-గంటల ఆన్‌బోర్డింగ్ రోడ్‌మ్యాప్',
    roadmap: [
      { step: '1', title: 'ప్రొవిజన్', body: 'సొసైటీ సృష్టి · ఫ్లాట్ ఇంపోర్ట్ · రోల్స్ — హార్డ్‌వేర్ లేదు.' },
      { step: '2', title: 'మాడ్యూల్ లైసెన్స్', body: 'బోర్డు-ఆమోదిత AI మాత్రమే ఆన్ చేయండి.' },
      { step: '3', title: 'గో లైవ్', body: 'నివాసులు + గార్డులు యాప్/WhatsApp అదే రోజు.' }
    ],
    ctaTitle: '18-పేజీ టెక్నికల్ మాస్టర్‌గైడ్?',
    contactTitle: 'Syncra Systems · అధికారిక సంప్రదింపు',
    whatsappLabel: 'WhatsApp సేల్స్'
  },
  pageLabel: 'పేజీ'
}

const PACKS: Record<BrochureLocale, ExecDeckCopy> = { en: EN, hi: HI, bn: BN, mr: MR, ta: TA, te: TE }

export function getExecDeckCopy(locale: BrochureLocale): ExecDeckCopy {
  return PACKS[locale] ?? EN
}
