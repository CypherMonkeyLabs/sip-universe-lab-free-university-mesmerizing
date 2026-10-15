export const LANGS = [
  { id: "en", label: "English", dir: "ltr" },
  { id: "es", label: "Español", dir: "ltr" },
  { id: "hi", label: "हिन्दी", dir: "ltr" },
  { id: "te", label: "తెలుగు", dir: "ltr" },
  { id: "fr", label: "Français", dir: "ltr" },
  { id: "de", label: "Deutsch", dir: "ltr" },
  { id: "ja", label: "日本語", dir: "ltr" },
  { id: "ar", label: "العربية", dir: "rtl" },
];

const STR = {
  en: {
    diagrams: "Diagrams", flows: "Flows", charts: "Charts", cheats: "Cheat Codes", play: "Play",
    ecosystem: "Ecosystem", downloads: "Downloads", careers: "Careers", regions: "Regions",
    tagline: "Signaling, media, borders", greeting: "Follow the signal.",
    heroLead: "Call path, ladders, and borders.", start: "Start at the protocol",
    openAtlas: "Open the diagrams", listen: "Play the architect clip", search: "Search PRACK, CUBE, 488…",
    audioTitle: "Architect notes", enlarge: "Enlarge", why: "Why this matters",
  },
  es: {
    diagrams: "Diagramas", flows: "Flujos", charts: "Gráficos", cheats: "Chuletas", play: "Practicar",
    ecosystem: "Ecosistema", downloads: "Descargas", careers: "Carreras", regions: "Regiones",
    tagline: "Señalización, medios, fronteras", greeting: "Sigue la señalización.",
    heroLead: "Ruta de llamada, escaleras y fronteras.", start: "Empieza por el protocolo",
    openAtlas: "Abrir diagramas", listen: "Oír a los arquitectos", search: "Buscar PRACK, CUBE, 488…",
    audioTitle: "Notas del arquitecto", enlarge: "Ampliar", why: "Por qué importa",
  },
  hi: {
    diagrams: "आरेख", flows: "प्रवाह", charts: "चार्ट", cheats: "चीट कोड", play: "अभ्यास",
    ecosystem: "पारिस्थितिकी", downloads: "डाउनलोड", careers: "करियर", regions: "क्षेत्र",
    tagline: "सिग्नलिंग, मीडिया, बॉर्डर", greeting: "सिग्नल का अनुसरण करें।",
    heroLead: "कॉल पथ, लैडर, और बॉर्डर।", start: "प्रोटोकॉल से शुरू करें",
    openAtlas: "आरेख खोलें", listen: "आर्किटेक्ट क्लिप चलाएँ", search: "PRACK, CUBE, 488 खोजें…",
    audioTitle: "आर्किटेक्ट नोट्स", enlarge: "बड़ा करें", why: "यह क्यों मायने रखता है",
  },
  te: {
    diagrams: "పటాలు", flows: "ప్రవాహాలు", charts: "చార్టులు", cheats: "చీట్ కోడ్స్", play: "అభ్యాసం",
    ecosystem: "పర్యావరణం", downloads: "డౌన్‌లోడ్లు", careers: "కెరీర్", regions: "ప్రాంతాలు",
    tagline: "సిగ్నలింగ్, మీడియా, బార్డర్లు", greeting: "సిగ్నల్‌ను అనుసరించండి.",
    heroLead: "కాల్ పాత్, లాడర్లు, బార్డర్లు.", start: "ప్రోటోకాల్ వద్ద ప్రారంభించండి",
    openAtlas: "పటాలు తెరవండి", listen: "ఆర్కిటెక్ట్ క్లిప్ ప్లే చేయండి", search: "PRACK, CUBE, 488 వెతకండి…",
    audioTitle: "ఆర్కిటెక్ట్ నోట్స్", enlarge: "పెద్దదిగా", why: "ఇది ఎందుకు ముఖ్యం",
  },
  fr: {
    diagrams: "Schémas", flows: "Flux", charts: "Graphiques", cheats: "Antisèches", play: "Jouer",
    ecosystem: "Écosystème", downloads: "Téléchargements", careers: "Parcours", regions: "Régions",
    tagline: "Signalisation, média, frontières", greeting: "Suivez la signalisation.",
    heroLead: "Chemin d'appel, échelles et frontières.", start: "Commencer par le protocole",
    openAtlas: "Ouvrir les schémas", listen: "Écouter les architectes", search: "Chercher PRACK, CUBE, 488…",
    audioTitle: "Notes d'architecte", enlarge: "Agrandir", why: "Pourquoi c'est important",
  },
  de: {
    diagrams: "Diagramme", flows: "Abläufe", charts: "Schaubilder", cheats: "Spickzettel", play: "Üben",
    ecosystem: "Ökosystem", downloads: "Downloads", careers: "Laufbahn", regions: "Regionen",
    tagline: "Signalisierung, Medien, Grenzen", greeting: "Folge der Signalisierung.",
    heroLead: "Rufpfad, Leitern und Grenzen.", start: "Beim Protokoll starten",
    openAtlas: "Diagramme öffnen", listen: "Architektengespräch abspielen", search: "PRACK, CUBE, 488 suchen…",
    audioTitle: "Architektennotizen", enlarge: "Vergrößern", why: "Warum das zählt",
  },
  ja: {
    diagrams: "図", flows: "フロー", charts: "グラフ", cheats: "早見表", play: "練習",
    ecosystem: "エコシステム", downloads: "ダウンロード", careers: "キャリア", regions: "地域",
    tagline: "シグナリング、メディア、境界", greeting: "信号を追う。",
    heroLead: "コールパス、ラダー、ボーダー。", start: "プロトコルから始める",
    openAtlas: "図を開く", listen: "建築家クリップを再生", search: "PRACK、CUBE、488 を検索…",
    audioTitle: "アーキテクトのメモ", enlarge: "拡大", why: "なぜ重要か",
  },
  ar: {
    diagrams: "المخططات", flows: "التدفقات", charts: "الرسوم", cheats: "أوراق المرجع", play: "تدريب",
    ecosystem: "المنظومة", downloads: "التنزيلات", careers: "المسارات", regions: "المناطق",
    tagline: "إشارات ووسائط وحدود", greeting: "اتبع الإشارة.",
    heroLead: "مسار النداء، والسلالم، والحدود.", start: "ابدأ من البروتوكول",
    openAtlas: "افتح المخططات", listen: "تشغيل حوار المعماريين", search: "ابحث عن PRACK أو CUBE أو 488…",
    audioTitle: "ملاحظات المعماري", enlarge: "تكبير", why: "لماذا هذا مهم",
  },
};

let active = "en";

export function currentLang() {
  return active;
}

export function t(key) {
  return (STR[active] && STR[active][key]) || STR.en[key] || key;
}

export function applyLang(lang) {
  const meta = LANGS.find((item) => item.id === lang) || LANGS[0];
  active = meta.id;
  document.documentElement.lang = meta.id;
  document.documentElement.dir = meta.dir;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const value = t(el.dataset.i18n);
    if (value) el.textContent = value;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
  });
  document.querySelectorAll("[data-lang-select]").forEach((sel) => {
    if (sel.value !== meta.id) sel.value = meta.id;
  });
  const line = document.querySelector("#mascot-line");
  if (line) line.textContent = t("greeting");
}
