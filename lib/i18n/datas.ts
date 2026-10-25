import { enUS, es, ptBR } from "date-fns/locale";
import type { Locale } from "date-fns";

import { IDIOMA_PADRAO, type Idioma } from "./idiomas";
import { idiomaVisivelPorCodigo } from "./registro";

const LOCALE_DE_DATA: Record<Idioma, Locale> = {
  en: enUS,
  "pt-BR": ptBR,
  es,
};

/** O `Locale` do date-fns para quem está lendo. */
export function localeDeData(idioma?: Idioma): Locale {
  if (!idioma) return enUS;
  return LOCALE_DE_DATA[idioma] ?? LOCALE_DE_DATA[IDIOMA_PADRAO];
}

/**
 * A etiqueta BCP-47 para as APIs nativas (`Intl`, `toLocaleString`).
 */
export function tagDeIdioma(idioma?: Idioma): string {
  if (!idioma) return "en";
  return idiomaVisivelPorCodigo(idioma).tagBcp47;
}
