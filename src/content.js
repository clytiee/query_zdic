let isActive = false;
let wrapSpan = null;
let hoverTimer = null;
let lastChar = null;
let lastRangeKey = null;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "toggle") {
    isActive = !isActive;
    if (!isActive) {
      clearHover();
    }
    console.log("取字模式：", isActive ? "开启" : "关闭");
  }
});

document.addEventListener("mousemove", (e) => {
  if (!isActive) return;
  const pos = document.caretPositionFromPoint
    ? document.caretPositionFromPoint(e.clientX, e.clientY)
    : document.caretRangeFromPoint(e.clientX, e.clientY);
  if (!pos) {
    clearHover();
    return;
  }
  const textNode = pos.offsetNode || pos.startContainer;
  const offset = pos.offset || pos.startOffset;
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
    clearHover();
    return;
  }
  const text = textNode.textContent;
  const char = text[offset];
  if (!/[\u4e00-\u9fa5]/.test(char)) {
    clearHover();
    return;
  }
  // 用文本节点 + 偏移位置做唯一标识
  const currentRangeKey = `${textNode}-${offset}`;
  // 还在同一个字上，不重复处理
  if (currentRangeKey === lastRangeKey && wrapSpan) {
    return;
  }
  // 移动到新字，先清旧高亮
  clearHover();
  lastRangeKey = currentRangeKey;
  lastChar = char;
  // 防抖：鼠标停留 60ms 再包裹，避免快速移动时闪烁
  if (hoverTimer) clearTimeout(hoverTimer);
  hoverTimer = setTimeout(() => {
    // 再次确认当前字没有变
    if (currentRangeKey !== lastRangeKey) return;
    wrapSpan = document.createElement("span");
    wrapSpan.className = "zdic-word-mark";
    wrapSpan.textContent = char;
    const before = text.slice(0, offset);
    const after = text.slice(offset + 1);
    const beforeNode = document.createTextNode(before);
    const afterNode = document.createTextNode(after);
    const parent = textNode.parentNode;
    parent.insertBefore(beforeNode, textNode);
    parent.insertBefore(wrapSpan, textNode);
    parent.insertBefore(afterNode, textNode);
    parent.removeChild(textNode);
  }, 60);
});

document.addEventListener("click", (e) => {
  if (!isActive) return;
  if (e.target.classList.contains("zdic-word-mark")) {
    e.preventDefault();
    const ch = e.target.textContent;
    window.open(`https://zdic.net/hans/${encodeURIComponent(ch)}`, "_blank");
  }
});

function clearHover() {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
  if (!wrapSpan) return;
  const parent = wrapSpan.parentNode;
  if (!parent) return;
  const textNode = document.createTextNode(wrapSpan.textContent);
  parent.replaceChild(textNode, wrapSpan);
  wrapSpan = null;
}
