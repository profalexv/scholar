/**
 * módulo: ocorrencias.js
 * CRUD de ocorrências disciplinares/pedagógicas por aluno, turma ou professor.
 */

import { S }           from '../state.js';
import { api }         from '../api.js';
import { E, fmtD, q }  from '../utils.js';
import { statusBadge } from '../utils.js';
import { showModal }   from '../modal.js';

const SEV_BADGE = { baixa:'badge-success', media:'badge-warning', alta:'badge-danger' };
const SEV_LABEL = { baixa:'Baixa', media:'Média', alta:'Alta' };

// ── Render ───────────────────────────────────────────────────────────────────

export function render(main) {
  main.innerHTML = `
    <div class="page-title">Ocorrências</div>
    <div class="page-sub">Incidentes por aluno, turma ou professor</div>

    <div class="toolbar">
      <select id="oc-status" class="form-control" style="width:160px" onchange="loadOcorrencias()">
        <option value="">Todas</option>
        <option value="aberta">Abertas</option>
        <option value="resolvida">Resolvidas</option>
      </select>
      <select id="oc-sev-filter" class="form-control" style="width:160px" onchange="loadOcorrencias()">
        <option value="">Qualquer gravidade</option>
        <option value="baixa">Baixa</option>
        <option value="media">Média</option>
        <option value="alta">Alta</option>
      </select>
      <div class="toolbar-right">
        <button class="btn btn-primary" onclick="modalOcorrencia()">+ Nova ocorrência</button>
      </div>
    </div>

    <div id="oc-body"><div class="loading">Carregando…</div></div>`;

  loadOcorrencias();
}

// ── Listar ───────────────────────────────────────────────────────────────────

async function loadOcorrencias() {
  const status = q('#oc-status')?.value    ?? '';
  const sev    = q('#oc-sev-filter')?.value ?? '';
  const body   = q('#oc-body');
  if (!body) return;

  body.innerHTML = '<div class="loading">Carregando…</div>';

  let qs = `?schoolId=${S.schoolId}`;
  if (status) qs += `&status=${status}`;
  if (sev)    qs += `&severity=${sev}`;

  const rows = await api(`/escolar/occurrences${qs}`)
    .then(d => d.data ?? d ?? []).catch(() => []);

  if (!rows.length) {
    body.innerHTML = '<div class="empty">Nenhuma ocorrência encontrada.</div>';
    return;
  }

  body.innerHTML = `
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>Título</th><th>Tipo</th><th>Referência</th>
            <th>Gravidade</th><th>Status</th><th>Data</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td><strong>${E(r.title)}</strong>
                ${r.description ? `<br><small style="color:var(--text-secondary)">${E(r.description.slice(0,80))}…</small>` : ''}
              </td>
              <td>${E(r.type)}</td>
              <td>${E(r.student_name ?? r.class_name ?? r.teacher_name ?? '—')}</td>
              <td><span class="badge ${SEV_BADGE[r.severity] ?? 'badge-gray'}">${SEV_LABEL[r.severity] ?? E(r.severity)}</span></td>
              <td>${statusBadge(r.status)}</td>
              <td>${fmtD(r.created_at?.slice(0,10))}</td>
              <td style="white-space:nowrap">
                ${r.status === 'aberta' ? `<button class="btn btn-success btn-sm" onclick="resolveOcorrencia(${r.id})">✓ Resolver</button>` : ''}
                <button class="btn btn-danger btn-sm" onclick="deleteOcorrencia(${r.id})">✗</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── Criar ────────────────────────────────────────────────────────────────────

async function modalOcorrencia() {
  showModal(`
    <div class="modal">
      <div class="modal-title">Nova Ocorrência</div>
      <div class="form-row">
        <div class="form-group">
          <label>Tipo</label>
          <select id="oc-type" class="form-control" onchange="updateOcRef()">
            <option value="student">Aluno</option>
            <option value="class">Turma</option>
            <option value="teacher">Professor</option>
          </select>
        </div>
        <div class="form-group">
          <label>Gravidade</label>
          <select id="oc-sev" class="form-control">
            <option value="baixa">Baixa</option>
            <option value="media" selected>Média</option>
            <option value="alta">Alta</option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:12px">
        <label id="oc-ref-label">Aluno</label>
        <select id="oc-ref" class="form-control">
          <option value="">Selecione…</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom:12px">
        <label>Título *</label>
        <input id="oc-title" class="form-control" placeholder="Resumo da ocorrência">
      </div>
      <div class="form-group" style="margin-bottom:14px">
        <label>Descrição</label>
        <textarea id="oc-desc" class="form-control" rows="3"></textarea>
      </div>
      <div id="oc-err" class="error-msg" style="display:none"></div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="saveOcorrencia()">Salvar</button>
        <button class="btn btn-ghost"   onclick="closeModal()">Cancelar</button>
      </div>
    </div>`);

  updateOcRef();
}

async function updateOcRef() {
  const type = q('#oc-type')?.value ?? 'student';
  const lbl  = q('#oc-ref-label');
  const sel  = q('#oc-ref');
  if (!lbl || !sel) return;

  const labels = { student:'Aluno', class:'Turma', teacher:'Professor' };
  lbl.textContent = labels[type] ?? type;

  let items = [];
  if (type === 'student') {
    items = await api(`/escolar/students?schoolId=${S.schoolId}`)
      .then(d => d.data ?? d ?? []).catch(() => []);
  } else if (type === 'class') {
    items = S.classes;
  } else if (type === 'teacher') {
    items = S.teachers;
  }

  sel.innerHTML = `<option value="">Selecione…</option>
    ${items.map(i => `<option value="${i.id}">${E(i.name)}</option>`).join('')}`;
}

async function saveOcorrencia() {
  const type  = q('#oc-type')?.value;
  const title = q('#oc-title')?.value.trim();
  const refId = q('#oc-ref')?.value;
  const sev   = q('#oc-sev')?.value;
  const desc  = q('#oc-desc')?.value.trim();
  const errEl = q('#oc-err');

  if (!title) { errEl.textContent = 'Título obrigatório.'; errEl.style.display = 'block'; return; }

  const body = { school_id: S.schoolId, type, title, description: desc, severity: sev };
  if (type === 'student') body.student_id = refId;
  if (type === 'class')   body.class_id   = refId;
  if (type === 'teacher') body.teacher_id = refId;

  const d = await api('/escolar/occurrences', { method:'POST', body });
  if (!d.success) { errEl.textContent = d.error ?? 'Erro.'; errEl.style.display = 'block'; return; }

  closeModal();
  loadOcorrencias();
}

async function resolveOcorrencia(id) {
  if (!confirm('Marcar como resolvida?')) return;
  await api(`/escolar/occurrences/${id}`, { method:'PUT', body:{ status:'resolvida' } });
  loadOcorrencias();
}

async function deleteOcorrencia(id) {
  if (!confirm('Excluir ocorrência permanentemente?')) return;
  await api(`/escolar/occurrences/${id}`, { method:'DELETE' });
  loadOcorrencias();
}

// ── Globals ──────────────────────────────────────────────────────────────────
window.loadOcorrencias   = loadOcorrencias;
window.modalOcorrencia   = modalOcorrencia;
window.updateOcRef       = updateOcRef;
window.saveOcorrencia    = saveOcorrencia;
window.resolveOcorrencia = resolveOcorrencia;
window.deleteOcorrencia  = deleteOcorrencia;
