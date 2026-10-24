import { enUS } from "date-fns/locale";
import type { Locale } from "date-fns";

import { IDIOMA_PADRAO, type Idioma } from "./idiomas";

const LOCALE_DE_DATA: Record<Idioma, Locale> = {
  en: enUS,
};

/** O `Locale` do date-fns para quem está lendo. */
export function localeDeData(_idioma?: Idioma): Locale {
  return enUS;
}

/**
 * A etiqueta BCP-47 para as APIs nativas (`Intl`, `toLocaleString`).
 */
export function tagDeIdioma(_idioma?: Idioma): string {
  return "en-US";
}
