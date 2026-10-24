import { describe, expect, it } from "vitest";
import { parseCsv, formatCsv } from "@/lib/alien-matrix/import-export-service";
import { renderInvoiceHtml } from "@/lib/alien-matrix/invoices-service";
import { createPhase2AgentTools } from "@/lib/alien-matrix/phase2-ai-tools";

describe("AlienMatrix Phase 2 — Core CRM Modules", () => {
  it("parses RFC 4180 CSV with quotes, commas and newlines correctly", () => {
    const csv = `Name,Email,Notes\n"Silva, Carlos",carlos@empresa.com,"Note with, comma"\n"Ana Costa",ana@teste.com,"Line 1\nLine 2"`;
    const rows = parseCsv(csv);

    expect(rows.length).toBe(3);
    expect(rows[0]).toEqual(["Name", "Email", "Notes"]);
    expect(rows[1]).toEqual(["Silva, Carlos", "carlos@empresa.com", "Note with, comma"]);
    expect(rows[2]?.[0]).toBe("Ana Costa");
    expect(rows[2]?.[1]).toBe("ana@teste.com");
  });

  it("formats rows to standard CSV string escaping internal quotes", () => {
    const data = [
      ["SKU", "Product Name", "Price"],
      ["CRM-01", 'License "Pro"', "499.00"],
    ];
    const output = formatCsv(data);
    expect(output).toContain('"CRM-01"');
    expect(output).toContain('"License ""Pro"""');
    expect(output).toContain('"499.00"');
  });

  it("renders a valid printable HTML invoice with line items, tax, and branding", () => {
    const mockInvoice = {
      invoice_number: "INV-2026-TEST",
      kind: "invoice",
      status: "paid",
      title: "Enterprise Subscription",
      subtotal_cents: 100000,
      discount_cents: 10000,
      tax_cents: 5000,
      total_cents: 95000,
      currency: "USD",
      issue_date: "2026-10-22",
      due_date: "2026-11-22",
      contact: { name: "John Doe", email: "john@example.com" },
    };

    const mockItems = [
      { description: "Software License", quantity: 1, unit_price_cents: 100000, total_cents: 95000 },
    ];

    const html = renderInvoiceHtml(mockInvoice, mockItems, {
      companyName: "AlienMatrix Corp",
    });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("INV-2026-TEST");
    expect(html).toContain("John Doe");
    expect(html).toContain("Software License");
    expect(html).toContain("AlienMatrix Corp");
    expect(html).toContain("status-paid");
    expect(html).toContain("@media print");
  });

  it("instantiates AI Agent Phase 2 tools with valid schemas", () => {
    const tools = createPhase2AgentTools("test-org-uuid", "test-user-uuid");
    expect(tools.alien_matrix_convert_lead).toBeDefined();
    expect(tools.alien_matrix_search_products).toBeDefined();
    expect(tools.alien_matrix_create_quote_or_invoice).toBeDefined();
    expect(tools.alien_matrix_log_activity).toBeDefined();
    expect(tools.alien_matrix_check_duplicates).toBeDefined();

    expect(tools.alien_matrix_convert_lead.description).toContain("Converts a qualified sales lead");
    expect(tools.alien_matrix_search_products.description).toContain("Searches the organization's product");
    expect(tools.alien_matrix_create_quote_or_invoice.description).toContain("Drafts a formal Quote");
  });
});
