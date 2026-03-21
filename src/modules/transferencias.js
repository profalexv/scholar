/**
 * módulo: transferencias.js
 * Move um aluno de uma turma para outra, registrando no histórico.
 */

import { S }     from '../state.js';
import { api }   from '../api.js';
import { E, fmtD, q } from '../utils.js';

// ── Render ───────────────────────────────────────────────────────────────────

export function render(main) {
  const today = new Date().toISOString().slice(0, 10);

  main.innerHTML = `
    <div class="page-title">Transferências</div>
    <div class="page-sub">Mova um aluno de turma e registre o histórico</div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start">

      <!-- Formulário de nova transferência -->
      <div class="card">
        <div class="section-title" style="margin-bottom:16px">Nova Transferência</div>
        <div class="form-row">
          <div class="form-group">
            <label>Aluno *</label>
            <select id="tr-student" class="form-control" onchange="loadTrFromClass()">
              <option value="">Selecione…</option>
            </select>
          </div>
          <div class="form-group">
            <label>Turma de origem *</label>
            <select id="tr-from" class="form-control">
              <option value="">—</option>
              ${S.classes.map(c => `<option value="${c.id}">${E(c.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Turma de destino *</label>
            <select id="tr-to" class="form-control">
              <option value="">Selecione…</option>
              ${S.classes.map(c => `<option value="${c.id}">${E(c.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Data</label>
            <input id="tr-date" class="form-control" type="date" value="${today}">
          </div>
        </div>
        <div class="form-group" style="margin-bottom:14px">
          <label>Motivo (opcional)</label>
          <input id="tr-reason" class="form-control" placeholder="Ex: troca de turno">
        </div>
        <div id="tr-err" class="error-msg" style="display:none"></div>
        <div class="form-actions">
          <button class="btn btn-primary" onclick="saveTransfer()">Transferir aluno</button>
        </div>
      </div>

      <!-- Histórico recente -->
      <div class="card">
        <div class="section-title" style="margin-bottom:14px">Histórico recente</div>
        <div id="tr-history"><div class="loading">Carregando…</div></div>
      </div>

    </div>`;

  // Carrega alunos e histórico em paralelo
  Promise.all([_loadStudents(), _loadHistory()]);
}

// ── Auxiliares ───────────────────────────────────────────────────────────────

async function _loadStudents() {
  const sel = q('#tr-student');
  if (!sel) return;
  const students = await api(`/escolar/students?schoolId=${S.schoolId}`)
    .then(d => d.data ?? d ?? []).catch(() => []);
  students.filter(s => s.active).forEach(s => {
    const o = document.createElement('option');
    o.value = s.id; o.textContent = s.name; sel.appendChild(o);
  });
}

async function _loadHistory() {
  const hist = q('#tr-history');
  if (!hist) return;
  const rows = await api(`/escolar/transfers?schoolId=${S.schoolId}&limit=20`)
    .then(d => d.data ?? d ?? []).catch(() => []);
  if (!rows.length) { hist.innerHTML = '<div class="empty" style="padding:12px">Nenhuma transferência registrada.</div>'; return; }
  hist.innerHTML = `
    <div class="tbl-wrap">
      <table>
        <thead><tr><th>Aluno</th><th>De</th><th>Para</th><th>Data</th></tr></thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${E(r.student_name ?? '—')}</td>
              <td style="font-size:12px">${E(r.from_class_name ?? '—')}</td>
              <td style="font-size:12px">${E(r.to_class_name ?? '—')}</td>
              <td>${fmtD(r.transfer_date)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

async function loadTrFromClass() {
  // Seleciona automaticamente a primeira turma do aluno
  const studentId = q('#tr-student')?.value;
  if (!studentId) return;
  const enrolled = await api(`/escolar/students?schoolId=${S.schoolId}&studentId=${studentId}`)
    .then(d => d.data ?? d ?? []).catch(() => []);
  // Se retornar uma lista de turmas para o aluno, pré-seleciona
  if (enrolled[0]?.class_id) {
    const sel = q('#tr-from');
    if (sel) sel.value = String(enrolled[0].class_id);
  }
}

async function saveTransfer() {
  const body = {
    school_id:      S.schoolId,
    student_id:     q('#tr-student')?.value,
    from_class_id:  q('#tr-from')?.value,
    to_class_id:    q('#tr-to')?.value,
    transfer_date:  q('#tr-date')?.value,
    reason:         q('#tr-reason')?.value?.trim() || null,
  };
  const errEl = q('#tr-err');
  errEl.style.display = 'none';

  if (!body.student_id || !body.from_class_id || !body.to_class_id) {
    errEl.textContent = 'Selecione aluno, turma de origem e turma de destino.';
    errEl.style.display = 'block'; return;
  }
  if (body.from_class_id === body.to_class_id) {
    errEl.textContent = 'As turmas de origem e destino devem ser diferentes.';
    errEl.style.display = 'block'; return;
  }

  const d = await api('/escolar/transfers', { method:'POST', body });
  if (d.success !== false) {
    alert('✅ Transferência realizada com sucesso!');
    window.goTo('transferencias', document.querySelector('[data-view=transferencias]'));
  } else {
    errEl.textContent = d.error ?? 'Erro ao realizar transferência.';
    errEl.style.display = 'block';
  }
}

// ── Globals ──────────────────────────────────────────────────────────────────
window.loadTrFromClass = loadTrFromClass;
window.saveTransfer    = saveTransfer;
