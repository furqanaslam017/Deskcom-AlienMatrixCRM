const assert = require('assert');
const fs = require('fs');

const enCatalog = JSON.parse(fs.readFileSync('lib/i18n/traducoes/en.json', 'utf8'));
const keyCount = Object.keys(enCatalog).length;
console.log('1. en.json key count:', keyCount);
assert(keyCount > 10000, 'Expected >10,000 keys in en.json');

// Check translations
const terms = {
  'Salvar': 'Save',
  'Configurações': 'Settings',
  'Cancelar': 'Cancel',
  'Entrar com Google': 'Sign in with Google',
  'Todas as tags': 'All tags'
};

for (const [k, expected] of Object.entries(terms)) {
  const actual = enCatalog[k];
  console.log('2. Translation test:', k, '->', actual);
  assert.strictEqual(actual, expected);
}

// Check idioms
const idiomasSrc = fs.readFileSync('lib/i18n/idiomas.ts', 'utf8');
assert(idiomasSrc.includes('export const IDIOMA_PADRAO: Idioma = "en";'), 'Expected IDIOMA_PADRAO = "en"');
console.log('3. idiomas.ts verified: IDIOMA_PADRAO is en');

// Check registro
const registroSrc = fs.readFileSync('lib/i18n/registro.ts', 'utf8');
assert(registroSrc.includes('codigo: "en"'), 'Expected en in registro');
assert(!registroSrc.includes('codigo: "pt-BR"'), 'Expected pt-BR removed from registro');
console.log('4. registro.ts verified: only English registered');

// Check layout
const layoutSrc = fs.readFileSync('app/layout.tsx', 'utf8');
assert(layoutSrc.includes('lang="en"'), 'Expected lang="en" in app/layout.tsx');
console.log('5. app/layout.tsx verified: lang="en"');

console.log('\nAll Phase 8 English-Only invariants VERIFIED 100% PASS!');
