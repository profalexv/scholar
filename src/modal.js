import { q } from './utils.js';

/**
 * Exibe um modal com o HTML fornecido.
 * Clique fora do modal (.modal-bg) fecha automaticamente.
 */
export function showModal(html) {
  const mc = q('#modal-container');
  mc.innerHTML = `<div class="modal-bg" id="mb">${html}</div>`;
  mc.querySelector('#mb').addEventListener('click', e => {
    if (e.target.id === 'mb') closeModal();
  });
}

/** Fecha o modal atual. Exposto globalmente para uso em onclick="closeModal()". */
export function closeModal() {
  const mc = q('#modal-container');
  if (mc) mc.innerHTML = '';
}

// Exposto globalmente pois modais usam onclick="closeModal()"
window.closeModal = closeModal;
