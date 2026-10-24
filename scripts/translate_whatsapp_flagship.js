const fs = require('fs');
let content = fs.readFileSync('components/alien-matrix/WhatsAppFlagshipViewClient.tsx', 'utf8');

const replacements = [
  ['setStatusMessage("Mensagem enviada com sucesso pelo canal WhatsApp!");', 'setStatusMessage("Message sent successfully via WhatsApp channel!");'],
  ['setStatusMessage("Configurações de guardrails atualizadas com sucesso!");', 'setStatusMessage("Safety guardrails updated successfully!");'],
  ['placeholder="Digite sua resposta no WhatsApp... (use /demo ou /preco para scripts)"', 'placeholder="Type your WhatsApp reply... (use /demo or /pricing for quick templates)"'],
  ['placeholder="Ex: @carlos cliente solicitou desconto de 10% no plano anual..."', 'placeholder="e.g. @carlos client requested a 10% discount on annual plan..."'],
  ['Salvar Nota Interna', 'Save Internal Note'],
  ['<p className="font-medium text-sm">Nenhum número de WhatsApp conectado.</p>', '<p className="font-medium text-sm">No WhatsApp numbers connected.</p>'],
  ['<p className="font-semibold text-foreground">Configuração dos 7 Guardrails Pré-Envio (Pre-Send)</p>', '<p className="font-semibold text-foreground">Configuration of 7 Pre-Send Safety Guardrails</p>'],
  ['>Cancelar</button>', '>Cancel</button>'],
  ['Múltiplos números (WAHA & Meta Cloud), caixa de entrada compartilhada, broadcasts anti-ban e 7 guardrails.', 'Multi-number support (WAHA & Meta Cloud API), shared team inbox, anti-ban broadcasts, and 7 configurable safety guardrails.'],
  ['Nova Transmissão', 'New Broadcast'],
  ['Caixa de Entrada ({conversations.length})', 'Shared Team Inbox ({conversations.length})'],
  ['Multi-Números & Sessões ({numbers.length})', 'Multi-Numbers & Sessions ({numbers.length})'],
  ['Campanhas & Anti-Ban', 'Campaigns & Anti-Ban'],
  ['7 Guardrails de Envio', '7 Safety Guardrails'],
  ['Reconectar', 'Reconnect'],
  ['Conecte múltiplos números por WAHA ou pela API Oficial da Meta.', 'Connect multiple phone numbers using WAHA or the official Meta Cloud API.'],
  ['Conectar Primeiro Número', 'Connect First Number'],
  ['Disparar Transmissão', 'Launch Broadcast'],
  ['Abra o WhatsApp &gt; Aparelhos Conectados &gt; Conectar um Aparelho', 'Open WhatsApp &gt; Linked Devices &gt; Link a Device'],
  ['Conectar Número', 'Connect Number'],
  ['Conectar Novo Número WhatsApp', 'Connect New WhatsApp Number'],
  ['Provedor de Conexão', 'Connection Provider'],
  ['Nome do Canal / Rótulo', 'Channel Label / Name'],
  ['Número de Telefone (E.164 com DDI)', 'Phone Number (E.164 with Country Code)'],
  ['Token de Acesso (API Oficial)', 'Access Token (Official API)'],
  ['ID do Número (Phone Number ID Meta)', 'Phone Number ID (Meta Cloud API)']
];

for (const [target, repl] of replacements) {
  content = content.split(target).join(repl);
}

fs.writeFileSync('components/alien-matrix/WhatsAppFlagshipViewClient.tsx', content, 'utf8');
console.log('Successfully updated WhatsAppFlagshipViewClient.tsx');
