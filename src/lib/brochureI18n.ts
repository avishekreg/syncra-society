/**
 * Regional language packs for Quick Exec Deck + brochure chrome.
 * All competitor wording is trademark-safe (legacy / traditional / other market platforms).
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

export type ExecDeckCopy = {
  eyebrow: string
  title: string
  lead: string
  pages: Array<{
    eyebrow: string
    title: string
    lead: string
    bullets: string[]
  }>
  comparisonHeaders: [string, string, string]
  comparisonRows: Array<[string, string, string]>
  cta: string
}

const EN: ExecDeckCopy = {
  eyebrow: 'Quick Exec Deck · 4 pages',
  title: 'mAI Society for RWA Boards',
  lead: 'A zero-hardware society OS — competitive edge vs legacy platforms, without naming other vendors.',
  pages: [
    {
      eyebrow: '01 · The opportunity',
      title: 'Replace fragmented tools with one society OS',
      lead: 'Traditional gatekeeper apps collect dues well — but residents now expect AI gate clearance, WhatsApp help, green ops, and zero-brokerage listings.',
      bullets: [
        'Core: billing, notices, gatekeeper, helpdesk',
        'Add-ons licensed per society — no forced hardware',
        'Built for committee clarity and resident trust'
      ]
    },
    {
      eyebrow: '02 · Competitive Edge vs Legacy Platforms',
      title: 'Why boards shortlist mAI Society',
      lead: 'Other market platforms excel at one job. mAI Society ships autonomous intelligence on top of everyday operations.',
      bullets: [
        'Autonomous zero-friction gatekeeper & delivery pre-approve',
        'mAI Auditor flags invoice leakage before payment (human finance gate)',
        'Cryptographic 1-Flat-1-Vote recall motions',
        'maiList 1-click rent/resale to major property portals'
      ]
    },
    {
      eyebrow: '03 · How it works',
      title: 'One picture for residents, guards, and admins',
      lead: 'Everyone works in the same society workspace — phones only, no IoT lock-in.',
      bullets: [
        'Resident app + WhatsApp assistant',
        'Guard console with kid safety & overstay HITL overrides',
        'President portal for tenants, funds, and module licensing'
      ]
    },
    {
      eyebrow: '04 · Next step',
      title: 'Request a board demo',
      lead: 'Share this 4-page deck with your RWA committee. Ask for a live product walkthrough tailored to your society.',
      bullets: [
        'Transparent per-flat pricing',
        'Modular enterprise add-ons',
        'Kolkata HQ · Syncra Systems LLP'
      ]
    }
  ],
  comparisonHeaders: ['Topic', 'Legacy Society Apps', 'mAI Society'],
  comparisonRows: [
    ['Hardware', 'Often needs gate devices', 'Phone-first · zero gadgets'],
    ['Scope', 'Mostly billing / visitors', 'Full community OS + AI modules'],
    ['Trust', 'Paper letters & files', 'Records, dues badges, fair votes'],
    ['Growth', 'Hard upgrades', 'Turn modules on when ready']
  ],
  cta: 'Request board demo'
}

const HI: ExecDeckCopy = {
  eyebrow: 'क्विक एग्ज़ेक डेक · 4 पृष्ठ',
  title: 'RWA बोर्ड के लिए mAI Society',
  lead: 'ज़ीरो-हार्डवेयर सोसाइटी OS — लीगेसी प्लेटफ़ॉर्म के मुकाबले स्पष्ट बढ़त, बिना किसी प्रतिस्पर्धी ब्रांड नाम के।',
  pages: [
    {
      eyebrow: '01 · अवसर',
      title: 'बिखरे टूल्स की जगह एक सोसाइटी OS',
      lead: 'पारंपरिक गेटकीपर ऐप्स बकाया वसूली में अच्छे हैं — लेकिन अब AI गेट, WhatsApp सहायता और ज़ीरो-ब्रोकरेज लिस्टिंग चाहिए।',
      bullets: [
        'कोर: बिलिंग, नोटिस, गेटकीपर, हेल्पडेस्क',
        'प्रति सोसाइटी ऐड-ऑन लाइसेंस — कोई जबरन हार्डवेयर नहीं',
        'कमेटी स्पष्टता और निवासी विश्वास के लिए'
      ]
    },
    {
      eyebrow: '02 · लीगेसी प्लेटफ़ॉर्म के मुकाबले बढ़त',
      title: 'बोर्ड mAI Society क्यों चुनते हैं',
      lead: 'अन्य बाज़ार प्लेटफ़ॉर्म अक्सर एक काम में माहिर होते हैं। mAI Society रोज़मर्रा के संचालन पर स्वायत्त इंटेलिजेंस जोड़ता है।',
      bullets: [
        'स्वायत्त ज़ीरो-फ्रिक्शन गेटकीपर',
        'mAI Auditor चालान लीकेज फ्लैग (मानव भुगतान गेट)',
        'क्रिप्टोग्राफ़िक 1-फ्लैट-1-वोट रिकॉल',
        'maiList 1-क्लिक किराया/बिक्री'
      ]
    },
    {
      eyebrow: '03 · कैसे काम करता है',
      title: 'निवासी, गार्ड और एडमिन — एक ही चित्र',
      lead: 'सभी एक ही सोसाइटी वर्कस्पेस में — केवल फ़ोन, कोई IoT लॉक-इन नहीं।',
      bullets: [
        'रेसिडेंट ऐप + WhatsApp असिस्टेंट',
        'गार्ड कंसोल — किड सेफ्टी व ओवरस्टे HITL',
        'प्रेसिडेंट पोर्टल — टेनेंट, फंड, मॉड्यूल'
      ]
    },
    {
      eyebrow: '04 · अगला कदम',
      title: 'बोर्ड डेमो का अनुरोध करें',
      lead: 'यह 4-पृष्ठ डेक अपनी RWA कमेटी से साझा करें। अपनी सोसाइटी के लिए कस्टम 90-सेकंड वीडियो पिच माँगें।',
      bullets: ['पारदर्शी प्रति-फ्लैट मूल्य', 'मॉड्यूलर एंटरप्राइज़ ऐड-ऑन', 'कोलकाता HQ · Syncra Systems LLP']
    }
  ],
  comparisonHeaders: ['विषय', 'लीगेसी सोसाइटी ऐप्स', 'mAI Society'],
  comparisonRows: [
    ['हार्डवेयर', 'अक्सर गेट डिवाइस', 'फ़ोन-फर्स्ट'],
    ['स्कोप', 'मुख्यतः बिलिंग/विज़िटर', 'पूर्ण कम्युनिटी OS + AI'],
    ['विश्वास', 'कागज़ी फ़ाइलें', 'रिकॉर्ड, बकाया बैज, निष्पक्ष वोट'],
    ['विकास', 'कठिन अपग्रेड', 'मॉड्यूल जब तैयार हों']
  ],
  cta: 'बोर्ड डेमो माँगें'
}

const BN: ExecDeckCopy = {
  eyebrow: 'কুইক এক্সিক ডেক · ৪ পৃষ্ঠা',
  title: 'RWA বোর্ডের জন্য mAI Society',
  lead: 'জিরো-হার্ডওয়্যার সোসাইটি OS — লিগ্যাসি প্ল্যাটফর্মের তুলনায় স্পষ্ট সুবিধা, প্রতিযোগীর ট্রেডমার্ক ছাড়াই।',
  pages: [
    {
      eyebrow: '০১ · সুযোগ',
      title: 'বিচ্ছিন্ন টুলের বদলে এক সোসাইটি OS',
      lead: 'প্রথাগত গেটকিপার অ্যাপ বকেয়া আদায়ে ভালো — কিন্তু এখন AI গেট, WhatsApp সহায়তা ও জিরো-ব্রোকারেজ লিস্টিং চাই।',
      bullets: ['কোর: বিলিং, নোটিশ, গেটকিপার, হেল্পডেস্ক', 'প্রতি সোসাইটি অ্যাড-অন লাইসেন্স', 'কমিটি স্বচ্ছতা ও বাসিন্দা আস্থা']
    },
    {
      eyebrow: '০২ · লিগ্যাসি প্ল্যাটফর্মের তুলনায় এজ',
      title: 'বোর্ড কেন mAI Society বেছে নেয়',
      lead: 'অন্যান্য মার্কেট প্ল্যাটফর্ম প্রায়শই একটি কাজে দক্ষ। mAI Society দৈনন্দিন অপারেশনে স্বায়ত্তশাসিত ইন্টেলিজেন্স যোগায়।',
      bullets: ['স্বায়ত্তশাসিত গেটকিপার', 'mAI Auditor চালান লিকেজ ফ্ল্যাগ', 'ক্রিপ্টোগ্রাফিক রিকল ভোট', 'maiList ১-ক্লিক ভাড়া/বিক্রি']
    },
    {
      eyebrow: '০৩ · কীভাবে কাজ করে',
      title: 'বাসিন্দা, গার্ড ও অ্যাডমিন — এক ছবি',
      lead: 'সবাই একই সোসাইটি ওয়ার্কস্পেসে — শুধু ফোন।',
      bullets: ['রেসিডেন্ট অ্যাপ + WhatsApp', 'গার্ড কনসোল · কিড সেফটি HITL', 'প্রেসিডেন্ট পোর্টাল']
    },
    {
      eyebrow: '০৪ · পরবর্তী ধাপ',
      title: 'বোর্ড ডেমো অনুরোধ করুন',
      lead: 'এই ৪-পৃষ্ঠার ডেক RWA কমিটির সাথে শেয়ার করুন।',
      bullets: ['স্বচ্ছ প্রতি-ফ্ল্যাট মূল্য', 'মডুলার অ্যাড-অন', 'কলকাতা HQ']
    }
  ],
  comparisonHeaders: ['বিষয়', 'লিগ্যাসি সোসাইটি অ্যাপ', 'mAI Society'],
  comparisonRows: [
    ['হার্ডওয়্যার', 'প্রায়ই গেট ডিভাইস', 'ফোন-ফার্স্ট'],
    ['স্কোপ', 'মূলত বিলিং/ভিজিটর', 'পূর্ণ কমিউনিটি OS'],
    ['আস্থা', 'কাগজের ফাইল', 'রেকর্ড ও ন্যায্য ভোট'],
    ['বৃদ্ধি', 'কঠিন আপগ্রেড', 'মডিউল চালু করুন']
  ],
  cta: 'বোর্ড ডেমো চান'
}

const MR: ExecDeckCopy = {
  eyebrow: 'क्विक एक्झेक डेक · ४ पृष्ठे',
  title: 'RWA बोर्डसाठी mAI Society',
  lead: 'झिरो-हार्डवेअर सोसायटी OS — लेगसी प्लॅटफॉर्मपेक्षा स्पष्ट धार, प्रतिस्पर्धी ट्रेडमार्क न वापरता.',
  pages: [
    {
      eyebrow: '०१ · संधी',
      title: 'तुटलेल्या टूल्सऐवजी एक सोसायटी OS',
      lead: 'पारंपरिक गेटकीपर अॅप्स थकबाकी वसुलीत चांगले — पण आता AI गेट, WhatsApp मदत आणि झिरो-ब्रोकरेज लिस्टिंग हवी.',
      bullets: ['कोर: बिलिंग, नोटीस, गेटकीपर, हेल्पडेस्क', 'प्रति सोसायटी अॅड-ऑन', 'समिती स्पष्टता']
    },
    {
      eyebrow: '०२ · लेगसी प्लॅटफॉर्म विरुद्ध एज',
      title: 'बोर्ड mAI Society का निवडतात',
      lead: 'इतर मार्केट प्लॅटफॉर्म अनेकदा एकाच कामात उत्तम. mAI Society रोजच्या ऑपरेशन्सवर स्वायत्त इंटेलिजन्स जोडते.',
      bullets: ['स्वायत्त गेटकीपर', 'mAI Auditor लीकेज फ्लॅग', 'क्रिप्टोग्राफिक रिकॉल', 'maiList १-क्लिक भाडे/विक्री']
    },
    {
      eyebrow: '०३ · कसे काम करते',
      title: 'रहिवासी, गार्ड, अॅडमिन — एक चित्र',
      lead: 'सर्व एकाच वर्कस्पेसमध्ये — फक्त फोन.',
      bullets: ['रेसिडेंट अॅप + WhatsApp', 'गार्ड कन्सोल · किड सेफ्टी', 'प्रेसिडेंट पोर्टल']
    },
    {
      eyebrow: '०४ · पुढील पाऊल',
      title: 'बोर्ड डेमोची विनंती करा',
      lead: 'हे ४-पृष्ठ डेक RWA समितीसोबत शेअर करा.',
      bullets: ['पारदर्शक दर', 'मॉड्युलर अॅड-ऑन', 'कोलकाता HQ']
    }
  ],
  comparisonHeaders: ['विषय', 'लेगसी सोसायटी अॅप्स', 'mAI Society'],
  comparisonRows: [
    ['हार्डवेअर', 'बहुधा गेट डिव्हाइस', 'फोन-फर्स्ट'],
    ['व्याप्ती', 'मुख्यतः बिलिंग', 'पूर्ण कम्युनिटी OS'],
    ['विश्वास', 'कागदी फाईल्स', 'रेकॉर्ड व निष्पक्ष मत'],
    ['वाढ', 'कठीण अपग्रेड', 'मॉड्यूल्स चालू करा']
  ],
  cta: 'बोर्ड डेमो मागा'
}

const TA: ExecDeckCopy = {
  eyebrow: 'விரைவு எக்ஸிக் டெக் · 4 பக்கங்கள்',
  title: 'RWA வாரியங்களுக்கான mAI Society',
  lead: 'ஜீரோ-ஹார்ட்வேர் சொசைட்டி OS — பாரம்பரிய தளங்களுக்கு எதிரான தெளிவான மேன்மை, போட்டியாளர் வணிகமுத்திரை இல்லாமல்.',
  pages: [
    {
      eyebrow: '01 · வாய்ப்பு',
      title: 'சிதறிய கருவிகளுக்கு பதில் ஒரே சொசைட்டி OS',
      lead: 'பாரம்பரிய கேட் கீப்பர் ஆப்ஸ் நிலுவை வசூலில் சிறந்தவை — ஆனால் இப்போது AI கேட், WhatsApp உதவி தேவை.',
      bullets: ['கோர்: பில்லிங், அறிவிப்பு, கேட்கீப்பர்', 'சொசைட்டி வாரியாக ஆட்-ஆன்', 'குழு தெளிவு']
    },
    {
      eyebrow: '02 · பாரம்பரிய தளங்களுக்கு எதிரான மேன்மை',
      title: 'வாரியங்கள் ஏன் mAI Society தேர்வு செய்கின்றன',
      lead: 'மற்ற சந்தை தளங்கள் பெரும்பாலும் ஒரு பணியில் சிறந்தவை. mAI Society தன்னியக்க நுண்ணறிவை சேர்க்கிறது.',
      bullets: ['தன்னியக்க கேட்கீப்பர்', 'mAI Auditor கசிவுக் கொடி', 'கிரிப்டோ ரீகால் வாக்கு', 'maiList 1-கிளிக் வாடகை/விற்பனை']
    },
    {
      eyebrow: '03 · எப்படி வேலை செய்கிறது',
      title: 'குடியிருப்பாளர், காவலர், நிர்வாகம் — ஒரே படம்',
      lead: 'அனைவரும் ஒரே பணியிடத்தில் — தொலைபேசி மட்டும்.',
      bullets: ['ரெசிடென்ட் ஆப் + WhatsApp', 'கார்டு கன்சோல்', 'பிரசிடென்ட் போர்டல்']
    },
    {
      eyebrow: '04 · அடுத்த படி',
      title: 'வாரிய டெமோ கோருங்கள்',
      lead: 'இந்த 4-பக்க டெக்கை RWA குழுவுடன் பகிரவும்.',
      bullets: ['வெளிப்படையான விலை', 'மாடுலர் ஆட்-ஆன்', 'கொல்கத்தா HQ']
    }
  ],
  comparisonHeaders: ['தலைப்பு', 'பாரம்பரிய சொசைட்டி ஆப்ஸ்', 'mAI Society'],
  comparisonRows: [
    ['ஹார்ட்வேர்', 'அடிக்கடி கேட் சாதனம்', 'போன்-ஃபர்ஸ்ட்'],
    ['எல்லை', 'முக்கியமாக பில்லிங்', 'முழு சமூக OS'],
    ['நம்பிக்கை', 'காகித கோப்புகள்', 'பதிவுகள் · நியாய வாக்கு'],
    ['வளர்ச்சி', 'கடின மேம்படுத்தல்', 'மாடியூல்கள் இயக்கு']
  ],
  cta: 'வாரிய டெமோ கோரு'
}

const TE: ExecDeckCopy = {
  eyebrow: 'క్విక్ ఎగ్జిక్ డెక్ · 4 పేజీలు',
  title: 'RWA బోర్డుల కోసం mAI Society',
  lead: 'జీరో-హార్డ్‌వేర్ సొసైటీ OS — లెగసీ ప్లాట్‌ఫారమ్‌లపై స్పష్టమైన ఆధిక్యం, పోటీదారు ట్రేడ్‌మార్క్‌లు లేకుండా.',
  pages: [
    {
      eyebrow: '01 · అవకాశం',
      title: 'చెదురుమదురు టూల్స్ స్థానంలో ఒక సొసైటీ OS',
      lead: 'సాంప్రదాయ గేట్‌కీపర్ యాప్‌లు బకాయిల్లో బాగున్నాయి — కానీ ఇప్పుడు AI గేట్, WhatsApp సహాయం కావాలి.',
      bullets: ['కోర్: బిల్లింగ్, నోటీసులు, గేట్‌కీపర్', 'సొసైటీ వారీగా యాడ్-ఆన్', 'కమిటీ స్పష్టత']
    },
    {
      eyebrow: '02 · లెగసీ ప్లాట్‌ఫారమ్‌లపై ఎడ్జ్',
      title: 'బోర్డులు mAI Societyను ఎందుకు ఎంచుకుంటాయి',
      lead: 'ఇతర మార్కెట్ ప్లాట్‌ఫారమ్‌లు తరచుగా ఒక పనిలో నైపుణ్యం. mAI Society స్వయంచాలక ఇంటెలిజెన్స్ జోడిస్తుంది.',
      bullets: ['స్వయంచాలక గేట్‌కీపర్', 'mAI Auditor లీకేజ్ ఫ్లాగ్', 'క్రిప్టో రికాల్ ఓటు', 'maiList 1-క్లిక్ అద్దె/అమ్మకం']
    },
    {
      eyebrow: '03 · ఎలా పనిచేస్తుంది',
      title: 'నివాసి, గార్డు, అడ్మిన్ — ఒకే చిత్రం',
      lead: 'అందరూ ఒకే వర్క్‌స్పేస్‌లో — ఫోన్ మాత్రమే.',
      bullets: ['రెసిడెంట్ యాప్ + WhatsApp', 'గార్డ్ కన్సోల్', 'ప్రెసిడెంట్ పోర్టల్']
    },
    {
      eyebrow: '04 · తదుపరి అడుగు',
      title: 'బోర్డ్ డెమో అభ్యర్థించండి',
      lead: 'ఈ 4-పేజీ డెక్‌ను RWA కమిటీతో షేర్ చేయండి.',
      bullets: ['పారదర్శక ధర', 'మాడ్యులర్ యాడ్-ఆన్', 'కోల్‌కతా HQ']
    }
  ],
  comparisonHeaders: ['విషయం', 'లెగసీ సొసైటీ యాప్‌లు', 'mAI Society'],
  comparisonRows: [
    ['హార్డ్‌వేర్', 'తరచుగా గేట్ పరికరం', 'ఫోన్-ఫస్ట్'],
    ['పరిధి', 'ప్రధానంగా బిల్లింగ్', 'పూర్తి కమ్యూనిటీ OS'],
    ['నమ్మకం', 'కాగిత ఫైల్స్', 'రికార్డులు · న్యాయ ఓటు'],
    ['వృద్ధి', 'కఠిన అప్‌గ్రేడ్', 'మాడ్యూళ్లు ఆన్ చేయండి']
  ],
  cta: 'బోర్డ్ డెమో కోరండి'
}

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
