import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

type Locale = (typeof routing.locales)[number];

function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return routing.defaultLocale;

  const preferredLanguages = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean);

  for (const language of preferredLanguages) {
    const locale = language.split("-")[0];
    if (routing.locales.includes(locale as Locale)) {
      return locale as Locale;
    }
  }

  return routing.defaultLocale;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
  const locale =
    (routing.locales.includes(localeCookie as Locale) ? localeCookie : null) as Locale | null;

  if (!locale) {
    const requestHeaders = await headers();
    const detected = detectLocale(requestHeaders.get("accept-language"));
    return {
      locale: detected,
      messages: (await import(`../../messages/${detected}.json`)).default,
    };
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
