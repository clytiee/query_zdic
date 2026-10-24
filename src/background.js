chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "toggle" });
  } catch (e) {
    console.log("发送消息失败：页面content脚本未就绪，刷新页面重试");
  }
});
