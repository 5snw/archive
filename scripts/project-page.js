(function(){
  "use strict";
  var invertButton=document.getElementById("invertToggle");
  var soundButton=document.getElementById("soundToggle");
  var audio=document.getElementById("bgAudio");

  function setInvert(on){
    document.body.classList.toggle("is-invert",on);
    if(invertButton)invertButton.setAttribute("aria-pressed",on?"true":"false");
    try{localStorage.setItem("snow_project_invert",on?"1":"0")}catch(error){}
  }
  var storedInvert=false;
  try{storedInvert=localStorage.getItem("snow_project_invert")==="1"}catch(error){}
  setInvert(storedInvert);
  if(invertButton)invertButton.addEventListener("click",function(){setInvert(!document.body.classList.contains("is-invert"))});

  var wantsSound=false;
  try{wantsSound=sessionStorage.getItem("snow_sound")==="1"}catch(error){}
  function reflectSound(){
    if(!soundButton)return;
    soundButton.textContent=wantsSound?"music off":"music on";
    soundButton.setAttribute("aria-pressed",wantsSound?"true":"false");
  }
  function startSound(){
    if(!audio||!wantsSound)return;
    audio.volume=.42;
    var playback=audio.play();
    if(playback&&playback.catch)playback.catch(function(){});
  }
  function setSound(on){
    wantsSound=on;
    reflectSound();
    try{sessionStorage.setItem("snow_sound",on?"1":"0")}catch(error){}
    if(on)startSound();
    else if(audio){audio.pause()}
  }
  reflectSound();
  if(wantsSound)startSound();
  if(soundButton)soundButton.addEventListener("click",function(){setSound(!wantsSound)});
  addEventListener("pointerdown",function(){if(wantsSound&&audio&&audio.paused)startSound()},{passive:true});
  document.addEventListener("visibilitychange",function(){
    if(!audio)return;
    if(document.hidden)audio.pause();
    else if(wantsSound)startSound();
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
