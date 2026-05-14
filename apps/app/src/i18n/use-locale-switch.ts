"use client";

import { useCallback } from "react";
import { useLocale } from "next-intl";

export function useLocaleSwitch() {
  const currentLocale = useLocale();

  const switchLocale = useCallback(
    async (newLocale: string) => {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: newLocale }),
      });
      window.location.reload();
    },
    []
  );

  return { currentLocale, switchLocale };
}
