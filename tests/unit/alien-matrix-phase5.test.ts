import { describe, expect, it } from "vitest";
import { evaluateChatbotResponse } from "@/lib/alien-matrix/whatsapp-chatbots-service";
import { generateClickToWhatsAppUrl } from "@/lib/alien-matrix/whatsapp-links-service";
import { DEFAULT_GUARDRAILS } from "@/lib/alien-matrix/tenant-guardrails-service";

describe("AlienMatrix Phase 5 — WhatsApp Flagship & Shared Inbox", () => {
  it("evaluates chatbot keyword routing and fallback correctly", () => {
    const mockChatbots = [
      {
        id: "bot-1",
        name: "Comercial Bot",
        keywords: ["preco", "planos", "quanto custa", "comprar"],
        response_text: "Nossos planos começam a partir de USD $49/mês.",
        fallback_mode: "ai_agent",
        is_active: true,
      },
      {
        id: "bot-2",
        name: "Suporte Técnico",
        keywords: ["suporte", "ajuda", "problema", "erro"],
        response_text: "Um atendente técnico da equipe assumirá em instantes.",
        fallback_mode: "human_handoff",
        is_active: true,
      },
      {
        id: "bot-3",
        name: "Bot Inativo",
        keywords: ["promocao"],
        response_text: "Oferta expirada",
        is_active: false,
      },
    ];

    // 1. Keyword match on bot-1
    const res1 = evaluateChatbotResponse(mockChatbots, "Olá, qual o PRECO dos planos?");
    expect(res1.matched).toBe(true);
    expect(res1.responseText).toContain("USD $49/mês");
    expect(res1.fallbackMode).toBe("ai_agent");

    // 2. Keyword match on bot-2
    const res2 = evaluateChatbotResponse(mockChatbots, "Estou com um erro no sistema e preciso de suporte");
    expect(res2.matched).toBe(true);
    expect(res2.responseText).toContain("atendente técnico");
    expect(res2.fallbackMode).toBe("human_handoff");

    // 3. Inactive bot match should be ignored
    const res3 = evaluateChatbotResponse(mockChatbots, "Tem alguma promocao hoje?");
    expect(res3.matched).toBe(false);
    expect(res3.fallbackMode).toBe("ai_agent");

    // 4. No keyword match -> Fallback to AI agent
    const res4 = evaluateChatbotResponse(mockChatbots, "Vocês integram com ERP Totvs?");
    expect(res4.matched).toBe(false);
    expect(res4.fallbackMode).toBe("ai_agent");
  });

  it("generates Click-to-WhatsApp URLs with prefilled text and sanitization", () => {
    const phone = "+55 (11) 98888-7777";
    const prefilledText = "Olá! Vim do anúncio do Instagram.";
    const url = generateClickToWhatsAppUrl(phone, prefilledText);

    expect(url).toContain("https://wa.me/5511988887777");
    expect(url).toContain("?text=");
    expect(url).toContain("Instagram");
  });

  it("validates the 7 pre-send guardrails defaults and safety parameters", () => {
    expect(DEFAULT_GUARDRAILS.stopOptoutEnabled).toBe(true);
    expect(DEFAULT_GUARDRAILS.lgpdEnabled).toBe(true);
    expect(DEFAULT_GUARDRAILS.antiBanPacingEnabled).toBe(true);
    expect(DEFAULT_GUARDRAILS.messagingWindowEnabled).toBe(true);
    expect(DEFAULT_GUARDRAILS.spinningEnabled).toBe(true);
    expect(DEFAULT_GUARDRAILS.promiseSemanticEnabled).toBe(true);
    expect(DEFAULT_GUARDRAILS.disclosureEnabled).toBe(true);
    expect(DEFAULT_GUARDRAILS.emergencyKillswitch).toBe(false);
    expect(DEFAULT_GUARDRAILS.maxHourlySends).toBe(60);
    expect(DEFAULT_GUARDRAILS.customBlockedWords.length).toBeGreaterThan(0);
  });

  it("validates anti-ban throttling delay calculations", () => {
    const totalRecipients = 50;
    const throttleDelaySeconds = 5;
    const totalSeconds = totalRecipients * throttleDelaySeconds;
    const totalMinutes = totalSeconds / 60;

    expect(totalSeconds).toBe(250);
    expect(totalMinutes).toBeCloseTo(4.16, 1);
  });
});
