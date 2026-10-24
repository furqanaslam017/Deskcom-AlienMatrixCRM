import { describe, it, expect } from "vitest";
import {
  computeLeadScoreAndSentiment,
} from "@/lib/alien-matrix/ai-insights-service";
import {
  estimateTokenCount,
  calculateChunks,
} from "@/lib/alien-matrix/ai-knowledge-service";
import {
  calculateUsageCostCents,
} from "@/lib/alien-matrix/ai-usage-service";
import {
  maskApiKey,
} from "@/lib/alien-matrix/ai-settings-service";

describe("AlienMatrix Phase 6: AI Layer Upgrade", () => {
  it("computes lead scoring, sentiment, next-best-actions, and regex extractions", () => {
    const chatText =
      "Olá! Gostei muito do projeto. Quanto custa a cobertura? Meu orçamento é até R$ 950.000,00 e quero fechar este mês. Meu email é cliente.vip@gmail.com e telefone 11988887777.";

    const result = computeLeadScoreAndSentiment(chatText);

    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.sentiment).toBe("positive");
    expect(result.sentimentScore).toBeGreaterThan(0.5);
    expect(result.extractedFields.email).toBe("cliente.vip@gmail.com");
    expect(result.extractedFields.phone).toBe("11988887777");
    expect(result.extractedFields.budget).toBe(950000);
    expect(result.nextBestActions.length).toBeGreaterThan(0);
    expect(result.nextBestActions[0]?.action_type).toBe("send_quote");
  });

  it("detects frustrated customers and triggers human escalation recommendations", () => {
    const frustratedText =
      "Que demora absurda para responder! Atendimento péssimo, vou cancelar tudo!";

    const result = computeLeadScoreAndSentiment(frustratedText);

    expect(result.sentiment).toBe("frustrated");
    expect(result.score).toBeLessThan(50);
    expect(result.nextBestActions[0]?.action_type).toBe("human_escalation");
  });

  it("calculates model usage cost and token chunk estimation accurately", () => {
    // Claude 3.5 Sonnet: 10,000 prompt tokens (0.3c/1k = 3c) + 2,000 completion (1.5c/1k = 3c) = 6 cents
    const sonnetCost = calculateUsageCostCents("claude-3-5-sonnet-20241022", 10000, 2000);
    expect(sonnetCost).toBe(6);

    // Text token estimation
    const sampleText = "The quick brown fox jumps over the lazy dog.";
    const tokens = estimateTokenCount(sampleText);
    expect(tokens).toBeGreaterThan(5);

    const chunks = calculateChunks(sampleText, 500);
    expect(chunks).toBe(1);
  });

  it("masks API keys securely preventing accidental leakage", () => {
    const secretKey = "sk-ant-api03-verylongsecretkey123456789";
    const masked = maskApiKey(secretKey);

    expect(masked).toContain("••••••••");
    expect(masked.startsWith("sk-a")).toBe(true);
    expect(masked.endsWith("6789")).toBe(true);
    expect(masked).not.toContain("verylongsecretkey");
  });
});
