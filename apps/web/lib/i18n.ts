'use client';

import { useSyncExternalStore } from 'react';

export type SupportedLanguage = 
  | 'en' 
  | 'es' 
  | 'fr' 
  | 'de' 
  | 'pt' 
  | 'tl' 
  | 'id' 
  | 'hi' 
  | 'ar' 
  | 'ja';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
  { code: 'tl', name: 'Filipino', nativeName: 'Tagalog', dir: 'ltr' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr' },
];

export const translations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    tagline: 'Convert, edit and fix any PDF, privately.',
    privacyBadge: 'Privacy-First',
    privacyProof: 'Privacy Proof',
    zeroUploads: '0 uploads',
    batchStudio: 'Batch Studio',
    workflows: 'Pipelines',
    pricing: 'Pricing',
    apiDocs: 'API Docs',
    dropzoneTitle: 'Drop PDF files here',
    dropzoneSubtitle: 'or click to browse from device',
    localGuarantee: '100% processed in browser. Zero bytes leave your device.',
    allTools: 'All PDF Tools',
    searchTools: 'Search 20+ PDF tools...',
    freeForever: 'Free Forever',
    startNow: 'Start Now',
    downloadPdf: 'Download PDF',
  },
  es: {
    tagline: 'Convierte, edita y repara cualquier PDF, de forma privada.',
    privacyBadge: 'Privacidad Primero',
    privacyProof: 'Prueba de Privacidad',
    zeroUploads: '0 subidas',
    batchStudio: 'Estudio por Lotes',
    workflows: 'Flujos de Trabajo',
    pricing: 'Precios',
    apiDocs: 'Docs de API',
    dropzoneTitle: 'Arrastra tus archivos PDF aquí',
    dropzoneSubtitle: 'o haz clic para explorar tu dispositivo',
    localGuarantee: '100% procesado en el navegador. Cero bytes salen de tu dispositivo.',
    allTools: 'Todas las Herramientas PDF',
    searchTools: 'Buscar más de 20 herramientas...',
    freeForever: 'Gratis Siempre',
    startNow: 'Empezar Ahora',
    downloadPdf: 'Descargar PDF',
  },
  fr: {
    tagline: 'Convertissez, modifiez et réparez tout PDF, en toute confidentialité.',
    privacyBadge: 'Confidentialité d\'Abord',
    privacyProof: 'Preuve de Confidentialité',
    zeroUploads: '0 téléversements',
    batchStudio: 'Traitement par Lot',
    workflows: 'Pipelines',
    pricing: 'Tarifs',
    apiDocs: 'Doc API',
    dropzoneTitle: 'Déposez vos fichiers PDF ici',
    dropzoneSubtitle: 'ou cliquez pour parcourir vos fichiers',
    localGuarantee: '100% traité dans le navigateur. Aucun octet ne quitte votre appareil.',
    allTools: 'Tous les Outils PDF',
    searchTools: 'Rechercher parmi 20+ outils...',
    freeForever: 'Gratuit pour Toujours',
    startNow: 'Commencer',
    downloadPdf: 'Télécharger le PDF',
  },
  de: {
    tagline: 'Konvertieren, bearbeiten und reparieren Sie PDFs privat.',
    privacyBadge: 'Datenschutz Zuerst',
    privacyProof: 'Datenschutz-Nachweis',
    zeroUploads: '0 Uploads',
    batchStudio: 'Stapelverarbeitung',
    workflows: 'Arbeitsabläufe',
    pricing: 'Preise',
    apiDocs: 'API-Doku',
    dropzoneTitle: 'PDF-Dateien hier ablegen',
    dropzoneSubtitle: 'oder klicken, um vom Gerät auszuwählen',
    localGuarantee: '100% im Browser verarbeitet. Keine Daten verlassen Ihr Gerät.',
    allTools: 'Alle PDF-Werkzeuge',
    searchTools: '20+ Werkzeuge durchsuchen...',
    freeForever: 'Für Immer Kostenlos',
    startNow: 'Jetzt Starten',
    downloadPdf: 'PDF Herunterladen',
  },
  pt: {
    tagline: 'Converta, edite e repare qualquer PDF, de forma privada.',
    privacyBadge: 'Privacidade em Primeiro Lugar',
    privacyProof: 'Prova de Privacidade',
    zeroUploads: '0 uploads',
    batchStudio: 'Estúdio em Lote',
    workflows: 'Pipelines',
    pricing: 'Preços',
    apiDocs: 'Docs da API',
    dropzoneTitle: 'Arraste os arquivos PDF aqui',
    dropzoneSubtitle: 'ou clique para navegar no seu dispositivo',
    localGuarantee: '100% processado no navegador. Zero bytes saem do dispositivo.',
    allTools: 'Todas as Ferramentas PDF',
    searchTools: 'Pesquisar ferramentas...',
    freeForever: 'Grátis para Sempre',
    startNow: 'Começar Agora',
    downloadPdf: 'Baixar PDF',
  },
  tl: {
    tagline: 'I-convert, i-edit at ayusin ang PDF nang pribado.',
    privacyBadge: 'Pribado Una',
    privacyProof: 'Patunay ng Privacy',
    zeroUploads: '0 na-upload',
    batchStudio: 'Batch Studio',
    workflows: 'Daloy ng Trabaho',
    pricing: 'Presyo',
    apiDocs: 'API Gabay',
    dropzoneTitle: 'I-drop ang mga PDF file dito',
    dropzoneSubtitle: 'o i-click para maghanap sa iyong device',
    localGuarantee: '100% pinoproseso sa browser. Walang lumalabas sa device.',
    allTools: 'Lahat ng PDF Tools',
    searchTools: 'Maghanap ng tools...',
    freeForever: 'Libre Magpakailanman',
    startNow: 'Simulan Na',
    downloadPdf: 'I-download ang PDF',
  },
  id: {
    tagline: 'Konversi, edit, dan perbaiki PDF apa pun secara privat.',
    privacyBadge: 'Privasi Utama',
    privacyProof: 'Bukti Privasi',
    zeroUploads: '0 unggahan',
    batchStudio: 'Studio Batch',
    workflows: 'Alur Kerja',
    pricing: 'Harga',
    apiDocs: 'Dokumentasi API',
    dropzoneTitle: 'Tarik file PDF ke sini',
    dropzoneSubtitle: 'atau klik untuk memilih dari perangkat',
    localGuarantee: '100% diproses di browser. Nol bita meninggalkan perangkat Anda.',
    allTools: 'Semua Alat PDF',
    searchTools: 'Cari lebih dari 20 alat...',
    freeForever: 'Gratis Selamanya',
    startNow: 'Mulai Sekarang',
    downloadPdf: 'Unduh PDF',
  },
  hi: {
    tagline: 'किसी भी पीडीएफ को निजी तौर पर बदलें, संपादित करें और ठीक करें।',
    privacyBadge: 'गोपनीयता पहले',
    privacyProof: 'गोपनीयता प्रमाण',
    zeroUploads: '0 अपलोड',
    batchStudio: 'बैच स्टूडियो',
    workflows: 'वर्कफ़्लो',
    pricing: 'मूल्य निर्धारण',
    apiDocs: 'एपीआई दस्तावेज़',
    dropzoneTitle: 'पीडीएफ फाइलें यहां छोड़ें',
    dropzoneSubtitle: 'या अपने डिवाइस से चुनने के लिए क्लिक करें',
    localGuarantee: '100% ब्राउज़र में संसाधित। आपके डिवाइस से कोई डेटा बाहर नहीं जाता।',
    allTools: 'सभी पीडीएफ उपकरण',
    searchTools: 'उपकरण खोजें...',
    freeForever: 'हमेशा के लिए निःशुल्क',
    startNow: 'अब शुरू करें',
    downloadPdf: 'पीडीएफ डाउनलोड करें',
  },
  ar: {
    tagline: 'تحويل وتعديل وإصلاح أي ملف PDF بخصوصية تامة.',
    privacyBadge: 'الخصوصية أولاً',
    privacyProof: 'إثبات الخصوصية',
    zeroUploads: '0 ملف مرفوع',
    batchStudio: 'استوديو الدفعات',
    workflows: 'مسارات العمل',
    pricing: 'الأسعار',
    apiDocs: 'توثيق API',
    dropzoneTitle: 'أسقط ملفات PDF هنا',
    dropzoneSubtitle: 'أو انقر للاختيار من جهازك',
    localGuarantee: 'تتم المعالجة بنسبة 100% في المتصفح. لا تغادر أي بيانات جهازك.',
    allTools: 'جميع أدوات PDF',
    searchTools: 'ابحث في أكثر من 20 أداة...',
    freeForever: 'مجاني دائماً',
    startNow: 'ابدأ الآن',
    downloadPdf: 'تحميل PDF',
  },
  ja: {
    tagline: 'どんなPDFも安全・プライベートに変換、編集、修復。',
    privacyBadge: 'プライバシー最優先',
    privacyProof: 'プライバシー証明',
    zeroUploads: 'アップロード 0件',
    batchStudio: '一括処理スタジオ',
    workflows: 'ワークフロー',
    pricing: '料金プラン',
    apiDocs: 'API仕様書',
    dropzoneTitle: 'ここにPDFファイルをドロップ',
    dropzoneSubtitle: 'またはクリックして端末から選択',
    localGuarantee: '100%ブラウザ内でローカル処理。ファイルが外部へ送信されることはありません。',
    allTools: '全PDFツール一覧',
    searchTools: '20種類以上のツールを検索...',
    freeForever: '完全無料',
    startNow: '今すぐ始める',
    downloadPdf: 'PDFをダウンロード',
  },
};

let currentLanguage: SupportedLanguage = 'en';
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function setGlobalLanguage(lang: SupportedLanguage) {
  currentLanguage = lang;
  if (typeof window !== 'undefined') {
    localStorage.setItem('converto_locale', lang);
    const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
    const dir = langConfig?.dir || 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }
  notify();
}

export function getGlobalLanguage(): SupportedLanguage {
  return currentLanguage;
}

export function subscribeLanguage(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useI18n() {
  const lang = useSyncExternalStore(
    subscribeLanguage,
    getGlobalLanguage,
    () => 'en' as SupportedLanguage
  );

  const t = (key: string): string => {
    const dictionary = translations[lang] || translations.en;
    return dictionary[key] || translations.en[key] || key;
  };

  return {
    currentLang: lang,
    setLanguage: setGlobalLanguage,
    t,
  };
}

// Initialize language from localStorage on client hydration
export function initializeI18n() {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem('converto_locale') as SupportedLanguage;
    if (saved && translations[saved]) {
      setGlobalLanguage(saved);
    }
  } catch {
    // ignore
  }
}
