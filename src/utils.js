/** Escapa HTML para evitar XSS em content gerado dinamicamente. */
export const E = s =>
  String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

/** Formata uma string ISO de data (YYYY-MM-DD) para dd/mm/aaaa. */
export const fmtD = iso =>
  iso ? new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR') : '—';

/** Atalho para document.querySelector */
export const q  = s => document.querySelector(s);

/** Atalho para document.querySelectorAll → Array */
export const $$ = s => [...document.querySelectorAll(s)];

/**
 * Retorna a classe CSS de cor para uma média numérica.
 * ≥7 verde, ≥5 amarelo, <5 vermelho.
 */
export function avgClass(v) {
  if (v == null) return '';
  if (v >= 7) return 'avg-pass';
  if (v >= 5) return 'avg-warn';
  return 'avg-fail';
}

/** Badge HTML para status genérico (ativo/aberta/resolvida/inactive…). */
export function statusBadge(s) {
  const cls = {
    ativo:'badge-success', ativa:'badge-success', active:'badge-success',
    aberta:'badge-danger', resolvida:'badge-success', inactive:'badge-gray',
  };
  const labels = {
    ativo:'Ativo', ativa:'Ativa', active:'Ativo',
    aberta:'Aberta', resolvida:'Resolvida', inactive:'Inativo',
  };
  return `<span class="badge ${cls[s] ?? 'badge-gray'}">${labels[s] ?? E(s)}</span>`;
}

/** Retorna a pill HTML de tipo de período (bimestre/trimestre/semestre/modulo). */
export function periodTag(type) {
  const cls    = { bimestre:'tag-bimestre', trimestre:'tag-trimestre', semestre:'tag-semestre', modulo:'tag-modulo' };
  const labels = { bimestre:'Bimestre', trimestre:'Trimestre', semestre:'Semestre', modulo:'Módulo' };
  return `<span class="period-tag ${cls[type] ?? 'tag-bimestre'}">${labels[type] ?? E(type)}</span>`;
}

/** Capitaliza a primeira letra. */
export const capitalize = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
