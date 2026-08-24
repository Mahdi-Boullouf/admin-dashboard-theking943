"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { t, getLang, setLang, type Dict, type Lang } from "@/lib/clinic-i18n";

type Ctx = {
  lang: Lang;
  tr: Dict;
  toggle: () => void;
};

const ClinicLangContext = createContext<Ctx>({
  lang: "fr",
  tr: t.fr,
  toggle: () => {},
});

/**
 * Context rather than each page calling getLang() itself: the doctor portal
 * does the latter and syncs with a `storage` event, which never fires in the
 * tab that wrote it — so toggling there leaves the open page in the old
 * language until a reload. Here the toggle re-renders every consumer at once.
 */
export function ClinicLangProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Starts at the SSR default and syncs on mount, so server and first client
  // render agree and React does not report a hydration mismatch.
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    setLangState(getLang());
  }, []);

  const toggle = useCallback(() => {
    setLangState((prev) => {
      const next: Lang = prev === "fr" ? "en" : "fr";
      setLang(next);
      return next;
    });
  }, []);

  return (
    <ClinicLangContext.Provider value={{ lang, tr: t[lang], toggle }}>
      {children}
    </ClinicLangContext.Provider>
  );
}

export function useClinicLang() {
  return useContext(ClinicLangContext);
}
