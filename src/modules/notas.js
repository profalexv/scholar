/**
 * módulo: notas.js
 * Lançamento de notas: grade editável estudantes × avaliações com bulk save.
 */

import { S }       from '../state.js';
import { api }     from '../api.js';
import { E, q, $$ } from '../utils.js';

// ── Render ───────────────────────────────────────────────────────────────────

export async function render(main) {
  const year = new Date().getFullYear();

  main.innerHTML = `
    <div class="page-title">Lançamento de Notas</div>
    <div class="page-sub">Grade editável por turma e período — salva em lote</div>

    <div class="toolbar">
      <select id="nt-class" class="form-control" style="width:220px">
        <option value="">Selecione a turma…</option>
        ${S.classes.map(c => `<option value="${c.id}">${E(c.name)}</option>`).join('')}
      </select>
      <select id="nt-period" class="form-control" style="width:240px">
        <option value="">Selecione o período…</option>
      </select>
      <button class="btn btn-primary" onclick="loadNotas()">Carregar</button>
    </div>

    <div id="nt-body">
      <div class="empty">Selecione turma e período para visualizar/lançar notas.</div>
    </div>`;

  // Popula períodos
  const periods = await api(`/escolar/periods?schoolId=${S.schoolId}&year=${year}`)
    .then(d => d.data ?? d ?? []).catch(() => []);

  const ps = q('#nt-period');
  periods.forEach(p => {
    const o = document.createElement('option');
    o.value = p.id; o.textContent = p.name; ps.appendChild(o);
  });
}

// ── Carregar grade ────────────────────────────────────────────────────────────

async function loadNotas() {
  const classId  = q('#nt-class')?.value;
  const periodId = q('#nt-period')?.value;
  const nb       = q('#nt-body');
  if (!nb) return;

  if (!classId || !periodId) {
    nb.innerHTML = '<div class="error-msg">Selecione turma e período.</div>';
    return;
  }

  nb.innerHTML = '<div class="loading">Carregando…</div>';

  const data = await api(`/escolar/grades?schoolId=${S.schoolId}&classId=${classId}&periodId=${periodId}`)
    .then(d => d.data ?? d).catch(() => null);

  if (!data) { nb.innerHTML = '<div class="error-msg">Erro ao carregar notas.</div>'; return; }

  const { assessments = [], students = [], gradeMap = {} } = data;

  if (!assessments.length) {
    nb.innerHTML = `<div class="empty">
      Nenhuma avaliação cadastrada para este período.
      <a href="#" onclick="window.goTo('avaliacoes', document.querySelector('[data-view=avaliacoes]'))">Criar avaliações →</a>
    </div>`;
    return;
  }

  if (!students.length) {
    nb.innerHTML = '<div class="empty">Nenhum aluno matriculado nesta turma.</div>';
    return;
  }

  // Agrupa avaliações por disciplina para cabeçalho organizado
  const subjects = [...new Set(assessments.map(a => a.subject))].sort();

  nb.innerHTML = `
    <div class="card">
      <div class="section-header">
        <span class="section-title">
          ${E(S.classes.find(c => c.id == classId)?.name ?? '')} —
          ${E(q('#nt-period option:checked')?.textContent ?? '')}
        </span>
        <button class="btn btn-primary" onclick="saveNotasBulk('${classId}','${periodId}')">
          💾 Salvar tudo
        </button>
      </div>

      <div class="tbl-wrap">
        <table id="notas-table">
          <thead>
            <tr>
              <th style="min-width:180px">Aluno</th>
              ${subjects.flatMap(subj => {
                const subjA = assessments.filter(a => a.subject === subj);
                return subjA.map(a => `
                  <th style="text-align:center;min-width:90px;font-size:11px">
                    ${E(a.name)}<br>
                    <span style="font-weight:400;color:var(--text-secondary)">
                      ${E(subj)} · máx ${a.max_score}
                    </span>
                  </th>`);
              }).join('')}
            </tr>
          </thead>
          <tbody>
            ${students.map(student => `
              <tr>
                <td>
                  <strong>${E(student.name)}</strong>
                  ${student.registration
                    ? `<br><small style="color:var(--text-secondary)">${E(student.registration)}</small>`
                    : ''}
                </td>
                ${subjects.flatMap(subj => {
                  const subjA = assessments.filter(a => a.subject === subj);
                  return subjA.map(a => {
                    const g   = gradeMap[student.id]?.[a.id];
                    const val = g?.score ?? '';
                    return `<td class="grade-cell">
                      <input type="number" min="0" max="${a.max_score}" step="0.1"
                        value="${val}" placeholder="—"
                        data-student="${student.id}"
                        data-assessment="${a.id}"
                        data-class="${classId}"
                        data-period="${periodId}">
                    </td>`;
                  });
                }).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

// ── Salvar notas ─────────────────────────────────────────────────────────────

async function saveNotasBulk(classId, periodId) {
  const inputs = $$('#notas-table input[data-student]');

  const grades = inputs
    .filter(inp => inp.value !== '')
    .map(inp => ({
      student_id:    Number(inp.dataset.student),
      assessment_id: Number(inp.dataset.assessment),
      class_id:      Number(inp.dataset.class),
      period_id:     Number(inp.dataset.period),
      score:         Number(inp.value),
      absent:        false,
    }));

  if (!grades.length) { alert('Nenhuma nota para salvar.'); return; }

  const d = await api('/escolar/grades/bulk', {
    method: 'POST',
    body:   { school_id: S.schoolId, grades },
  });

  if (d.success !== false) alert(`✅ ${d.data?.saved ?? grades.length} notas salvas!`);
  else alert('Erro: ' + (d.error ?? 'desconhecido'));
}

// ── Globals ──────────────────────────────────────────────────────────────────
window.loadNotas      = loadNotas;
window.saveNotasBulk  = saveNotasBulk;
