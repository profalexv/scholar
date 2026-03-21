/**
 * app.js — Ponto de entrada do scholar.
 *
 * Responsabilidades:
 *  - Importa todos os módulos de view e registra o roteador
 *  - Faz o boot: tenta SSO → senão exibe tela de login
 *  - Expõe funções críticas em window (goTo, doLogin, logout)
 *    para compatibilidade com handlers inline do HTML estático
 */

import { S }                                from './state.js';
import { api }                              from './api.js';
import { q }                                from './utils.js';
import { loadStoredSession, loginWithCredentials, logout } from './auth.js';

// ── View modules ─────────────────────────────────────────────────────────────
import { render as renderChamada }     from './modules/chamada.js';
import { render as renderDiario }      from './modules/diario.js';
import { render as renderOcorrencias } from './modules/ocorrencias.js';
import { render as renderPeriodos }    from './modules/periodos.js';
import { render as renderAvaliacoes }  from './modules/avaliacoes.js';
import { render as renderNotas }       from './modules/notas.js';
import { render as renderAssinatura }  from './modules/assinatura.js';

const VIEWS = {
  chamada:     renderChamada,
  diario:      renderDiario,
  ocorrencias: renderOcorrencias,
  periodos:    renderPeriodos,
  avaliacoes:  renderAvaliacoes,
  notas:       renderNotas,
  assinatura:  renderAssinatura,
};

// ── Router ───────────────────────────────────────────────────────────────────

/**
 * Navega para uma view.
 * @param {string} view  - Chave em VIEWS
 * @param {Element} el   - Elemento .nav-item clicado (para marcar .active)
 */
export function goTo(view, el) {
  [...document.querySelectorAll('.nav-item')].forEach(n => n.classList.remove('active'));
  el?.classList.add('active');

  const main = q('#main-content');
  main.innerHTML = '<div class="loading">Carregando…</div>';

  const renderer = VIEWS[view];
  if (renderer) renderer(main);
  else main.innerHTML = `<div class="empty">View "${view}" não encontrada.</div>`;
}

// ── Boot ─────────────────────────────────────────────────────────────────────

export async function startApp() {
  q('#auth-screen').style.display = 'none';
  q('#app').style.display = 'flex';

  const [cls, tch] = await Promise.all([
    api(`/classes?schoolId=${S.schoolId}`).then(d => d.data ?? d ?? []).catch(() => []),
    api(`/teachers?schoolId=${S.schoolId}`).then(d => d.data ?? d ?? []).catch(() => []),
  ]);

  S.classes  = Array.isArray(cls) ? cls : [];
  S.teachers = Array.isArray(tch) ? tch : [];

  const sbl = q('#sbl');
  if (sbl) sbl.textContent = `Escola #${S.schoolId}`;

  goTo('chamada', document.querySelector('[data-view=chamada]'));
}

// ── Globals (chamados por handlers inline no HTML) ───────────────────────────

window.goTo   = goTo;
window.logout = logout;

window.doLogin = async function () {
  const ab   = q('#api-base')?.value.trim() ?? '';
  const user = q('#login-user')?.value.trim() ?? '';
  const pass = q('#login-pass')?.value ?? '';
  const errEl = q('#auth-error');

  errEl.style.display = 'none';

  if (!ab || !user || !pass) {
    errEl.textContent  = 'Preencha todos os campos.';
    errEl.style.display = 'block';
    return;
  }

  try {
    await loginWithCredentials(ab, user, pass);
    startApp();
  } catch (e) {
    errEl.textContent  = e.message;
    errEl.style.display = 'block';
  }
};

// ── Inicialização ─────────────────────────────────────────────────────────────

if (loadStoredSession()) {
  // Preenche o campo para feedback visual, mas a tela de login estará oculta
  const storedBase = localStorage.getItem('scholar_api_base')
    || new URLSearchParams(location.search).get('api')
    || '';
  const inp = q('#api-base');
  if (inp && storedBase) inp.value = storedBase;

  startApp();
}
