/**
 * módulo: alunos.js
 * CRUD completo de alunos da escola.
 */

import { S }           from '../state.js';
import { api }         from '../api.js';
import { E, q }        from '../utils.js';
import { statusBadge } from '../utils.js';
import { showModal }   from '../modal.js';

// Estado local
let _cache = [];

// ── Render ───────────────────────────────────────────────────────────────────

export function render(main) {
  main.innerHTML = `
    <div class="page-title">Alunos</div>
    <div class="page-sub">Cadastro de alunos da escola</div>

    <div class="toolbar">
      <input id="al-search" class="form-control" style="max-width:300px"
        placeholder="🔍 Buscar por nome ou matrícula"
        oninput="filterAlunos()">
      <div class="toolbar-right">
        <button class="btn btn-primary" onclick="modalAluno(null)">+ Novo aluno</button>
      </div>
    </div>

    <div id="al-body"><div class="loading">Carregando…</div></div>`;

  loadAlunos();
}

// ── Listar ───────────────────────────────────────────────────────────────────

async function loadAlunos() {
  const body = q('#al-body');
  if (!body) return;

  body.innerHTML = '<div class="loading">Carregando…</div>';
  _cache = await api(`/escolar/students?schoolId=${S.schoolId}`)
    .then(d => d.data ?? d ?? []).catch(() => []);

  _renderTable(_cache);
}

function filterAlunos() {
  const term = (q('#al-search')?.value ?? '').toLowerCase();
  const filtered = term
    ? _cache.filter(a =>
        a.name?.toLowerCase().includes(term) ||
        a.registration?.toLowerCase().includes(term))
    : _cache;
  _renderTable(filtered);
}

function _renderTable(rows) {
  const body = q('#al-body');
  if (!body) return;

  if (!rows.length) {
    body.innerHTML = '<div class="empty">Nenhum aluno encontrado.</div>';
    return;
  }

  body.innerHTML = `
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>Nome</th><th>Matrícula</th><th>Responsável</th>
            <th>Contato</th><th>Status</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td><strong>${E(r.name)}</strong></td>
              <td>${E(r.registration ?? '—')}</td>
              <td>${E(r.parent_name ?? '—')}</td>
              <td style="font-size:12px">
                ${E(r.email ?? '')}
                ${r.phone ? `<br>${E(r.phone)}` : ''}
              </td>
              <td>${statusBadge(r.active ? 'ativo' : 'inactive')}</td>
              <td style="white-space:nowrap">
                <button class="btn btn-ghost btn-sm"
                  onclick="modalAluno(${JSON.stringify(r).replace(/"/g,'&quot;')})">
                  Editar
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteAluno(${r.id})">✗</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── Modal ────────────────────────────────────────────────────────────────────

function modalAluno(al) {
  const isEdit = !!al?.id;
  showModal(`
    <div class="modal">
      <div class="modal-title">${isEdit ? 'Editar' : 'Novo'} Aluno</div>
      <div class="form-row">
        <div class="form-group">
          <label>Nome completo *</label>
          <input id="al-name" class="form-control" value="${E(al?.name ?? '')}">
        </div>
        <div class="form-group">
          <label>Matrícula</label>
          <input id="al-reg" class="form-control" value="${E(al?.registration ?? '')}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>E-mail</label>
          <input id="al-email" class="form-control" type="email" value="${E(al?.email ?? '')}">
        </div>
        <div class="form-group">
          <label>Telefone</label>
          <input id="al-phone" class="form-control" value="${E(al?.phone ?? '')}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Nome do responsável</label>
          <input id="al-pname" class="form-control" value="${E(al?.parent_name ?? '')}">
        </div>
        <div class="form-group">
          <label>Telefone do responsável</label>
          <input id="al-pphone" class="form-control" value="${E(al?.parent_phone ?? '')}">
        </div>
      </div>
      ${isEdit ? `
        <div class="form-group" style="margin-bottom:14px">
          <label>Situação</label>
          <select id="al-active" class="form-control">
            <option value="1" ${al?.active ? 'selected' : ''}>Ativo</option>
            <option value="0" ${!al?.active ? 'selected' : ''}>Inativo</option>
          </select>
        </div>` : ''}
      <div id="al-err" class="error-msg" style="display:none"></div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="saveAluno(${isEdit ? al.id : 'null'})">Salvar</button>
        <button class="btn btn-ghost"   onclick="closeModal()">Cancelar</button>
      </div>
    </div>`);
}

async function saveAluno(id) {
  const body = {
    school_id:    S.schoolId,
    name:         q('#al-name')?.value.trim(),
    registration: q('#al-reg')?.value.trim()   || null,
    email:        q('#al-email')?.value.trim()  || null,
    phone:        q('#al-phone')?.value.trim()  || null,
    parent_name:  q('#al-pname')?.value.trim()  || null,
    parent_phone: q('#al-pphone')?.value.trim() || null,
  };
  if (id !== null) body.active = q('#al-active')?.value === '1';

  if (!body.name) {
    q('#al-err').textContent = 'Nome obrigatório.';
    q('#al-err').style.display = 'block';
    return;
  }

  const d = id === null
    ? await api('/escolar/students', { method:'POST', body })
    : await api(`/escolar/students/${id}`, { method:'PUT', body });

  if (!d.success) {
    q('#al-err').textContent = d.error ?? 'Erro.';
    q('#al-err').style.display = 'block';
    return;
  }

  closeModal();
  loadAlunos();
}

async function deleteAluno(id) {
  if (!confirm('Excluir aluno? As matrículas vinculadas também serão removidas.')) return;
  await api(`/escolar/students/${id}`, { method:'DELETE' });
  loadAlunos();
}

// ── Globals ──────────────────────────────────────────────────────────────────
window.loadAlunos   = loadAlunos;
window.filterAlunos = filterAlunos;
window.modalAluno   = modalAluno;
window.saveAluno    = saveAluno;
window.deleteAluno  = deleteAluno;
