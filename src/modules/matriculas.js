/**
 * módulo: matriculas.js
 * Vincula/desvincula alunos de turmas (class_students).
 */

import { S }     from '../state.js';
import { api }   from '../api.js';
import { E, q }  from '../utils.js';

// ── Render ───────────────────────────────────────────────────────────────────

export function render(main) {
  main.innerHTML = `
    <div class="page-title">Matrículas</div>
    <div class="page-sub">Vincule alunos às turmas</div>

    <div class="toolbar">
      <select id="mt-class" class="form-control" style="width:240px" onchange="loadMatriculas()">
        <option value="">Selecione uma turma…</option>
        ${S.classes.map(c => `<option value="${c.id}">${E(c.name)}</option>`).join('')}
      </select>
    </div>

    <div id="mt-body">
      <div class="empty">Selecione uma turma para gerenciar as matrículas.</div>
    </div>`;
}

// ── Listar ───────────────────────────────────────────────────────────────────

async function loadMatriculas() {
  const classId = q('#mt-class')?.value;
  const body    = q('#mt-body');
  if (!classId || !body) return;

  body.innerHTML = '<div class="loading">Carregando…</div>';

  const [enrolled, all] = await Promise.all([
    api(`/escolar/students?schoolId=${S.schoolId}&classId=${classId}`)
      .then(d => d.data ?? d ?? []).catch(() => []),
    api(`/escolar/students?schoolId=${S.schoolId}`)
      .then(d => d.data ?? d ?? []).catch(() => []),
  ]);

  const enrolledIds = new Set(enrolled.map(e => e.id));
  const available   = all.filter(a => !enrolledIds.has(a.id) && a.active);

  body.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <!-- Matriculados -->
      <div class="card">
        <div class="section-header">
          <span class="section-title">Matriculados</span>
          <span class="badge badge-purple">${enrolled.length}</span>
        </div>
        ${enrolled.length ? `
          <div class="tbl-wrap">
            <table>
              <thead><tr><th>Aluno</th><th>Matrícula</th><th></th></tr></thead>
              <tbody>
                ${enrolled.map(e => `
                  <tr>
                    <td>${E(e.name)}</td>
                    <td>${E(e.registration ?? '—')}</td>
                    <td>
                      <button class="btn btn-danger btn-sm"
                        onclick="removeMatricula(${e.enrollment_id ?? e.id}, ${classId})">
                        ✗ Remover
                      </button>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>` : '<div class="empty" style="padding:16px">Nenhum aluno matriculado.</div>'}
      </div>

      <!-- Disponíveis -->
      <div class="card">
        <div class="section-header">
          <span class="section-title">Disponíveis para matricular</span>
        </div>
        ${available.length ? `
          <div class="tbl-wrap">
            <table>
              <thead><tr><th>Aluno</th><th></th></tr></thead>
              <tbody>
                ${available.map(a => `
                  <tr>
                    <td>${E(a.name)}</td>
                    <td>
                      <button class="btn btn-success btn-sm"
                        onclick="addMatricula(${a.id}, ${classId})">
                        + Matricular
                      </button>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>` : '<div class="empty" style="padding:16px">Todos os alunos já estão matriculados.</div>'}
      </div>
    </div>`;
}

// ── Ações ────────────────────────────────────────────────────────────────────

async function addMatricula(studentId, classId) {
  const d = await api('/escolar/enrollments', {
    method: 'POST',
    body:   { school_id: S.schoolId, student_id: studentId, class_id: classId },
  });
  if (d.success !== false) loadMatriculas();
  else alert(d.error ?? 'Erro ao matricular.');
}

async function removeMatricula(enrollmentId, classId) {
  if (!confirm('Remover matrícula desta turma?')) return;
  await api(`/escolar/enrollments/${enrollmentId}`, { method:'DELETE' });
  loadMatriculas();
}

// ── Globals ──────────────────────────────────────────────────────────────────
window.loadMatriculas  = loadMatriculas;
window.addMatricula    = addMatricula;
window.removeMatricula = removeMatricula;
