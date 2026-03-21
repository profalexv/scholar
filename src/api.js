import { S } from './state.js';

/**
 * Wrapper sobre fetch que injeta o token de autenticação e
 * serializa/desserializa JSON automaticamente.
 *
 * @param {string} path  - Caminho relativo, ex: '/escolar/students?schoolId=1'
 * @param {object} opts  - Opções: method, body (objeto JS), headers extras
 * @returns {Promise<object>} - Resposta JSON do servidor
 */
export async function api(path, opts = {}) {
  const url = S.apiBase.replace(/\/$/, '') + '/api' + path;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'x-aula-token': S.token ?? '',
    },
    ...opts,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!data.success && res.status === 401) {
    // Sessão expirada → limpa credenciais e recarrega
    ['scholar_token', 'scholar_school_id', 'scholar_api_base'].forEach(k =>
      localStorage.removeItem(k),
    );
    location.reload();
    throw new Error('Sessão expirada.');
  }

  return data;
}
