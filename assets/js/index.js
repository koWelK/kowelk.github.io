/* ============================================================
   index.js — 首页（麓原作品介绍）
   职责：加载 luyuan.json → 渲染封面/介绍区/下载区 → 控制 loader 与滚动动画
   数据：/assets/data/projects/luyuan.json
   ============================================================ */
(function () {
  'use strict';

  const DATA_URL = '/assets/data/projects/luyuan.json';
  const MIN_LOADER_MS = 600;   // loader 最短展示，避免闪一下
  const MAX_WAIT_MS = 4000;    // 图片/数据卡住时的兜底放行

  /* ---------- 工具 ---------- */
  async function loadJSON(url) {
    // 如果 common.js 里已经定义了全局 loadJSON，可以直接借用，这里保留本地版以防万一
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${url} 加载失败 (${res.status})`);
    return res.json();
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // 预加载一张图片，返回成败，用于决定 loader 何时结束
  function waitImage(src) {
    if (!src) return Promise.resolve(false);
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  /* ---------- loader ---------- */
  function createLoader() {
    const root = document.getElementById('home-loader');
    const fill = document.getElementById('home-progress-fill');
    const label = document.getElementById('home-progress-label');
    let value = 0;

    const timer = setInterval(() => {
      // 最高模拟到 90%，剩下 10% 留给真实完成
      value = Math.min(90, value + Math.random() * 12);
      paint(value);
    }, 120);

    function paint(v) {
      value = v;
      if (fill) fill.style.width = v + '%';
      if (label) label.textContent = Math.floor(v) + '%';
    }

    return {
      done() {
        clearInterval(timer);
        paint(100);
        setTimeout(() => {
          if (!root) return;
          root.classList.add('is-hidden');
          setTimeout(() => root.remove(), 700);
        }, 250);
      },
      fail(msg) {
        clearInterval(timer);
        if (label) label.textContent = msg || '加载失败';
      }
    };
  }

  /* ---------- 渲染：封面 ---------- */
  function renderCover(data) {
    const root = document.getElementById('home-cover');
    if (!root) return;

    const metaHtml = (data.meta || []).map(m => `
      <span class="home-meta__item">
        <span class="home-meta__label">${escapeHtml(m.label)}</span>
        ${escapeHtml(m.value)}
      </span>
    `).join('');

    const subHtml = (data.subtitleLines || [data.subtitle || ''])
      .map(line => escapeHtml(line)).join('<br>');

    root.innerHTML = `
      <div class="home-cover__text" id="home-cover-text">
        <div class="home-cover__inner">
          <div class="home-tag">${escapeHtml(data.tag || '')}</div>
          <h1>${escapeHtml(data.title || '')}</h1>
          <p class="home-sub">${subHtml}</p>
          <div class="home-meta">${metaHtml}</div>
        </div>
      </div>
      <div class="home-cover__media">
        <img src="${escapeHtml(data.cover || '')}" alt="${escapeHtml(data.title || '封面')}" fetchpriority="high">
      </div>
    `;

    // 封面文字延迟上移（还原 productN.css 的 cover-shifted 效果）
    setTimeout(() => {
      const text = document.getElementById('home-cover-text');
      if (text) text.classList.add('is-shifted');
    }, 1200);
  }

  /* ---------- 渲染：图文交替介绍区 ---------- */
  function renderFeatures(data) {
    const root = document.getElementById('home-features');
    if (!root) return;

    const list = Array.isArray(data.sections) ? data.sections : [];
    root.innerHTML = list.map((s, i) => {
      const reverse = i % 2 === 1 ? ' home-feature--reverse' : '';
      const delay = (i % 4) + 1;
      const num = s.number || String(i + 1).padStart(2, '0');
      return `
        <section class="home-feature${reverse} home-animate-up" data-delay="${delay}">
          <div class="home-feature__media">
            <img src="${escapeHtml(s.image || '')}" alt="${escapeHtml(s.title || '')}" loading="lazy">
          </div>
          <div class="home-feature__text">
            <span class="home-feature__num" aria-hidden="true">${escapeHtml(num)}</span>
            <div class="home-feature__inner">
              <h2>${escapeHtml(s.title || '')}</h2>
              <p>${escapeHtml(s.text || '')}</p>
            </div>
          </div>
        </section>
      `;
    }).join('');
  }

  /* ---------- 渲染：下载区 ---------- */
  function renderDownload(data) {
    const root = document.getElementById('home-download');
    if (!root) return;

    const d = data.download;
    if (!d) { root.remove(); return; }

    const links = (d.links || []).map(l => {
      const variant = l.variant === 'secondary' ? ' home-btn--secondary' : '';
      return `<a class="home-btn${variant}" href="${escapeHtml(l.url || '#')}" rel="noopener">${escapeHtml(l.label || '下载')}</a>`;
    }).join('');

    const notes = Array.isArray(d.notes) && d.notes.length
      ? `<ul class="home-rules">${d.notes.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul>`
      : '';

    root.innerHTML = `
      <div class="home-download__inner home-animate-up" data-delay="4" id="index-download">
        <div class="home-download__header">
          <span class="home-badge">${escapeHtml(d.badge || '下载')}</span>
          <h2>${escapeHtml(d.title || '下载')}</h2>
          <p class="home-download__sub">${(d.subtitleLines || [d.subtitle || '']).map(escapeHtml).join('<br>')}</p>
        </div>
        <div class="home-download__card">
          <h3>${escapeHtml(d.name || '地图本体')}</h3>
          <p class="home-version">${escapeHtml(d.version || '')}</p>
          <div class="home-links">${links}</div>
          ${d.credit ? `<p class="home-credit">${escapeHtml(d.credit)}</p>` : ''}
        </div>
        ${notes}
      </div>
    `;
  }

  /* ---------- 滚动淡入 ---------- */
  function initReveal() {
    const items = document.querySelectorAll('.home-animate-up');
    if (!('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach(el => io.observe(el));
  }

  /* ---------- 启动 ---------- */
  // 监听 common.js 派发的 commonReady 事件，
  // 确保此时 DOM 已解析、Header/Footer 已注入完毕。
  document.addEventListener('commonReady', async () => {
    const loader = createLoader();
    const started = Date.now();

    try {
      // 此时 header/footer 已注入，不用再 mountComponents，也不用 syncNavHeight
      const data = await loadJSON(DATA_URL);

      renderCover(data);
      renderFeatures(data);
      renderDownload(data);

      // 等首图（若存在），但不无限等
      const coverReady = waitImage(data.cover);
      const timeout = new Promise(r => setTimeout(r, MAX_WAIT_MS));
      await Promise.race([coverReady, timeout]);

      document.title = `${data.title || '麓原'} · 麓原交通协会`;

      // 保证 loader 至少展示 MIN_LOADER_MS
      const elapsed = Date.now() - started;
      if (elapsed < MIN_LOADER_MS) {
        await new Promise(r => setTimeout(r, MIN_LOADER_MS - elapsed));
      }

      loader.done();
      initReveal();
    } catch (err) {
      console.error(err);
      loader.fail('加载失败');
      const main = document.getElementById('home-main');
      if (main) {
        main.innerHTML = `
          <div style="padding:80px 24px;text-align:center;color:#5a6f86;font-size:15px;">
            页面数据加载失败，请刷新重试。<br>
            <span style="color:#8a9cb0;font-size:13px;">${escapeHtml(err.message || '')}</span>
          </div>`;
      }
    }
  });
})();