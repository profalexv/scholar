/**
 * módulo: boletins.js
 * Relatório de desempenho por aluno: médias por período e disciplina.
 * Fórmula aplicada conforme configuração do período (aritmética ou ponderada).
 */

import { S }             from '../state.js';
import { api }           from '../api.js';
import { E, fmtD, q }   from '../utils.js';
import { avgClass }      from '../utils.js';

// ── Render ───────────────────────────────────────────────────────────────────

export function render(main) {
  const year = new Date().getFullYear();

  main.innerHTML = `
    <div class="page-title">Boletins</div>
    <div class="page-sub">Relatório completo de desempenho por aluno, período e disciplina</div>

    <div class="toolbar">
      <select id="bl-class" class="form-control" style="width:220px">
        <option value="">Selecione a turma…</option>
        ${S.classes.map(c => `<option value="${c.id}">${E(c.name)}</option>`).join('')}
      </select>
      <select id="bl-year" class="form-control" style="width:100px">
        ${[year - 1, year].map(y =>
          `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`
        ).join('')}
      </select>
      <button class="btn btn-primary" onclick="loadBoletins()">Gerar boletins</button>
      <button class="btn btn-ghost"   onclick="printBoletins()">🖨 Imprimir</button>
    </div>

    <div id="bl-body">
      <div class="empty">Selecione turma e ano para gerar os boletins.</div>
    </div>`;
}

// ── Carregar ─────────────────────────────────────────────────────────────────

async function loadBoletins() {
  const classId = q('#bl-class')?.value;
  const year    = q('#bl-year')?.value  ?? new Date().getFullYear();
  const bb      = q('#bl-body');

  if (!classId) { bb.innerHTML = '<div class="error-msg">Selecione uma turma.</div>'; return; }

  bb.innerHTML = '<div class="loading">Gerando boletins…</div>';

  const data = await api(
    `/escolar/report-cards?schoolId=${S.schoolId}&classId=${classId}&year=${year}`
  ).then(d => d.data ?? d).catch(() => null);

  if (!data) { bb.innerHTML = '<div class="error-msg">Erro ao gerar boletins.</div>'; return; }

  const { reportCards = [], subjects = [] } = data;

  if (!reportCards.length) {
    bb.innerHTML = '<div class="empty">Nenhum dado encontrado. Verifique se há notas lançadas para este ano.</div>';
    return;
  }

  // Lista de períodos a partir do primeiro aluno
  const periodList = reportCards[0]?.periods ?? [];

  bb.innerHTML = `<div id="boletins-print">` +
    reportCards.map(student => _renderStudentBoletim(student, periodList, subjects)).join('') +
  `</div>`;
}

function _renderStudentBoletim(student, periodList, subjects) {
  const absRate = student.total_classes > 0
    ? Math.round((student.absences / student.total_classes) * 100)
    : 0;
  const absColor = absRate >= 25 ? 'var(--danger)' : absRate >= 15 ? 'var(--warning)' : 'var(--success)';

  return `
    <div class="card" style="margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
        <div>
          <div style="font-size:17px;font-weight:700">${E(student.student_name)}</div>
          ${student.student_registration
            ? `<div style="font-size:12px;color:var(--text-secondary)">
                Matrícula: ${E(student.student_registration)}
               </div>` : ''}
        </div>
        <div style="text-align:right;font-size:13px">
          <div>Faltas: <strong style="color:${absColor}">${student.absences}</strong>
            de ${student.total_classes} aulas</div>
          <div style="color:var(--text-secondary)">(${absRate}% de ausência)</div>
        </div>
      </div>

      <div class="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th style="min-width:140px">Disciplina</th>
              ${periodList.map(p => `<th style="text-align:center">${E(p.period_name)}</th>`).join('')}
              <th style="text-align:center">Média Final</th>
              <th style="text-align:center">Situação</th>
            </tr>
          </thead>
          <tbody>
            ${subjects.map(subj => {
              const periodAvgs = periodList.map(p => {
                const pData = student.periods?.find(pd => pd.period_id === p.period_id);
                const sData = pData?.subjects?.find(s => s.subject === subj);
                return sData?.average ?? null;
              });
              const validAvgs  = periodAvgs.filter(v => v !== null);
              const finalAvg   = validAvgs.length
                ? Math.round(validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length * 100) / 100
                : null;
              const situation  = finalAvg === null ? '—'
                : finalAvg >= 7 ? '<span class="badge badge-success">Aprovado</span>'
                : finalAvg >= 5 ? '<span class="badge badge-warning">Recuperação</span>'
                : '<span class="badge badge-danger">Reprovado</span>';

              return `
                <tr>
                  <td><strong>${E(subj)}</strong></td>
                  ${periodAvgs.map(v => `
                    <td class="avg-cell ${avgClass(v)}">${v !== null ? v : '—'}</td>
                  `).join('')}
                  <td class="avg-cell ${avgClass(finalAvg)}" style="font-size:16px">
                    ${finalAvg !== null ? finalAvg : '—'}
                  </td>
                  <td style="text-align:center">${situation}</td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function printBoletins() {
  window.print();
}

// ── Globals ──────────────────────────────────────────────────────────────────
window.loadBoletins  = loadBoletins;
window.printBoletins = printBoletins;
