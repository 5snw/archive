(function(){
  "use strict";
  var invertButton=document.getElementById("invertToggle");
  var soundButton=document.getElementById("soundToggle");
  var audio=document.getElementById("bgAudio");
  var audioStart=audio?Number(audio.dataset.start||0):0;
  var audioEnd=audio?Number(audio.dataset.end||0):0;
  var audioPositionKey="snow_audio_position";
  var audioSharedKey="snow_audio_checkpoint";
  var pendingAudioPosition=null;
  try{
    var storedAudioPosition=Number(sessionStorage.getItem(audioPositionKey));
    if(Number.isFinite(storedAudioPosition)&&storedAudioPosition>=audioStart&&(!audioEnd||storedAudioPosition<audioEnd))pendingAudioPosition=storedAudioPosition;
  }catch(error){}
  function readSharedAudioPosition(){
    try{
      var checkpoint=JSON.parse(localStorage.getItem(audioSharedKey)||"null");
      var fresh=checkpoint&&Date.now()-Number(checkpoint.savedAt)<3e5;
      var position=checkpoint&&Number(checkpoint.position);
      if(fresh&&Number.isFinite(position)&&position>=audioStart&&(!audioEnd||position<audioEnd))return position;
    }catch(error){}
    return null;
  }
  var sharedAudioPosition=readSharedAudioPosition();
  if(sharedAudioPosition!==null)pendingAudioPosition=sharedAudioPosition;
  function restoreAudioPosition(){
    if(!audio||pendingAudioPosition===null)return false;
    try{audio.currentTime=pendingAudioPosition;pendingAudioPosition=null;return true}catch(error){return false}
  }
  function persistAudioPosition(){
    if(!audio)return;
    var time=audio.currentTime;
    if(!Number.isFinite(time)||time<audioStart||(audioEnd&&time>=audioEnd))return;
    try{
      sessionStorage.setItem(audioPositionKey,time.toFixed(3));
      localStorage.setItem(audioSharedKey,JSON.stringify({position:Number(time.toFixed(3)),savedAt:Date.now()}));
    }catch(error){}
  }
  var reduceMotion=matchMedia("(prefers-reduced-motion:reduce)").matches;
  var pageTransitioning=false;

  function pageReady(){
    document.body.classList.remove("is-page-leaving");
    document.body.classList.add("is-page-ready");
    pageTransitioning=false;
  }
  requestAnimationFrame(function(){requestAnimationFrame(pageReady)});
  addEventListener("pageshow",pageReady);
  document.addEventListener("click",function(event){
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    var link=event.target&&event.target.closest?event.target.closest("a[href]"):null;
    if(!link||link.target==="_blank"||link.hasAttribute("download"))return;
    var url;
    try{url=new URL(link.href,location.href)}catch(error){return}
    if(url.origin!==location.origin||!/^https?:$/.test(url.protocol))return;
    if(url.pathname===location.pathname&&url.search===location.search&&url.hash)return;
    event.preventDefault();
    if(pageTransitioning)return;
    pageTransitioning=true;
    document.body.classList.remove("is-page-ready");
    document.body.classList.add("is-page-leaving");
    setTimeout(function(){location.href=url.href},reduceMotion?0:430);
  });

  function setInvert(on){
    document.body.classList.toggle("is-invert",on);
    if(invertButton)invertButton.setAttribute("aria-pressed",on?"true":"false");
    try{localStorage.setItem("snow_project_invert",on?"1":"0")}catch(error){}
  }
  var storedInvert=false;
  try{storedInvert=localStorage.getItem("snow_project_invert")==="1"}catch(error){}
  setInvert(storedInvert);
  if(invertButton)invertButton.addEventListener("click",function(){setInvert(!document.body.classList.contains("is-invert"))});

  var wantsSound=true;
  try{wantsSound=sessionStorage.getItem("snow_sound")!=="0"}catch(error){}
  function reflectSound(){
    if(!soundButton)return;
    soundButton.textContent=wantsSound?"music off":"music on";
    soundButton.setAttribute("aria-pressed",wantsSound?"true":"false");
  }
  function startSound(){
    if(!audio||!wantsSound)return;
    var restored=restoreAudioPosition();
    if(!restored&&audioEnd&&(audio.currentTime<audioStart-.25||audio.currentTime>=audioEnd)){try{audio.currentTime=audioStart}catch(error){}}
    audio.volume=.15;
    var playback=audio.play();
    if(playback&&playback.catch)playback.catch(function(){});
  }
  function setSound(on){
    wantsSound=on;
    reflectSound();
    try{sessionStorage.setItem("snow_sound",on?"1":"0")}catch(error){}
    if(on)startSound();
    else if(audio){persistAudioPosition();audio.pause()}
  }
  reflectSound();
  if(wantsSound)startSound();
  if(soundButton)soundButton.addEventListener("click",function(){setSound(!wantsSound)});
  if(audio){
    var keepSegment=function(){
      if(!audioEnd)return;
      if(restoreAudioPosition())return;
      if(audio.currentTime>=audioEnd||audio.currentTime<audioStart-.25){try{audio.currentTime=audioStart}catch(error){}if(wantsSound)startSound()}
    };
    audio.addEventListener("loadedmetadata",keepSegment);
    audio.addEventListener("timeupdate",function(){keepSegment();persistAudioPosition()});
    audio.addEventListener("ended",keepSegment);
  }
  addEventListener("pagehide",persistAudioPosition);
  addEventListener("pointerdown",persistAudioPosition,true);
  addEventListener("pointerdown",function(){if(wantsSound&&audio&&audio.paused)startSound()},{passive:true});
  document.addEventListener("visibilitychange",function(){
    if(!audio)return;
    if(document.hidden){persistAudioPosition();audio.pause()}
    else if(wantsSound){
      var latestPosition=readSharedAudioPosition();
      if(latestPosition!==null){pendingAudioPosition=latestPosition;restoreAudioPosition()}
      startSound();
    }
  });

  var cursor=document.getElementById("recordCursor");
  if(cursor&&matchMedia("(hover:hover) and (pointer:fine)").matches){
    addEventListener("pointermove",function(e){
      cursor.style.setProperty("--x",e.clientX+"px");
      cursor.style.setProperty("--y",e.clientY+"px");
      cursor.classList.add("is-on");
      cursor.classList.toggle("is-link",!!(e.target.closest&&e.target.closest("a,button")));
    },{passive:true});
    document.documentElement.addEventListener("mouseleave",function(){cursor.classList.remove("is-on")});
  }

  var progress=document.getElementById("recordProgress");
  var shifting=[].slice.call(document.querySelectorAll("[data-record-shift]"));
  var ticking=false;
  function paint(){
    ticking=false;
    var max=document.documentElement.scrollHeight-innerHeight;
    if(progress)progress.style.setProperty("--progress",(max>0?scrollY/max*100:0).toFixed(2)+"%");
    for(var i=0;i<shifting.length;i++){
      var rect=shifting[i].getBoundingClientRect();
      var amount=(rect.top+rect.height/2-innerHeight/2)/innerHeight;
      shifting[i].style.setProperty("--shift",(amount*-22).toFixed(1)+"px");
    }
  }
  function requestPaint(){if(!ticking){ticking=true;requestAnimationFrame(paint)}}
  addEventListener("scroll",requestPaint,{passive:true});
  addEventListener("resize",requestPaint,{passive:true});
  paint();

  var reveals=[].slice.call(document.querySelectorAll(".reveal"));
  if("IntersectionObserver" in window&&!matchMedia("(prefers-reduced-motion:reduce)").matches){
    var observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add("is-visible");observer.unobserve(entry.target)}});
    },{threshold:.08,rootMargin:"0px 0px -5%"});
    reveals.forEach(function(node){observer.observe(node)});
  }else reveals.forEach(function(node){node.classList.add("is-visible")});

})();
