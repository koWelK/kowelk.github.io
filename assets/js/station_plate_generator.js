/* =========================================================
   OMSI 站牌/线路牌生成器
   依赖：
   - HTML 中的元素 id 必须与下方一致
   - html2canvas 已在 index.html 中通过 CDN 引入
   ========================================================= */

function checkFonts() {
    const fontsToCheck = [
        { name: '阿里巴巴普惠体 3.0' },
        { name: 'Century Gothic' },
        { name: 'Bahnschrift' }
    ];

    const missing = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    fontsToCheck.forEach(font => {
        ctx.font = `72px "${font.name}", sans-serif`;
        const width1 = ctx.measureText('测试Test123').width;

        ctx.font = '72px sans-serif';
        const width2 = ctx.measureText('测试Test123').width;

        if (width1 === width2 && font.name !== 'sans-serif') {
            missing.push(font.name);
        }
    });

    if (missing.length > 0) {
        document.getElementById('missing-fonts').innerText = missing.join('、');
        document.getElementById('font-warning').style.display = 'block';
    }
}

/* -------------------------
   站名牌
   ------------------------- */

const sZh = document.getElementById('s-zh');
const sEn = document.getElementById('s-en');
const sCode = document.getElementById('s-code');
const sColor = document.getElementById('s-color');
const sPos = document.getElementById('s-pos');

const signBoard = document.getElementById('sign-board');
const pSCode = document.getElementById('p-s-code');

function updateSign() {
    document.getElementById('p-s-zh').innerText = sZh.value;
    document.getElementById('p-s-en').innerText = sEn.value;

    if (sCode.value.trim() === '') {
        pSCode.style.display = 'none';
    } else {
        pSCode.style.display = 'flex';
        pSCode.innerText = sCode.value;
        pSCode.style.backgroundColor = sColor.value;
    }

    signBoard.className = `sign-board ${sPos.value}`;
}

[sZh, sEn, sCode, sColor, sPos].forEach(el => {
    el.addEventListener('input', updateSign);
    el.addEventListener('change', updateSign);
});

/* -------------------------
   线路牌
   ------------------------- */

const rNum = document.getElementById('r-num');
const rDestZh = document.getElementById('r-dest-zh');
const rDestEn = document.getElementById('r-dest-en');
const rDescZh = document.getElementById('r-desc-zh');
const rDescEn = document.getElementById('r-desc-en');

function updateRoute() {
    document.getElementById('p-r-num').innerText = rNum.value;

    const descZhVal = rDescZh.value.trim();
    const destZhVal = rDestZh.value.trim();
    const descEnVal = rDescEn.value.trim();
    const destEnVal = rDestEn.value.trim();

    const pDescZh = document.getElementById('p-r-desc-zh');
    const pDestZh = document.getElementById('p-r-dest-zh');

    if (descZhVal) {
        pDescZh.style.display = 'inline';
        pDescZh.innerText = descZhVal + ' ';
    } else {
        pDescZh.style.display = 'none';
    }

    pDestZh.innerText = destZhVal;

    const pEn = document.getElementById('p-r-en');

    if (descEnVal) {
        pEn.innerText = `${descEnVal}, ${destEnVal}`;
    } else {
        pEn.innerText = destEnVal;
    }
}

[rNum, rDestZh, rDestEn, rDescZh, rDescEn].forEach(el => {
    el.addEventListener('input', updateRoute);
});

/* -------------------------
   导出 PNG
   ------------------------- */

function exportImage(elementId) {
    const element = document.getElementById(elementId);

    if (!element) {
        console.error('找不到导出元素：', elementId);
        return;
    }

    html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `${elementId}_${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

/* 兼容 HTML 中 onclick="exportImage(...)" */
window.exportImage = exportImage;

/* -------------------------
   初始化
   ------------------------- */

window.onload = () => {
    checkFonts();
    updateSign();
    updateRoute();
};