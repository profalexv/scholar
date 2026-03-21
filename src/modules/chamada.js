/**
 * módulo: chamada.js
 * View de registro de presença diária por turma e período/tempo.
 */

import { S }        from '../state.js';
import { api }      from '../api.js';
import { E, fmtD, q } from '../utils.js';

// Estado local do módulo
let _students = [];

// ── Render ───────────────────────────────────────────────────────────────────

export function render(main) {
  const today = new Date().toISOString().slice(0, 10);

  main.innerHTML = `
    <div class="page-title">Chamada</div>
    <div class="page-sub">Registro de presença por turma e dia</div>

    <div class="card" style="max-width:760px">
      <div class="form-row">
        <div class="form-group">
          <label>Turma</label>
          <select id="ch-class" class="form-control">
            <option value="">Selecione…</option>
            ${S.classes.map(c => `<option value="${c.id}">${E(c.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Data</label>
          <input id="ch-date" class="form-control" type="date" value="${today}">
        </div>
        <div class="form-group">
          <label>Tempo / Período</label>
          <select id="ch-period" class="form-control">
            ${[1,2,3,4,5,6].map(n => `<option value="${n}">${n}º tempo</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="justify-content:flex-end">
          <label>&nbsp;</label>
          <button class="btn btn-primary" onclick="loadChamada()">Carregar turma</button>
        </div>
      </div>

      <div class="form-group" style="margin-bottom:12px">
        <label>Assunto da aula</label>
        <input id="ch-subject" class="form-control" placeholder="Conteúdo ministrado">
      </div>
      <div class="form-group">
        <label>Observações / Diário</label>
        <textarea id="ch-content" class="form-control" rows="2" placeholder="Observações gerais"></textarea>
      </div>
    </div>

    <div id="ch-grid" style="margin-top:20px"></div>`;
}

// ── Ações ────────────────────────────────────────────────────────────────────

async function loadChamada() {
  const classId  = q('#ch-class')?.value;
  const date     = q('#ch-date')?.value;
  const period   = q('#ch-period')?.value;
  const gridEl   = q('#ch-grid');

  if (!classId || !date) {
    gridEl.innerHTML = '<div class="error-msg">Selecione turma e data.</div>';
    return;
  }

  gridEl.innerHTML = '<div class="loading">Carregando alunos…</div>';

  const [students, existing] = await Promise.all([
    api(`/escolar/students?schoolId=${S.schoolId}&classId=${classId}`)
      .then(d => d.data ?? d ?? []).catch(() => []),
    api(`/escolar/attendance?schoolId=${S.schoolId}&classId=${classId}&date=${date}`)
      .then(d => d.data ?? d ?? []).catch(() => []),
  ]);

  if (!students.length) {
    gridEl.innerHTML = `<div class="empty">Nenhum aluno matriculado nesta turma.
      <a href="#" onclick="window.goTo('matriculas', document.querySelector('[data-view=matriculas]'))">Matricular alunos →</a>
    </div>`;
    return;
  }

  // Mapeia presenças já registradas para este período
  const record = existing.find(r => String(r.period) === String(period));
  const savedArr = Array.isArray(record?.students_json)
    ? record.students_json
    : JSON.parse(record?.students_json || '[]');
  const savedMap = Object.fromEntries(savedArr.map(s => [s.student_id, s]));

  _students = students.map(s => ({
    student_id: s.id,
    name:   s.name,
    status: savedMap[s.id]?.status ?? 'presente',
    note:   savedMap[s.id]?.note   ?? '',
  }));

  _renderGrid(gridEl);
}

function _renderGrid(gridEl) {
  const counts = _students.reduce((a, s) => { a[s.status] = (a[s.status] ?? 0) + 1; return a; }, {});

  gridEl.innerHTML = `
    <div class="card">
      <div class="section-header">
        <div>
          <span class="badge badge-success">${counts.presente ?? 0} presentes</span>
          <span class="badge badge-danger"  style="margin-left:6px">${counts.ausente ?? 0} ausentes</span>
          <span class="badge badge-warning" style="margin-left:6px">${counts.justificado ?? 0} justificados</span>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="setAllAtt('presente')">Todos presentes</button>
      </div>

      <div class="att-grid">
        ${_students.map((s, i) => `
          <div class="att-row">
            <div style="font-weight:500">${E(s.name)}</div>
            <div class="att-items">
              ${['presente','ausente','justificado'].map(st => `
                <button class="att-btn ${s.status === st ? st : ''}" onclick="setAtt(${i},'${st}')">
                  ${st.charAt(0).toUpperCase() + st.slice(1)}
                </button>`).join('')}
            </div>
          </div>`).join('')}
      </div>

      <div class="form-actions" style="margin-top:16px">
        <button class="btn btn-primary" onclick="saveChamada()">💾 Salvar chamada</button>
      </div>
    </div>`;
}

function setAllAtt(status) {
  _students.forEach(s => { s.status = status; });
  _renderGrid(q('#ch-grid'));
}

function setAtt(i, status) {
  if (_students[i]) _students[i].status = status;
  _renderGrid(q('#ch-grid'));
}

async function saveChamada() {
  const classId  = q('#ch-class')?.value;
  const date     = q('#ch-date')?.value;
  const period   = q('#ch-period')?.value;
  const subject  = q('#ch-subject')?.value?.trim() ?? '';
  const content  = q('#ch-content')?.value?.trim() ?? '';

  if (!classId || !date || !_students.length) {
    alert('Selecione turma, data e carregue os alunos primeiro.');
    return;
  }

  const d = await api('/escolar/attendance', {
    method: 'POST',
    body: {
      school_id:      S.schoolId,
      class_id:       classId,
      date,
      period,
      subject,
      lesson_content: content,
      students:       _students,
    },
  });

  if (d.success !== false) alert('✅ Chamada salva com sucesso!');
  else alert('Erro ao salvar: ' + (d.error ?? 'desconhecido'));
}

// ── Globals ──────────────────────────────────────────────────────────────────
window.loadChamada = loadChamada;
window.setAllAtt   = setAllAtt;
window.setAtt      = setAtt;
window.saveChamada = saveChamada;
