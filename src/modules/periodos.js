/**
 * módulo: periodos.js
 * CRUD de períodos letivos (bimestre/trimestre/semestre/módulo).
 * Inclui criação automática a partir de modelo.
 */

import { S }           from '../state.js';
import { api }         from '../api.js';
import { E, fmtD, q }  from '../utils.js';
import { periodTag, statusBadge } from '../utils.js';
import { showModal }   from '../modal.js';

// ── Render ───────────────────────────────────────────────────────────────────

export function render(main) {
  const year = new Date().getFullYear();

  main.innerHTML = `
    <div class="page-title">Períodos Letivos</div>
    <div class="page-sub">Configure a periodicidade do ano letivo (bimestral, trimestral…)</div>

    <div class="toolbar">
      <select id="per-year" class="form-control" style="width:120px" onchange="loadPeriodos()">
        ${[year - 1, year, year + 1].map(y =>
          `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`
        ).join('')}
      </select>
      <div class="toolbar-right">
        <button class="btn btn-ghost"    onclick="modalPeriodTemplate()">📋 Criar do modelo</button>
        <button class="btn btn-primary"  onclick="modalPeriodo(null)">+ Novo período</button>
      </div>
    </div>

    <div id="per-body"><div class="loading">Carregando…</div></div>`;

  loadPeriodos();
}

// ── Listar ───────────────────────────────────────────────────────────────────

