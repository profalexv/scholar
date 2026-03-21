/**
 * módulo: avaliacoes.js
 * CRUD de avaliações (provas, trabalhos, atividades…) por turma e período.
 */

import { S }         from '../state.js';
import { api }       from '../api.js';
import { E, fmtD, q } from '../utils.js';
import { showModal } from '../modal.js';

// Cache de períodos carregados para uso no modal
let _periods = [];

// ── Render ───────────────────────────────────────────────────────────────────

export async function render(main) {
  const year = new Date().getFullYear();

  main.innerHTML = `
    <div class="page-title">Avaliações</div>
    <div class="page-sub">Provas, trabalhos e atividades por turma e período</div>

    <div class="toolbar">
      <select id="av-class" class="form-control" style="width:220px" onchange="loadAvaliacoes()">
        <option value="">Todas as turmas</option>
        ${S.classes.map(c => `<option value="${c.id}">${E(c.name)}</option>`).join('')}
      </select>
      <select id="av-period" class="form-control" style="width:240px" onchange="loadAvaliacoes()">
        <option value="">Todos os períodos</option>
      </select>
      <div class="toolbar-right">
        <button class="btn btn-primary" onclick="modalAvaliacao(null)">+ Nova avaliação</button>
      </div>
    </div>

    <div id="av-body"><div class="loading">Carregando…</div></div>`;

  // Período selector
  _periods = await api(`/escolar/periods?schoolId=${S.schoolId}&year=${year}`)
    .then(d => d.data ?? d ?? []).catch(() => []);

  const ps = q('#av-period');
  _periods.forEach(p => {
    const o = document.createElement('option');
    o.value = p.id; o.textContent = p.name; ps.appendChild(o);
  });

  loadAvaliacoes();
}

// ── Listar ───────────────────────────────────────────────────────────────────

async function loadAvaliacoes() {
  const classId  = q('#av-class')?.value  ?? '';
  const periodId = q('#av-period')?.value ?? '';
  const body     = q('#av-body');
  if (!body) return;

  body.innerHTML = '<div class="loading">Carregando…</div>';

  let qs = `?schoolId=${S.schoolId}`;
  if (classId)  qs += `&classId=${classId}`;
  if (periodId) qs += `&periodId=${periodId}`;

  const rows = await api(`/escolar/assessments${qs}`)
    .then(d => d.data ?? d ?? []).catch(() => []);

  if (!rows.length) {
    body.innerHTML = '<div class="empty">Nenhuma avaliação cadastrada.</div>';
    return;
  }

  body.innerHTML = `
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>Nome</th><th>Turma</th><th>Disciplina</th>
            <th>Tipo</th><th style="text-align:center">Máx.</th>
            <th style="text-align:center">Peso</th><th>Data</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td><strong>${E(r.name)}</strong></td>
              <td>${E(S.classes.find(c => c.id == r.class_id)?.name ?? '—')}</td>
              <td>${E(r.subject)}</td>
              <td><span class="badge badge-gray">${E(r.type)}</span></td>
              <td style="text-align:center">${E(r.max_score)}</td>
              <td style="text-align:center">${E(r.weight)}</td>
              <td>${r.date ? fmtD(r.date) : '—'}</td>
              <td style="white-space:nowrap">
                <button class="btn btn-ghost btn-sm"
                  onclick="modalAvaliacao(${JSON.stringify(r).replace(/"/g,'&quot;')})">
                  Editar
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteAvaliacao(${r.id})">✗</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── Modal ────────────────────────────────────────────────────────────────────

function modalAvaliacao(av) {
  const isEdit  = !!av?.id;
  const perOpts = _periods.map(p =>
    `<option value="${p.id}" ${av?.period_id == p.id ? 'selected' : ''}>${E(p.name)}</option>`
  ).join('');

  showModal(`
    <div class="modal">
      <div class="modal-title">${isEdit ? 'Editar' : 'Nova'} Avaliação</div>
      <div class="form-row">
        <div class="form-group">
          <label>Turma *</label>
          <select id="av-class2" class="form-control" ${isEdit ? 'disabled' : ''}>
            <option value="">Selecione…</option>
            ${S.classes.map(c =>
              `<option value="${c.id}" ${av?.class_id == c.id ? 'selected' : ''}>${E(c.name)}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Período *</label>
          <select id="av-period2" class="form-control" ${isEdit ? 'disabled' : ''}>
            <option value="">Selecione…</option>
            ${perOpts}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Disciplina *</label>
          <input id="av-subj" class="form-control" value="${E(av?.subject ?? '')}">
        </div>
        <div class="form-group">
          <label>Nome da avaliação *</label>
          <input id="av-name" class="form-control" value="${E(av?.name ?? '')}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Tipo</label>
          <select id="av-type" class="form-control">
            ${['prova','trabalho','atividade','simulado','outro'].map(t =>
              `<option value="${t}" ${av?.type === t ? 'selected' : ''}>
                ${t.charAt(0).toUpperCase() + t.slice(1)}
              </option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Nota máxima</label>
          <input id="av-max" class="form-control" type="number" step="0.1" min="1"
            value="${av?.max_score ?? 10}">
        </div>
        <div class="form-group">
          <label>Peso</label>
          <input id="av-weight" class="form-control" type="number" step="0.1" min="0.1"
            value="${av?.weight ?? 1}">
        </div>
        <div class="form-group">
          <label>Data</label>
          <input id="av-date" class="form-control" type="date" value="${av?.date ?? ''}">
        </div>
      </div>
      <div id="av-err" class="error-msg" style="display:none"></div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="saveAvaliacao(${isEdit ? av.id : 'null'})">Salvar</button>
        <button class="btn btn-ghost"   onclick="closeModal()">Cancelar</button>
      </div>
    </div>`);
}

async function saveAvaliacao(id) {
  const body = {
    school_id:  S.schoolId,
    class_id:   q('#av-class2')?.value,
    period_id:  q('#av-period2')?.value,
    subject:    q('#av-subj')?.value.trim(),
    name:       q('#av-name')?.value.trim(),
    type:       q('#av-type')?.value,
    max_score:  Number(q('#av-max')?.value),
    weight:     Number(q('#av-weight')?.value),
    date:       q('#av-date')?.value || null,
  };

  const errEl = q('#av-err');
  if (!body.subject || !body.name || !body.class_id || !body.period_id) {
    errEl.textContent = 'Turma, período, disciplina e nome são obrigatórios.';
    errEl.style.display = 'block'; return;
  }

  const d = id === null
    ? await api('/escolar/assessments', { method:'POST', body })
    : await api(`/escolar/assessments/${id}`, { method:'PUT', body });

  if (!d.success) { errEl.textContent = d.error ?? 'Erro.'; errEl.style.display = 'block'; return; }

  closeModal();
  loadAvaliacoes();
}

async function deleteAvaliacao(id) {
  if (!confirm('Excluir avaliação? As notas vinculadas serão removidas.')) return;
  await api(`/escolar/assessments/${id}`, { method:'DELETE' });
  loadAvaliacoes();
}

// ── Globals ──────────────────────────────────────────────────────────────────
window.loadAvaliacoes  = loadAvaliacoes;
window.modalAvaliacao  = modalAvaliacao;
window.saveAvaliacao   = saveAvaliacao;
window.deleteAvaliacao = deleteAvaliacao;
