'use client';
import { useEffect } from 'react';
import { installGlobalvestTranslations } from '@/lib/i18n';

const supported = ['English','French','Spanish','Portuguese','Arabic','Chinese','Hindi','German','Vietnamese','Yoruba'] as const;

export default function GlobalvestTranslationRuntime() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let activeLanguage = '';
    const apply = (requested?: string) => {
      let language = requested || 'English';
      if (!requested) { try { language = localStorage.getItem('globalvest-language') || 'English'; } catch {} }
      if (!supported.includes(language as (typeof supported)[number])) language = 'English';
      if (language === activeLanguage) return;
      cleanup?.();
      activeLanguage = language;
      const codes: Record<string,string> = {English:'en',French:'fr',Spanish:'es',Portuguese:'pt',Arabic:'ar',Chinese:'zh-CN',Hindi:'hi',German:'de',Vietnamese:'vi',Yoruba:'yo'};
      document.documentElement.lang = codes[language] || 'en';
      document.documentElement.dir = language === 'Arabic' ? 'rtl' : 'ltr';
      cleanup = installGlobalvestTranslations(language as any);
    };
    apply();
    const onLanguageChange = (event: Event) => apply((event as CustomEvent<{language?:string}>).detail?.language);
    const onStorage = (event: StorageEvent) => { if (event.key === 'globalvest-language') apply(event.newValue || 'English'); };
    window.addEventListener('globalvest-language-change', onLanguageChange);
    window.addEventListener('storage', onStorage);
    return () => { cleanup?.(); window.removeEventListener('globalvest-language-change', onLanguageChange); window.removeEventListener('storage', onStorage); };
  }, []);
  return null;
}
