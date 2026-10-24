// 记录每个tab的开关状态
const tabState = new Map();

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  const tabId = tab.id;
  const newState = !tabState.get(tabId);
  tabState.set(tabId, newState);

  // 设置角标
  if(newState){
    await chrome.action.setBadgeText({tabId, text:"ON"});
    await chrome.action.setBadgeBackgroundColor({tabId, color:"#28a745"});
  }else{
    await chrome.action.setBadgeText({tabId, text:""});
  }

  // 发送给content脚本
  try {
    await chrome.tabs.sendMessage(tabId, {
      type:"toggle",
      active: newState
    });
  }catch(e){
    console.log("页面未就绪，请刷新网页");
  }
});

// 新增：接收Esc关闭指令
chrome.runtime.onMessage.addListener(async (msg, sender) => {
  if(msg.type === "escTurnOff" && sender.tab?.id){
    const tabId = sender.tab.id;
    tabState.set(tabId, false);
    await chrome.action.setBadgeText({tabId, text:""});
    try{
      await chrome.tabs.sendMessage(tabId, {type:"toggle", active:false});
    }catch(e){}
  }
});

// 标签关闭，清理状态
chrome.tabs.onRemoved.addListener((tabId)=>{
  tabState.delete(tabId);
});

// 页面刷新后恢复角标
chrome.tabs.onUpdated.addListener(async (tabId, info)=>{
  if(info.status === "complete"){
    const s = tabState.get(tabId);
    if(s === true){
      await chrome.action.setBadgeText({tabId, text:"ON"});
      await chrome.action.setBadgeBackgroundColor({tabId, color:"#28a745"});
    }else{
      await chrome.action.setBadgeText({tabId, text:""});
    }
  }
})
