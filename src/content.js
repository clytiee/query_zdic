let isActive = false;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "toggle") {
    isActive = msg.active;
    console.log("取字模式：", isActive ? "✅开启" : "❌关闭");
    if (!isActive) {
      tipEl.classList.remove("show");
      document.body.classList.remove("zdic-hand-cursor"); // 移除小手
    } else {
      document.body.classList.add("zdic-hand-cursor"); // 开启小手
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
  const ch = textNode.textContent[offset];

  if (!/[\u4e00-\u9fa5]/.test(ch)) return null;
  return { char: ch };
}

// 点击取字跳转
document.addEventListener("click", (e) => {
  if (!isActive) return;
  const res = getCharAtPoint(e.clientX, e.clientY);
  if (!res) return;
  e.preventDefault();
  window.open(`https://zdic.net/hans/${encodeURIComponent(res.char)}`, "_blank");
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
  if (!isActive) {
    tipEl.classList.remove("show");
    return;
  }
  const info = getCharAtPoint(e.clientX, e.clientY);
  if (info) {
    tipEl.textContent = info.char;
    tipEl.style.left = (e.clientX + 12) + "px";
    tipEl.style.top = (e.clientY + 12) + "px";
    tipEl.classList.add("show");
  } else {
    tipEl.classList.remove("show");
  }
});
