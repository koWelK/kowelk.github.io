/* ============================================================
   index.js — 首页（麓原作品介绍）
   职责：加载 luyuan.json 和 versions.json → 渲染页面 → 控制 loader 与动画
   数据：/assets/data/projects/luyuan.json
         /assets/data/projects/versions.json
   ============================================================ */
(function () {
  'use strict';

  const DATA_URL = '/assets/data/projects/luyuan.json';
  const VERSIONS_URL = '/assets/data/projects/versions.json';
  const MIN_LOADER_MS = 600;   // loader 最短展示，避免闪一下
  const MAX_WAIT_MS = 4000;    // 图片/数据卡住时的兜底放行

  /* ---------- 工具 ---------- */
  async function loadJSON(url) {
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
  function renderDownload(d, latest) {
    const root = document.getElementById('home-download');
    if (!root || !d) return;

    // 如果找不到可用版本，只渲染常驻说明
    if (!latest) {
      root.innerHTML = `
        <div class="home-download__inner home-animate-up" data-delay="4" id="index-download">
          <div class="home-download__header">
            <span class="home-badge">${escapeHtml(d.badge || '下载')}</span>
            <h2>${escapeHtml(d.title || '下载')}</h2>
            <p class="home-download__sub">${(d.subtitleLines || [d.subtitle || '']).map(escapeHtml).join('<br>')}</p>
          </div>
          <p style="text-align: center; color: #8a9cb0; margin: 40px 0;">暂无可用下载版本</p>
        </div>
      `;
      return;
    }

    // 动态生成下载按钮
    const links = (latest.links || []).map(l => {
      const variant = l.variant === 'secondary' ? ' home-btn--secondary' : '';
      return `<a class="home-btn${variant}" href="${escapeHtml(l.url || '#')}" rel="noopener">${escapeHtml(l.label || '下载')}</a>`;
    }).join('');

    // 保留游玩须知
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
          <!-- 动态获取最新版本号与日期 -->
          <p class="home-version">最新正式版 v${escapeHtml(latest.version)} · ${escapeHtml(latest.date)}</p>
          <div class="home-links">${links}</div>
          ${d.credit ? `<p class="home-credit">${escapeHtml(d.credit)}</p>` : ''}
        </div>
        ${notes}
        
        <!-- 历史版本跳转链接 -->
        <div style="text-align:center; margin-top:24px;">
          <a href="/tools/versions.html" style="font-size:14px; color:#8a9cb0; text-decoration:none; transition: color 0.3s;" onmouseover="this.style.color='#4a7cf7'" onmouseout="this.style.color='#8a9cb0'">查看历史版本 →</a>
        </div>
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
  /* ---------- 启动 ---------- */
  document.addEventListener('commonReady', async () => {
    const loader = createLoader();
    const started = Date.now();

    try {
      // 1. 先单独加载 luyuan.json
      let data;
      try {
        data = await loadJSON(DATA_URL);
      } catch (e) {
        throw new Error(`首页数据 luyuan.json 加载失败：${e.message}`);
      }

      // 2. 再单独加载 versions.json
      let versions = [];
      try {
        versions = await loadJSON(VERSIONS_URL);
      } catch (e) {
        throw new Error(`版本数据 versions.json 加载失败：${e.message}`);
      }

      // 3. 渲染页面
      renderCover(data);
      renderFeatures(data);

      // 4. 找最新的 Release
      let latestRelease = null;
      if (Array.isArray(versions)) {
        for (let i = versions.length - 1; i >= 0; i--) {
          if (versions[i].type === 'Release') {
            latestRelease = versions[i];
            break;
          }
        }
      }
      
      renderDownload(data.download, latestRelease);

      // 5. 图片和收尾
      const coverReady = waitImage(data.cover);
      const timeout = new Promise(r => setTimeout(r, MAX_WAIT_MS));
      await Promise.race([coverReady, timeout]);

      document.title = `${data.title || '麓原'} · 麓原交通协会`;

      const elapsed = Date.now() - started;
      if (elapsed < MIN_LOADER_MS) {
        await new Promise(r => setTimeout(r, MIN_LOADER_MS - elapsed));
      }

      loader.done();
      initReveal();
    } catch (err) {
      console.error(err);
      // 把具体的错误信息显示在 Loader 上
      loader.fail(err.message || '加载失败');
      
      const main = document.getElementById('home-main');
      if (main) {
        main.innerHTML = `
          <div style="padding:80px 24px;text-align:center;color:#dc2626;font-size:15px;">
            <strong>页面数据加载失败</strong><br><br>
            <span style="color:#5a6f86;font-size:14px;">${escapeHtml(err.message || '')}</span><br>
            <span style="color:#8a9cb0;font-size:12px;margin-top:12px;display:inline-block;">请按 F12 查看控制台获取更多信息</span>
          </div>`;
      }
    }
  });
})();