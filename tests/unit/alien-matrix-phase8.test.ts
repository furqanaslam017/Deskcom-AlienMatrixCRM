import { describe, expect, it } from "vitest";
import { IDIOMA_PADRAO, IDIOMAS, normalizarIdioma } from "@/lib/i18n/idiomas";
import { REGISTRO_DE_IDIOMAS, IDIOMAS_VISIVEIS } from "@/lib/i18n/registro";
import { traduzir } from "@/lib/i18n/dicionario";
import enCatalog from "@/lib/i18n/traducoes/en.json";

describe("Phase 8: AlienMatrix Global English Localization", () => {
  it("enforces English as the sole default system language", () => {
    expect(IDIOMA_PADRAO).toBe("en");
  });

  it("registers English as an active visible language", () => {
    expect(REGISTRO_DE_IDIOMAS.some((i) => i.codigo === "en")).toBe(true);
    expect(IDIOMAS_VISIVEIS.some((i) => i.codigo === "en")).toBe(true);
  });

  it("strictly normalizes all locales to valid supported languages with English default", () => {
    expect(normalizarIdioma("pt-BR")).toBe("pt-BR");
    expect(normalizarIdioma("es")).toBe("es");
    expect(normalizarIdioma("en")).toBe("en");
    expect(normalizarIdioma("fr")).toBe("en");
    expect(normalizarIdioma(null)).toBe("en");
    expect(normalizarIdioma(undefined)).toBe("en");
  });

  it("contains over 10,000 translation keys in en.json covering the entire codebase", () => {
    const keyCount = Object.keys(enCatalog).length;
    expect(keyCount).toBeGreaterThan(10000);
  });

  it("translates common core CRM and interface terms into English", () => {
    expect(traduzir("Salvar", "en")).toBe("Save");
    expect(traduzir("Configurações", "en")).toBe("Settings");
    expect(traduzir("Cancelar", "en")).toBe("Cancel");
    expect(traduzir("Entrar com Google", "en")).toBe("Sign in with Google");
    expect(traduzir("Todas as tags", "en")).toBe("All tags");
  });

  it("returns the input text directly if already in English or not matching a PT key", () => {
    expect(traduzir("Executive Dashboard", "en")).toBe("Executive Dashboard");
    expect(traduzir("Lead Scoring & Qualification", "en")).toBe("Lead Scoring & Qualification");
  });
});
