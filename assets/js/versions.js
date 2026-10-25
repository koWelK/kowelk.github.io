/* ============================================================
   versions.js — 历史版本列表渲染（带筛选）
   ============================================================ */
(function () {
  'use strict';
  const DATA_URL = '/assets/data/projects/versions.json';
  let allVersions = []; // 缓存处理过的全量数据

  async function loadJSON(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error('加载失败');
    return res.json();
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function getTagClass(type) {
    if (type === 'Beta') return 'v-tag--beta';
    if (type === 'Alpha') return 'v-tag--alpha';
    return 'v-tag--release';
  }

  /* ---------- 核心：渲染列表 ---------- */
  function renderList() {
    const listEl = document.getElementById('version-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    // 1. 获取当前被选中的类型
    const activeTypes = Array.from(document.querySelectorAll('.filter-btn.is-active'))
      .map(btn => btn.dataset.type);

    // 2. 过滤数据
    const filtered = allVersions.filter(v => activeTypes.includes(v.type));

    // 3. 处理空状态
    if (filtered.length === 0) {
      listEl.innerHTML = `<p style="text-align:center; color:#8a9cb0; padding: 60px 0;">当前筛选条件下没有版本。</p>`;
      return;
    }

    // 4. 生成卡片 DOM
    filtered.forEach(v => {
      const changelogHtml = (v.changelog || []).map(log => `<li>${escapeHtml(log)}</li>`).join('');
      const linksHtml = (v.links || []).map(l => `
        <a href="${escapeHtml(l.url || '#')}" class="v-btn" target="_blank" rel="noopener">${escapeHtml(l.label || '下载')}</a>
      `).join('');

      const card = document.createElement('div');
      card.className = 'version-card';
      card.innerHTML = `
        <div class="v-card-header">
          <h2 class="v-version">v${escapeHtml(v.version)}</h2>
          <span class="v-tag ${getTagClass(v.type)}">${escapeHtml(v.type)}</span>
          <span class="v-date">${escapeHtml(v.date)}</span>
        </div>
        <ul class="v-changelog">
          ${changelogHtml || '<li>暂无更新日志</li>'}
        </ul>
        <div class="v-links">
          ${linksHtml}
        </div>
      `;
      listEl.appendChild(card);
    });
  }

  /* ---------- 初始化事件绑定 ---------- */
  function initFilters() {
    const filterContainer = document.getElementById('version-filters');
    if (!filterContainer) return;

    filterContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      // 切换按钮状态
      btn.classList.toggle('is-active');
      
      // 重新渲染列表
      renderList();
    });
  }

  /* ---------- 启动 ---------- */
  document.addEventListener('commonReady', async () => {
    const listEl = document.getElementById('version-list');
    if (!listEl) return;

    try {
      const versions = await loadJSON(DATA_URL);
      
      // 将最新版本（文本中最靠下的）放在最前
      allVersions = versions.slice().reverse();

      // 初始化筛选器绑定
      initFilters();

      // 首次渲染
      renderList();

    } catch (err) {
      console.error(err);
      listEl.innerHTML = `<p style="color:#dc2626; text-align:center; padding: 40px 0;">版本数据加载失败，请稍后重试。</p>`;
    }
  });
})();