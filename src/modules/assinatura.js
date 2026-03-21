/**
 * módulo: assinatura.js
 * Gerencia a assinatura (addon) do módulo escolar.
 */

import { S }         from '../state.js';
import { api }       from '../api.js';
import { statusBadge } from '../utils.js';
import { E }         from '../utils.js';

const PLANS = [
  { id:'lite',   label:'Lite',   desc:'≤10 turmas',   price:'R$560/mês'  },
  { id:'basic',  label:'Basic',  desc:'≤30 turmas',   price:'R$980/mês'  },
  { id:'flex',   label:'Flex',   desc:'≤60 turmas',   price:'R$1.790/mês'},
  { id:'total',  label:'Total',  desc:'Ilimitado',    price:'R$2.600/mês'},
];

// ── Render ───────────────────────────────────────────────────────────────────

export async function render(main) {
  main.innerHTML = '<div class="loading">Carregando…</div>';

  const status = await api(`/escolar/status?schoolId=${S.schoolId}`)
    .then(d => d.data ?? d ?? {}).catch(() => ({ active: false }));

  main.innerHTML = `
    <div class="page-title">Assinatura</div>
    <div class="page-sub">Addon Escolar · scholar.axom.app</div>

    <div class="card" style="max-width:600px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
        <div style="font-size:32px">🎓</div>
        <div>
          <div style="font-size:16px;font-weight:700">Módulo Pedagógico</div>
          <div style="font-size:13px;color:var(--text-secondary)">
            Chamada digital, diário, avaliações, boletins e muito mais
          </div>
        </div>
        <div style="margin-left:auto">
          ${statusBadge(status.active ? 'ativo' : 'inactive')}
          ${status.devMode ? '<span class="badge badge-warning" style="margin-left:6px">DEV</span>' : ''}
        </div>
      </div>

      ${status.active ? _renderActive(status) : _renderPlans()}
    </div>`;
}

function _renderActive(status) {
  return `
    <div class="divider"></div>
    <div style="font-size:14px;line-height:1.8;margin-bottom:20px">
      <div><strong>Plano:</strong> ${E(status.plan ?? '—')}</div>
      <div><strong>Turmas usadas:</strong> ${status.classCount ?? 0} / ${status.maxClasses ?? '∞'}</div>
      <div><strong>Alunos ativos:</strong> ${status.studentCount ?? '—'}</div>
    </div>
    <div class="divider"></div>
    <button class="btn btn-danger" onclick="cancelEscolar()">Cancelar addon escolar</button>`;
}

function _renderPlans() {
  return `
    <p style="margin-bottom:20px;font-size:14px;color:var(--text-secondary)">
      Escolha um plano para ativar o módulo pedagógico:
    </p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      ${PLANS.map(p => `
        <button
          class="btn btn-ghost"
          style="flex-direction:column;align-items:flex-start;padding:16px;height:auto;text-align:left"
          onclick="subscribeEscolar('${p.id}')">
          <span style="font-weight:700;font-size:14px">${E(p.label)}</span>
          <span style="font-size:12px;color:var(--text-secondary)">${E(p.desc)}</span>
          <span style="font-size:13px;color:var(--primary);margin-top:4px;font-weight:600">${E(p.price)}</span>
        </button>`).join('')}
    </div>`;
}

// ── Ações ────────────────────────────────────────────────────────────────────

async function subscribeEscolar(plan) {
  const d = await api('/escolar/subscribe', {
    method: 'POST',
    body:   { school_id: S.schoolId, plan_type: plan },
  });
  if (d.success !== false) window.goTo('assinatura', document.querySelector('[data-view=assinatura]'));
  else alert('Erro: ' + (d.error ?? 'desconhecido'));
}

async function cancelEscolar() {
  if (!confirm('Cancelar o addon Escolar? Todos os dados serão mantidos.')) return;
  const d = await api('/escolar/cancel', { method:'POST', body:{ school_id: S.schoolId } });
  if (d.success !== false) window.goTo('assinatura', document.querySelector('[data-view=assinatura]'));
  else alert('Erro: ' + (d.error ?? 'desconhecido'));
}

// ── Globals ──────────────────────────────────────────────────────────────────
window.subscribeEscolar = subscribeEscolar;
window.cancelEscolar    = cancelEscolar;
