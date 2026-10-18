/**
 * common.js — 站点公共逻辑
 * 包含：数据加载、组件注入、i18n、导航交互、页面过渡
 */

// ============================================================
// 1. 基础工具
// ============================================================
async function loadJSON(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`加载失败: ${path} (${res.status})`);
  return res.json();
}

// ============================================================
// 2. 组件注入
// ============================================================
async function loadComponents() {
  for (const name of ['header', 'footer']) {
    const el = document.getElementById(`site-${name}`);
    if (!el) continue;
    try {
      const html = await fetch(`/components/${name}.html`).then(r => r.text());
      el.innerHTML = html;
    } catch (e) {
      console.warn(`组件 ${name} 加载失败`, e);
    }
  }
}

// ============================================================
// 3. i18n 国际化
// ============================================================
let i18n = {};
let lang = localStorage.getItem('lang') || 'zh';

async function initI18n() {
  try {
    i18n = await loadJSON('/assets/data/i18n.json');
    applyI18n();
  } catch (e) {
    console.warn('i18n 加载失败，回退到默认文本', e);
  }
}

function t(key) {
  return (i18n[lang] && i18n[lang][key]) || key;
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
}

// ============================================================
// 4. 导航交互（移动端汉堡菜单）
// ============================================================
function initNavigation() {
  const btn = document.getElementById('nav-menu-btn');
  const links = document.getElementById('nav-links');
  
  if (!btn || !links) return;

  // 切换菜单
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    btn.classList.toggle('is-open');
    links.classList.toggle('is-open');
  });

  // 点击外部关闭
  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !links.contains(e.target)) {
      btn.classList.remove('is-open');
      links.classList.remove('is-open');
    }
  });
}

// ============================================================
// 5. 页面跳转淡出（拦截同源普通链接）
// ============================================================
function initPageTransition() {
  document.body.style.opacity = '1';
  document.body.style.transition = 'opacity 0.3s ease';
  
  document.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || a.target === '_blank' || a.hasAttribute('download')) return;

    // 判断是否为同源外部链接
    if (a.hostname && a.hostname !== window.location.hostname) return;

    a.addEventListener('click', (e) => {
      // 如果 href 包含 '#'，说明是锚点跳转
      if (href.includes('#')) {
        const [path, hash] = href.split('#');
        
        // 如果 path 是空的（如 #home-download）或与当前路径相同（如 /#home-download）
        if (!path || path === window.location.pathname || path === '/') {
          const target = document.getElementById(hash);
          if (target) {
            e.preventDefault(); // 阻止默认跳转
            target.scrollIntoView({ behavior: 'smooth' }); // 用 JS 平滑滚动
            history.replaceState(null, '', href); // 顺手把 #home-download 写进浏览器地址栏
            return; // 结束函数，不执行后面的淡出代码
          }
        }
      }

      // 以下为原有的跨页跳转淡出逻辑
      e.preventDefault();
      document.body.style.opacity = '0';
      setTimeout(() => { window.location.href = href; }, 300);
    });
  });
}

// 解决浏览器前进/后退（BFCache）导致页面透明空白的问题
window.addEventListener('pageshow', (event) => {
  // 不管是不是从缓存恢复的，都把透明度重置为 1
  document.body.style.opacity = '1';
});

// ============================================================
// 6. 启动调度（核心）
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  // 顺序很关键：先注入 HTML，再绑定事件和翻译
  await loadComponents();
  initNavigation();
  await initI18n();
  
  // 页面过渡放最后（因为它要扫描所有已经存在的 <a>）
  initPageTransition();

  // 可选：如果你的页面（如 index.js）有自定义初始化，可以在这里触发事件
  document.dispatchEvent(new Event('commonReady'));
});