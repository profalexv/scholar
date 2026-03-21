import { S } from './state.js';
import { api } from './api.js';

/**
 * Tenta restaurar uma sessão salva (localStorage ou query string ?token=&schoolId=&api=).
 * Retorna true se credenciais encontradas e estado preenchido.
 */
export function loadStoredSession() {
  const p        = new URLSearchParams(location.search);
  const token    = p.get('token')    || localStorage.getItem('scholar_token');
  const schoolId = p.get('schoolId') || localStorage.getItem('scholar_school_id');
  const apiBase  = p.get('api')      || localStorage.getItem('scholar_api_base') || '';

  if (!token || !schoolId || !apiBase) return false;

  S.token    = token;
  S.schoolId = Number(schoolId);
  S.apiBase  = apiBase;
  return true;
}

/**
 * Realiza o login com usuário/senha, persiste o token e preenche o estado.
 * Lança Error em caso de falha.
 */
export async function loginWithCredentials(apiBase, username, password) {
  S.apiBase = apiBase;
  const d = await api('/auth/login', { method: 'POST', body: { username, password } });

  if (!d.success) throw new Error(d.error || 'Credenciais inválidas.');

  S.token    = d.token;
  S.schoolId = d.admin?.schoolId ?? d.schoolId;

  localStorage.setItem('scholar_token',     S.token);
  localStorage.setItem('scholar_school_id', String(S.schoolId));
  localStorage.setItem('scholar_api_base',  S.apiBase);
}

/** Remove a sessão e recarrega a página. */
export function logout() {
  ['scholar_token', 'scholar_school_id', 'scholar_api_base'].forEach(k =>
    localStorage.removeItem(k),
  );
  location.reload();
}
