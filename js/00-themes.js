/**
 * js/00-themes.js — Seletor de temas do Monitor Processual PJe
 *
 * Deve ser o PRIMEIRO script carregado no index.html (antes de 01-config-state.js)
 * para aplicar o tema salvo ANTES de qualquer render, evitando flash.
 *
 * Ordem no index.html:
 *   <script src="js/00-themes.js"></script>
 *   <script src="js/01-config-state.js"></script>
 *   ...
 *
 * Temas disponíveis:
 *   ''          → Padrão escuro (dark hacker — original)
 *   'cnj'       → CNJ branco / azul institucional
 *   'juridico'  → Creme / bordô / marinho (estilo peça processual)
 */

(function () {
  // ─── 1. Constantes ────────────────────────────────────────────────────
  const STORAGE_KEY = 'pje_theme';
  const THEMES = [
    { id: '',         label: '🌑 Padrão (Escuro)',  icon: '🌑' },
    { id: 'cnj',      label: '⚖️ CNJ',              icon: '⚖️' },
    { id: 'juridico', label: '📜 Jurídico',         icon: '📜' },
    { id: 'peticao',  label: '🖊️ Petição',          icon: '🖊️' },
    { id: 'mendes',   label: '🟠 Mendes',            icon: '🟠' },
  ];

  // ─── 2. Aplica o tema no <html> ────────────────────────────────────────
  function applyTheme(id) {
    if (id) {
      document.documentElement.setAttribute('data-theme', id);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try { localStorage.setItem(STORAGE_KEY, id); } catch (_) {}
  }

  // Aplica imediatamente (antes do DOM estar pronto) para evitar flash
  const saved = (() => { try { return localStorage.getItem(STORAGE_KEY) || ''; } catch (_) { return ''; } })();
  applyTheme(saved);

  // ─── 3. Injeta o botão na topbar quando o DOM estiver pronto ──────────
  function buildThemeBtn() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return; // DOM ainda não disponível — aguarda

    // Evita duplicata se chamado mais de uma vez
    if (document.getElementById('theme-picker-btn')) return;

    const current = () =>
      document.documentElement.getAttribute('data-theme') || '';

    // ── Wrapper
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;flex-shrink:0';

    // ── Botão principal
    const btn = document.createElement('button');
    btn.id = 'theme-picker-btn';
    btn.title = 'Alterar tema';
    btn.style.cssText = [
      'display:flex;align-items:center;gap:5px',
      'padding:4px 10px',
      'border:1px solid var(--border2)',
      'border-radius:20px',
      'background:var(--bg3)',
      'color:var(--text2)',
      'font-size:11px',
      'font-family:var(--sans)',
      'cursor:pointer',
      'transition:all .12s',
    ].join(';');

    const renderBtnLabel = () => {
      const t = THEMES.find(t => t.id === current()) || THEMES[0];
      btn.innerHTML = `<span style="font-size:13px">${t.icon}</span><span style="font-size:10px;margin-left:4px">${t.label.replace(/^\S+\s/, '')}</span><span style="font-size:8px;color:var(--text3);margin-left:3px">▾</span>`;
    };
    renderBtnLabel();

    btn.addEventListener('mouseenter', () => {
      btn.style.borderColor = 'var(--text3)';
      btn.style.color = 'var(--text)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.borderColor = 'var(--border2)';
      btn.style.color = 'var(--text2)';
    });

    // ── Dropdown
    const dd = document.createElement('div');
    dd.style.cssText = [
      'position:absolute;top:calc(100% + 6px);right:0',
      'background:var(--bg2)',
      'border:1px solid var(--border2)',
      'border-radius:var(--r)',
      'box-shadow:0 4px 16px rgba(0,0,0,.35)',
      'z-index:500',
      'min-width:170px',
      'display:none',
      'overflow:hidden',
    ].join(';');

    THEMES.forEach(t => {
      const item = document.createElement('button');
      item.dataset.themeId = t.id;
      item.style.cssText = [
        'display:flex;align-items:center;gap:8px',
        'width:100%;padding:8px 12px',
        'background:none;border:none',
        'cursor:pointer',
        'font-size:12px;font-family:var(--sans)',
        'color:var(--text2)',
        'transition:background .1s',
        'text-align:left',
      ].join(';');
      item.innerHTML = `<span style="font-size:15px">${t.icon}</span><span style="margin-left:2px">${t.label.replace(/^\S+\s/, '')}</span>`;

      item.addEventListener('mouseenter', () => {
        item.style.background = 'var(--bg3)';
        item.style.color = 'var(--text)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'none';
        item.style.color = 'var(--text2)';
      });

      item.addEventListener('click', () => {
        applyTheme(t.id);
        renderBtnLabel();
        dd.style.display = 'none';
      });

      dd.appendChild(item);
    });

    // Toggle dropdown
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
    });

    // Fecha ao clicar fora
    document.addEventListener('click', () => { dd.style.display = 'none'; });

    wrap.appendChild(btn);
    wrap.appendChild(dd);

    // Insere antes do último filho da topbar (user-badge)
    const spacer = topbar.querySelector('.top-spacer');
    if (spacer) {
      topbar.insertBefore(wrap, spacer.nextSibling);
    } else {
      topbar.appendChild(wrap);
    }
  }

  // ─── 4. Aguarda o DOM ─────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildThemeBtn);
  } else {
    buildThemeBtn();
  }

  // ─── 5. API pública (opcional, para outros scripts usarem) ────────────
  window.PJeTheme = {
    apply: applyTheme,
    current: () => document.documentElement.getAttribute('data-theme') || '',
    themes: THEMES,
  };
})();
