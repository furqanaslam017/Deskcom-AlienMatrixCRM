const fs = require('fs');
let content = fs.readFileSync('components/alien-matrix/AiLayerConsoleViewClient.tsx', 'utf8');

const replacements = [
  ['language: "pt-BR"', 'language: "en-US"'],
  ['notify("Configurações de IA e chaves salvas com sucesso!");', 'notify("AI settings and API keys saved successfully!");'],
  ['notify("Campos auto-extraídos aplicados com sucesso aos registros!");', 'notify("Auto-extracted fields applied successfully to records!");'],
  ['notify("Documento ingerido na base de conhecimento RAG!");', 'notify("Document ingested into RAG knowledge base!");'],
  ['notify("Material removido da base de conhecimento.");', 'notify("Document removed from knowledge base.");'],
  ['notify("Nova persona criada!");', 'notify("New AI persona created!");'],
  ['notify("Persona excluída.");', 'notify("AI persona deleted.");'],
  ['Camada de IA avançada: Multi-provedor (Claude, GPT, Gemini, Ollama), Personas, RAG, Lead Scoring e Handoff Humano.', 'Enterprise AI Engine: Multi-provider (Claude, GPT, Gemini, Ollama), Personas, RAG, Lead Scoring, and Intelligent Handoff.'],
  ['<span className="text-muted-foreground">Provedor Ativo:</span>', '<span className="text-muted-foreground">Active Provider:</span>'],
  ['Provedores & Modelos', 'Providers & Models'],
  ['Seleção de Provedores e Modelos', 'Model & Provider Selection'],
  ['Configure qual provedor e modelo de linguagem governa o atendimento e vendas da organização.', 'Configure which AI provider and LLM powers your organization sales and customer service.'],
  ['<label className="text-xs font-semibold text-foreground mb-1 block">Provedor Ativo</label>', '<label className="text-xs font-semibold text-foreground mb-1 block">Active AI Provider</label>'],
  ['<label className="text-xs font-semibold text-foreground mb-1 block">Modelo Principal (LLM)</label>', '<label className="text-xs font-semibold text-foreground mb-1 block">Primary Model (LLM)</label>'],
  ['<label className="text-xs font-semibold text-foreground mb-1 block">Provedor de Embeddings RAG</label>', '<label className="text-xs font-semibold text-foreground mb-1 block">RAG Embeddings Provider</label>'],
  ['<label className="text-xs font-semibold text-foreground mb-1 block">Temperatura ({settings.temperature})</label>', '<label className="text-xs font-semibold text-foreground mb-1 block">Temperature ({settings.temperature})</label>'],
  ['<label className="text-xs font-semibold text-foreground mb-1 block">Max Output Tokens</label>', '<label className="text-xs font-semibold text-foreground mb-1 block">Max Output Tokens</label>'],
  ['Chaves de API por Provedor (Criptografadas / Mascaradas)', 'Provider API Keys (Encrypted / Masked)'],
  ['As chaves são salvas com criptografia por tenant. Insira nova chave para substituir a existente.', 'Keys are securely stored with tenant encryption. Enter a new key to update existing credentials.'],
  ['{savingSettings ? "Salvando..." : "Salvar Configurações de IA"}', '{savingSettings ? "Saving..." : "Save AI Settings"}'],
  ['Módulos Inteligentes do Turno', 'Autonomous Turn Modules'],
  ['Ativação e governança de módulos neurais que rodam antes e depois de cada mensagem do cliente.', 'Toggle and govern neural intelligence modules executed before and after each conversation turn.'],
  ['Lead Scoring & Qualificação Automática', 'Autonomous Lead Scoring & Qualification'],
  ['Calcula pontuação de compra (0-100), temperatura e sentimento após cada resposta do lead.', 'Calculates purchase intent (0-100), temperature, and sentiment after every lead message.'],
  ['Extração Automática de Campos (Auto-fill)', 'Automated Field Extraction (Auto-fill)'],
  ['Preenche campos de contato, empresa e negócio automaticamente a partir da conversa.', 'Automatically populates contact, company, and deal fields directly from conversation content.'],
  ['RAG com Base de Conhecimento Própria', 'RAG with Tenant Knowledge Base'],
  ['Injeta contexto semântico de documentos, manuais e catálogos no prompt do agente.', 'Injects semantic context from uploaded documents, manuals, and FAQs into agent prompt.'],
  ['Teto Rígido de Orçamento (Hard Limit)', 'Strict Quota Enforcement (Hard Limit)'],
  ['Bloqueia chamadas quando o teto de tokens ou custo mensal for ultrapassado.', 'Blocks AI requests when monthly token or cost quota limit is reached.'],
  ['Defina o tom de voz, instruções comportamentais e saudação de cada agente da sua empresa.', 'Configure tone of voice, behavioral instructions, and greetings for each company agent.'],
  ['Criar Nova Persona', 'Create New Persona'],
  ['Criar Nova Persona de IA', 'Create New AI Persona'],
  ['<option value="formal">Formal & Executivo</option>', '<option value="formal">Formal & Executive</option>'],
  ['<option value="consultative">Consultivo & Especialista</option>', '<option value="consultative">Consultative & Expert</option>'],
  ['<option value="friendly">Amigável & Empático</option>', '<option value="friendly">Friendly & Empathetic</option>'],
  ['<option value="direct">Direto & Focado em Fechamento</option>', '<option value="direct">Direct & Closing-focused</option>'],
  ['<label className="text-xs font-semibold text-foreground block mb-1">Instruções do Sistema (System Prompt)</label>', '<label className="text-xs font-semibold text-foreground block mb-1">System Instructions (System Prompt)</label>'],
  ['>Cancelar</button>', '>Cancel</button>'],
  ['Criar Persona', 'Create Persona'],
  ['<h2 className="text-base font-semibold text-foreground">Base de Conhecimento RAG por Organização</h2>', '<h2 className="text-base font-semibold text-foreground">Organization RAG Knowledge Base</h2>'],
  ['Suba manuais de produtos, políticas comerciais e FAQs para busca semântica em tempo real pelo agente.', 'Upload product manuals, commercial policies, and FAQs for real-time semantic search by AI agents.'],
  ['Adicionar Material', 'Add Document'],
  ['<h3 className="font-semibold text-base text-foreground">Adicionar Material à Base RAG</h3>', '<h3 className="font-semibold text-base text-foreground">Add Document to RAG Base</h3>'],
  ['<option value="doc">Documento / Manual</option>', '<option value="doc">Document / Manual</option>'],
  ['<option value="faq">Perguntas Frequentes (FAQ)</option>', '<option value="faq">Frequently Asked Questions (FAQ)</option>'],
  ['<option value="url">Página Web / URL</option>', '<option value="url">Web Page / URL</option>'],
  ['<option value="catalog">Catálogo de Preços</option>', '<option value="catalog">Price Catalog</option>'],
  ['Salvar e Indexar Material', 'Save and Index Document'],
  ['Casos escalados pela IA com resumo executivo das mensagens, nível de urgência e ação recomendada para o consultor.', 'Cases escalated by AI with executive conversation summary, urgency rating, and recommended next action for the sales rep.'],
  ['{telemetry.token_usage_percent}% do teto mensal ({telemetry.monthly_token_budget.toLocaleString()})', '{telemetry.token_usage_percent}% of monthly quota ({telemetry.monthly_token_budget.toLocaleString()})'],
  ['Telemetria & Consumo de IA', 'AI Telemetry & Token Usage'],
  ['Acompanhe o consumo de tokens, custos acumulados e taxa de intervenção humana em tempo real.', 'Track real-time token consumption, accumulated costs, and human escalation rates.']
];

for (const [target, repl] of replacements) {
  content = content.split(target).join(repl);
}

fs.writeFileSync('components/alien-matrix/AiLayerConsoleViewClient.tsx', content, 'utf8');
console.log('Successfully updated AiLayerConsoleViewClient.tsx');
