const fs = require('fs');
const path = require('path');

function replaceInFile(relativePath, pairs) {
  const fullPath = path.join(__dirname, '..', relativePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  for (const [target, repl] of pairs) {
    content = content.split(target).join(repl);
  }
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated ${relativePath}`);
}

replaceInFile('components/alien-matrix/AlienMatrixAdminViewClient.tsx', [
  ['Salvar Configurações de Segurança', 'Save Security Settings'],
  ['Salvo com sucesso!', 'Saved successfully!'],
  ['Salvar Preferências', 'Save Preferences'],
  ['Lixeira & Recuperação de Registros Excluídos', 'Recycle Bin & Deleted Record Recovery'],
  ['Itens excluídos podem ser recuperados ou purgados definitivamente.', 'Deleted items can be restored or permanently purged.'],
  ['A lixeira está vazia. Nenhum item excluído pendente.', 'The recycle bin is empty. No deleted items found.'],
  ['>Cancelar</button>', '>Cancel</button>']
]);

replaceInFile('components/alien-matrix/CalendarViewClient.tsx', [
  ['"pt-BR"', '"en-US"'],
  ['Nenhuma atividade ou compromisso registrado.', 'No activities or scheduled appointments found.'],
  ['<option value="completed">Concluída com Sucesso</option>', '<option value="completed">Completed Successfully</option>'],
  ['>Cancelar</button>', '>Cancel</button>']
]);

replaceInFile('components/alien-matrix/ConvertLeadModal.tsx', [
  ['throw new Error(json.error || json.message || "Falha ao converter lead");', 'throw new Error(json.error || json.message || "Failed to convert lead");'],
  ['>Cancelar</button>', '>Cancel</button>'],
  ['Confirmar Conversão', 'Confirm Conversion']
]);

replaceInFile('components/alien-matrix/DealsViewClient.tsx', [
  ['<span>Taxa de Sucesso</span>', '<span>Win Rate</span>'],
  ['Nenhum negócio nesta etapa', 'No deals in this stage']
]);

replaceInFile('components/alien-matrix/InvoicesViewClient.tsx', [
  ['throw new Error(json.error || json.message || "Erro ao salvar fatura");', 'throw new Error(json.error || json.message || "Error saving invoice");'],
  ['Nenhuma fatura ou proposta encontrada.', 'No invoices or proposals found.'],
  ['>Cancelar</button>', '>Cancel</button>']
]);

replaceInFile('components/alien-matrix/ProductsViewClient.tsx', [
  ['throw new Error(json.error || json.message || "Erro ao salvar produto");', 'throw new Error(json.error || json.message || "Error saving product");'],
  ['if (!confirm("Tem certeza que deseja excluir este produto?")) return;', 'if (!confirm("Are you sure you want to delete this product?")) return;'],
  ['title="Excluir produto"', 'title="Delete product"'],
  ['Nenhum produto cadastrado no catálogo.', 'No products found in catalog.'],
  ['>Cancelar</button>', '>Cancel</button>'],
  ['Salvar Produto', 'Save Product']
]);

replaceInFile('components/alien-matrix/WorkflowsViewClient.tsx', [
  ['setStatusMessage(`Workflow executado com sucesso! Status: ${data.data?.status ?? "success"}`);', 'setStatusMessage(`Workflow executed successfully! Status: ${data.data?.status ?? "success"}`);'],
  ['setStatusMessage(`Erro: ${data.error?.message || "Falha na execução"}`);', 'setStatusMessage(`Error: ${data.error?.message || "Execution failed"}`);'],
  ['<p className="font-medium text-sm">Nenhum workflow configurado ainda.</p>', '<p className="font-medium text-sm">No workflows configured yet.</p>'],
  ['setStatusMessage(`Envio simulado com sucesso para o formulário "${f.title}"!`);', 'setStatusMessage(`Simulated submission sent successfully for form "${f.title}"!`);'],
  ['<p className="font-medium text-sm">Nenhum formulário criado ainda.</p>', '<p className="font-medium text-sm">No lead capture forms created yet.</p>'],
  ['setStatusMessage(`Webhook "${wh.name}" disparado com sucesso!`);', 'setStatusMessage(`Webhook "${wh.name}" triggered successfully!\`);'],
  ['Nenhuma execução registrada recentemente. Teste um workflow acima para gerar histórico.', 'No executions recorded recently. Trigger a workflow above to generate execution logs.'],
  ['>Cancelar</button>', '>Cancel</button>'],
  ['Salvar Workflow', 'Save Workflow']
]);

replaceInFile('components/alien-matrix/AiLayerConsoleViewClient.tsx', [
  ['>Cancelar</button>', '>Cancel</button>']
]);

replaceInFile('components/alien-matrix/WhatsAppFlagshipViewClient.tsx', [
  ['setStatusMessage(`Campanha "${b.name}" disparada com sucesso!`);', 'setStatusMessage(`Campaign "${b.name}" triggered successfully!`);'],
  ['setStatusMessage(`Número ${json.data.phone_number} cadastrado com sucesso!`);', 'setStatusMessage(`Number ${json.data.phone_number} registered successfully!`);'],
  ['>Cancelar</button>', '>Cancel</button>']
]);

console.log('All AlienMatrix components updated successfully!');
