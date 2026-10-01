"use strict";
(function(){
  // Frozen after the final minimal Vision test failed. No network or storage writes.
  const message="Mobile AI Vision暂不启用。手机继续拍照、录入、规则定价和ZIP导出；AI研究请在PC端完成。";
  const $=id=>document.getElementById(id);
  async function refreshButton(){const button=$("mobileVision");if(button){button.hidden=true;button.disabled=true;}const research=$("mobileResearch");if(research)research.hidden=true;const hint=$("mobileVisionHint");if(hint)hint.textContent=message;}
  async function renderSettings(){const container=$("aiVisionSettings");if(container){container.textContent=message;container.className="card small";}}
  $("mobileVision").onclick=null;
  globalThis.JisenVisionUI={renderSettings,refreshButton,openResearch:async()=>{}};
  refreshButton();
})();
