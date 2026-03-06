/**
 * 通用模态框控制。
 * - openModal/closeModal 控制显示隐藏
 * - 自动绑定蒙层点击与 ESC 关闭（打开时绑定，关闭时释放，避免泄漏）
 * - bindCloseModalButtons 统一绑定所有 X 关闭按钮
 */

const modalListeners = new WeakMap();

function attachModalListeners(el) {
  if (!el || modalListeners.has(el)) return;
  const onBackdropClick = (e) => { if (e.target === el) closeModal(el); };
  const onEsc = (e) => { if (e.key === 'Escape') closeModal(el); };
  el.addEventListener('click', onBackdropClick);
  document.addEventListener('keydown', onEsc);
  modalListeners.set(el, { onBackdropClick, onEsc });
}

function detachModalListeners(el) {
  const rec = el ? modalListeners.get(el) : null;
  if (!el || !rec) return;
  el.removeEventListener('click', rec.onBackdropClick);
  document.removeEventListener('keydown', rec.onEsc);
  modalListeners.delete(el);
}

export function openModal(el) {
  if (!el) return;
  el.setAttribute('aria-hidden', 'false');
  // 打开时绑定一次监听器
  attachModalListeners(el);
}

export function closeModal(el) {
  if (!el) return;
  el.setAttribute('aria-hidden', 'true');
  // 关闭时释放监听器
  detachModalListeners(el);
}

/**
 * 绑定所有具有 .close-modal 的按钮关闭其目标。
 * 如果关闭的是计时器退出按钮，触发 onExitTimer 回调。
 */
export function bindCloseModalButtons(dom, onExitTimer) {
  Array.from(document.querySelectorAll('.close-modal')).forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-close');
      if (id && document.getElementById(id)) closeModal(document.getElementById(id));
      if (dom.exitTimerBtn && btn === dom.exitTimerBtn) {
        onExitTimer?.();
      }
    });
  });
}