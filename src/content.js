let isActive = false;
let lastShowChar = null;
let lastMouseX = 0;
let lastMouseY = 0;
const MOUSE_MIN_MOVE = 3;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "toggle") {
    isActive = msg.active;
    console.log("取字模式：", isActive ? "✅开启" : "❌关闭");
    if (!isActive) {
      tipEl.classList.remove("show");
      document.body.classList.remove("zdic-hand-cursor");
      lastShowChar = null;
    } else {
      document.body.classList.add("zdic-hand-cursor");
    }
  }
});

// 获取鼠标坐标下的汉字
function getCharAtPoint(x, y) {
  const pos = document.caretPositionFromPoint
    ? document.caretPositionFromPoint(x, y)
    : document.caretRangeFromPoint(x, y);
  if (!pos) return null;
  const textNode = pos.offsetNode || pos.startContainer;
  const offset = pos.offset || pos.startOffset;
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return null;
  const text = textNode.textContent;
  const textLen = text.length;
  if (textLen === 0) return null;

  function testIndex(idx) {
    if (idx < 0 || idx >= textLen) return null;
    const ch = text[idx];
    if (!/[\u4e00-\u9fa5]/.test(ch)) return null;
    const r = document.createRange();
    r.setStart(textNode, idx);
    r.setEnd(textNode, idx + 1);
    const rect = r.getBoundingClientRect();
    const inside = (
      x >= rect.left - 1 &&
      x <= rect.right + 1 &&
      y >= rect.top - 1 &&
      y <= rect.bottom + 1
    );
    return inside ? ch : null;
  }

  let ch = testIndex(offset);
  if (ch) return { char: ch };
  ch = testIndex(offset - 1);
  if (ch) return { char: ch };
  return null;
}

// 点击取字跳转汉典
document.addEventListener("click", (e) => {
  if (!isActive) return;
  const res = getCharAtPoint(e.clientX, e.clientY);
  if (!res) return;
  e.preventDefault();
  window.open(`https://zdic.net/hans/${encodeURIComponent(res.char)}`, "_blank");
});

// ========== 新增：空白处双击开启关闭 ==========
document.addEventListener("dblclick", (e) => {
  // 仅当双击目标是 html / body（页面空白）才触发
  const target = e.target;
  if (target !== document.body && target !== document.documentElement) {
    return;
  }
  e.preventDefault();
  // 通知background切换当前tab状态
  chrome.runtime.sendMessage({ type:"dblclickToggle" });
});

// 悬浮提示tip
let tipEl = null;
function initTip() {
  if (tipEl) return;
  tipEl = document.createElement("div");
  tipEl.id = "zdic-hover-tip";
  document.body.appendChild(tipEl);
}
initTip();

document.addEventListener("mousemove", (e) => {
  const dx = Math.abs(e.clientX - lastMouseX);
  const dy = Math.abs(e.clientY - lastMouseY);
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

  if(dx < MOUSE_MIN_MOVE && dy < MOUSE_MIN_MOVE){
    return;
  }

  if (!isActive) {
    tipEl.classList.remove("show");
    return;
  }
  const info = getCharAtPoint(e.clientX, e.clientY);
  if (info) {
    if(info.char === lastShowChar) return;
    lastShowChar = info.char;
    tipEl.textContent = info.char;
    tipEl.style.left = (e.clientX + 12) + "px";
    tipEl.style.top = (e.clientY + 12) + "px";
    tipEl.classList.add("show");
  } else {
    lastShowChar = null;
    tipEl.classList.remove("show");
  }
});

// Esc 按键退出模式，输入框内不触发
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isActive) {
    const tag = e.target.tagName;
    if(tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable){
      return;
    }
    chrome.runtime.sendMessage({ type: "escTurnOff" });
  }
});