async function loadPeriodos() {
  const year = Number(q('#per-year')?.value) || new Date().getFullYear();
  const body = q('#per-body');
  if (!body) return;

  body.innerHTML = '<div class="loading">Carregando…</div>';
  const rows = await api(`/escolar/periods?schoolId=${S.schoolId}&year=${year}`)
    .then(d => d.data ?? d ?? []).catch(() => []);

  if (!rows.length) {
    body.innerHTML = `
      <div class="empty">
        Nenhum período configurado para ${year}.<br>
        <a href="#" onclick="modalPeriodTemplate()">Criar automaticamente →</a>
      </div>`;
    return;
  }

  body.innerHTML = `
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>Nome</th><th>Tipo</th><th style="text-align:center">Seq.</th>
            <th>Início</th><th>Fim</th><th>Fórmula</th><th>Status</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td><strong>${E(r.name)}</strong></td>
              <td>${periodTag(r.type)}</td>
              <td style="text-align:center">${E(r.sequence)}</td>
              <td>${fmtD(r.start_date)}</td>
              <td>${fmtD(r.end_date)}</td>
              <td><span class="badge badge-gray">${r.formula === 'weighted' ? 'Ponderada' : 'Aritmética'}</span></td>
              <td>${statusBadge(r.active ? 'ativo' : 'inactive')}</td>
              <td style="white-space:nowrap">
                <button class="btn btn-ghost btn-sm"
                  onclick="modalPeriodo(${JSON.stringify(r).replace(/"/g,'&quot;')})">
                  Editar
                </button>
                <button class="btn btn-danger btn-sm" onclick="deletePeriodo(${r.id})">✗</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── Modal: criar do modelo ────────────────────────────────────────────────────

function modalPeriodTemplate() {
  showModal(`
    <div class="modal">
      <div class="modal-title">Criar períodos automaticamente</div>
      <div class="form-row">
        <div class="form-group">
          <label>Ano letivo</label>
          <input id="pt-year" class="form-control" type="number" value="${new Date().getFullYear()}">
        </div>
        <div class="form-group">
          <label>Periodicidade</label>
          <select id="pt-type" class="form-control">
            <option value="bimestre">Bimestral (4 períodos)</option>
            <option value="trimestre">Trimestral (3 períodos)</option>
            <option value="semestre">Semestral (2 períodos)</option>
            <option value="modulo">Módulos (4 módulos)</option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:14px">
        <label>Fórmula padrão de média</label>
        <select id="pt-formula" class="form-control">
          <option value="arithmetic">Aritmética — soma ÷ quantidade</option>
          <option value="weighted">Ponderada — soma(score × peso) ÷ soma(pesos)</option>
        </select>
      </div>
      <div id="pt-err" class="error-msg" style="display:none"></div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="createPeriodTemplate()">Criar períodos</button>
        <button class="btn btn-ghost"   onclick="closeModal()">Cancelar</button>
      </div>
    </div>`);
}

async function createPeriodTemplate() {
  const year    = Number(q('#pt-year')?.value);
  const type    = q('#pt-type')?.value;
  const formula = q('#pt-formula')?.value;

  const counts  = { bimestre:4, trimestre:3, semestre:2, modulo:4 };
  const spans   = { bimestre:3, trimestre:4, semestre:6, modulo:3 };
  const suffixes = { bimestre:'º Bimestre', trimestre:'º Trimestre', semestre:'º Semestre', modulo:'º Módulo' };

  const n      = counts[type];
  const span   = spans[type];
  const suffix = suffixes[type];

  for (let i = 0; i < n; i++) {
    const startM = i * span + 1;
    const endM   = Math.min((i + 1) * span, 12);
    const start  = `${year}-${String(startM).padStart(2, '0')}-01`;
    const lastDay = new Date(year, endM, 0).getDate();
    const end    = `${year}-${String(endM).padStart(2, '0')}-${lastDay}`;

    await api('/escolar/periods', {
      method: 'POST',
      body: {
        school_id: S.schoolId,
        name:      `${i + 1}${suffix} ${year}`,
        type,
        year,
        sequence:   i + 1,
        start_date: start,
        end_date:   end,
        formula,
      },
    }).catch(() => {});
  }

  closeModal();
  window.goTo('periodos', document.querySelector('[data-view=periodos]'));
}

// ── Modal: criar/editar período ──────────────────────────────────────────────

function modalPeriodo(per) {
  const isEdit = !!per?.id;
  const year   = Number(q('#per-year')?.value) || new Date().getFullYear();

  showModal(`
    <div class="modal">
      <div class="modal-title">${isEdit ? 'Editar' : 'Novo'} Período Letivo</div>
      <div class="form-row">
        <div class="form-group">
          <label>Nome *</label>
          <input id="pp-name" class="form-control" value="${E(per?.name ?? '')}">
        </div>
        <div class="form-group">
          <label>Tipo</label>
          <select id="pp-type" class="form-control" ${isEdit ? 'disabled' : ''}>
            ${['bimestre','trimestre','semestre','modulo'].map(t =>
              `<option value="${t}" ${per?.type === t ? 'selected' : ''}>
                ${t.charAt(0).toUpperCase() + t.slice(1)}
              </option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Ano</label>
          <input id="pp-year" class="form-control" type="number"
            value="${per?.year ?? year}" ${isEdit ? 'disabled' : ''}>
        </div>
        <div class="form-group">
          <label>Sequência</label>
          <input id="pp-seq" class="form-control" type="number" min="1"
            value="${per?.sequence ?? 1}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Data início</label>
          <input id="pp-start" class="form-control" type="date" value="${per?.start_date ?? ''}">
        </div>
        <div class="form-group">
          <label>Data fim</label>
          <input id="pp-end" class="form-control" type="date" value="${per?.end_date ?? ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Fórmula de média</label>
          <select id="pp-formula" class="form-control">
            <option value="arithmetic" ${(!per?.formula || per?.formula === 'arithmetic') ? 'selected' : ''}>
              Aritmética
            </option>
            <option value="weighted" ${per?.formula === 'weighted' ? 'selected' : ''}>
              Ponderada
            </option>
          </select>
        </div>
        ${isEdit ? `
          <div class="form-group">
            <label>Situação</label>
            <select id="pp-active" class="form-control">
              <option value="1" ${per?.active ? 'selected' : ''}>Ativo</option>
              <option value="0" ${!per?.active ? 'selected' : ''}>Inativo</option>
            </select>
          </div>` : ''}
      </div>
      <div id="pp-err" class="error-msg" style="display:none"></div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="savePeriodo(${isEdit ? per.id : 'null'})">Salvar</button>
        <button class="btn btn-ghost"   onclick="closeModal()">Cancelar</button>
      </div>
    </div>`);
}

async function savePeriodo(id) {
  const body = {
    school_id:  S.schoolId,
    name:       q('#pp-name')?.value.trim(),
    type:       q('#pp-type')?.value,
    year:       Number(q('#pp-year')?.value || new Date().getFullYear()),
    sequence:   Number(q('#pp-seq')?.value) || 1,
    start_date: q('#pp-start')?.value,
    end_date:   q('#pp-end')?.value,
    formula:    q('#pp-formula')?.value,
  };
  if (id !== null) body.active = q('#pp-active')?.value === '1';

  if (!body.name) {
    q('#pp-err').textContent = 'Nome obrigatório.';
    q('#pp-err').style.display = 'block'; return;
  }

  const d = id === null
    ? await api('/escolar/periods', { method:'POST', body })
    : await api(`/escolar/periods/${id}`, { method:'PUT', body });

  if (!d.success) {
    q('#pp-err').textContent = d.error ?? 'Erro.';
    q('#pp-err').style.display = 'block'; return;
  }

  closeModal();
  loadPeriodos();
}

async function deletePeriodo(id) {
  if (!confirm('Excluir período? As avaliações vinculadas serão removidas.')) return;
  await api(`/escolar/periods/${id}`, { method:'DELETE' });
  loadPeriodos();
}

// ── Globals ──────────────────────────────────────────────────────────────────
window.loadPeriodos         = loadPeriodos;
window.modalPeriodTemplate  = modalPeriodTemplate;
window.createPeriodTemplate = createPeriodTemplate;
window.modalPeriodo         = modalPeriodo;
window.savePeriodo          = savePeriodo;
window.deletePeriodo        = deletePeriodo;
