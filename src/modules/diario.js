/**
 * módulo: diario.js
 * View do diário do professor — histórico de chamadas e conteúdos.
 */

import { S }       from '../state.js';
import { api }     from '../api.js';
import { E, fmtD, q } from '../utils.js';

// ── Render ───────────────────────────────────────────────────────────────────

export function render(main) {
  main.innerHTML = `
    <div class="page-title">Diário do Professor</div>
    <div class="page-sub">Histórico de presenças e conteúdos por turma</div>

    <div class="toolbar">
      <select id="di-class" class="form-control" style="width:220px" onchange="loadDiario()">
        <option value="">Todas as turmas</option>
        ${S.classes.map(c => `<option value="${c.id}">${E(c.name)}</option>`).join('')}
      </select>

      <div class="form-group" style="margin-bottom:0">
        <input id="di-from" class="form-control" type="date" onchange="loadDiario()"
          placeholder="De" style="width:148px">
      </div>
      <div class="form-group" style="margin-bottom:0">
        <input id="di-to" class="form-control" type="date" onchange="loadDiario()"
          placeholder="Até" style="width:148px">
      </div>
    </div>

    <div id="di-body"><div class="loading">Carregando…</div></div>`;

  loadDiario();
}

// ── Ações ────────────────────────────────────────────────────────────────────

async function loadDiario() {
  const classId = q('#di-class')?.value ?? '';
  const from    = q('#di-from')?.value  ?? '';
  const to      = q('#di-to')?.value    ?? '';
  const body    = q('#di-body');
  if (!body) return;

  body.innerHTML = '<div class="loading">Carregando…</div>';

  let qs = `?schoolId=${S.schoolId}`;
  if (classId) qs += `&classId=${classId}`;
  if (from)    qs += `&from=${from}`;
  if (to)      qs += `&to=${to}`;

  const rows = await api(`/escolar/attendance${qs}`)
    .then(d => d.data ?? d ?? []).catch(() => []);

  if (!rows.length) {
    body.innerHTML = '<div class="empty">Nenhum registro encontrado.</div>';
    return;
  }

  body.innerHTML = `
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Turma</th>
            <th>Tempo</th>
            <th>Assunto</th>
            <th style="text-align:center">Total</th>
            <th style="text-align:center">Ausentes</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${fmtD(r.date)}</td>
              <td>${E(r.class_name ?? '—')}</td>
              <td>${E(r.period)}º tempo</td>
              <td>${E(r.subject ?? '—')}</td>
              <td style="text-align:center">${E(r.total_students ?? '—')}</td>
              <td style="text-align:center">
                <span class="badge badge-danger">${E(r.absences ?? 0)}</span>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── Globals ──────────────────────────────────────────────────────────────────
window.loadDiario = loadDiario;
