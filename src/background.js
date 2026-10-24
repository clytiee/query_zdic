const tabState = new Map();

chrome.runtime.onMessage.addListener(async (msg, sender) => {
  if(msg.type === "escTurnOff" && sender.tab?.id){
    const tabId = sender.tab.id;
    tabState.set(tabId, false);
    await chrome.action.setBadgeText({tabId, text:""});
    try{
      await chrome.tabs.sendMessage(tabId, {type:"toggle", active:false});
    }catch(e){}
  }

  // 网页空白双击切换
  if(msg.type === "dblclickToggle" && sender.tab?.id){
    const tabId = sender.tab.id;
    const newState = !tabState.get(tabId);
    tabState.set(tabId, newState);
    if(newState){
      await chrome.action.setBadgeText({tabId, text:"ON"});
      await chrome.action.setBadgeBackgroundColor({tabId, color:"#28a745"});
    }else{
      await chrome.action.setBadgeText({tabId, text:""});
    }
    try{
      await chrome.tabs.sendMessage(tabId, {type:"toggle", active: newState});
    }catch(err){}
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  const tabId = tab.id;
  const newState = !tabState.get(tabId);
  tabState.set(tabId, newState);

  if(newState){
    await chrome.action.setBadgeText({tabId, text:"ON"});
    await chrome.action.setBadgeBackgroundColor({tabId, color:"#28a745"});
  }else{
    await chrome.action.setBadgeText({tabId, text:""});
  }

  try {
    await chrome.tabs.sendMessage(tabId, {
      type:"toggle",
      active: newState
    });
  }catch(e){
    console.log("页面未就绪，请刷新网页");
  }
});

chrome.tabs.onRemoved.addListener((tabId)=>{
  tabState.delete(tabId);
});

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
