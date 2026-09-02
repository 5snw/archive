(function(){
  "use strict";

  var TRACK_URL="https://open.spotify.com/intl-pt/track/5bgWnou9B3oO7nJAUVdig5";
  var COVER_URL="https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/69/ab/bd/69abbded-95c4-c250-e93b-be3315abaddc/5063483950779_cover.jpg/300x300bb.jpg";
  var soundButton=document.getElementById("soundToggle");
  var audio=document.getElementById("bgAudio");
  var start=audio?Number(audio.dataset.start||54):54;
  var end=audio?Number(audio.dataset.end||131):131;
  var hideTimer=null;
  if(!soundButton)return;

  var spotifyMark='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="currentColor"/><path d="M6.15 8.58c3.74-1.08 8.13-.76 11.5.94M6.77 12.04c3.21-.91 6.98-.63 9.87.8M7.38 15.33c2.66-.7 5.73-.49 8.18.69" fill="none" stroke="#000" stroke-width="1.72" stroke-linecap="round"/></svg>';
  var previousIcon='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 4v12M15 5l-7 5 7 5z" fill="currentColor"/></svg>';
  var nextIcon='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M15 4v12M5 5l7 5-7 5z" fill="currentColor"/></svg>';
  var player=document.createElement("aside");
  player.className="spotify-mini";
  player.setAttribute("aria-label","Player de aonde mais, Adorável Clichê");
  player.innerHTML='<button class="spotify-mini__bar" type="button" aria-label="Minimizar player"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Minimizar</span></button><div class="spotify-mini__body"><img class="spotify-mini__art" src="'+COVER_URL+'" alt="Capa de aonde mais, de Adorável Clichê"><div class="spotify-mini__meta"><strong>aonde mais</strong><span>Adorável Clichê</span><a class="spotify-mini__save" href="'+TRACK_URL+'" target="_blank" rel="noopener"><i>+</i><b>Salvar no Spotify</b></a></div><a class="spotify-mini__brand" href="'+TRACK_URL+'" target="_blank" rel="noopener" aria-label="Abrir no Spotify">'+spotifyMark+'</a><div class="spotify-mini__controls"><button class="spotify-mini__skip spotify-mini__previous" type="button" aria-label="Voltar ao início do trecho">'+previousIcon+'</button><button class="spotify-mini__skip spotify-mini__next" type="button" aria-label="Avançar 15 segundos">'+nextIcon+'</button><a class="spotify-mini__more" href="'+TRACK_URL+'" target="_blank" rel="noopener" aria-label="Mais opções no Spotify">•••</a><button class="spotify-mini__play" type="button" aria-label="Tocar música"><span></span></button></div><input class="spotify-mini__range" type="range" min="'+start+'" max="'+end+'" step="0.1" value="'+start+'" aria-label="Posição no trecho"><div class="spotify-mini__time"><span class="spotify-mini__current">0:54</span><span>2:11</span></div></div>';
  document.body.appendChild(player);

  var playButton=player.querySelector(".spotify-mini__play");
  var range=player.querySelector(".spotify-mini__range");
  var current=player.querySelector(".spotify-mini__current");

  function showPlayer(){clearTimeout(hideTimer);player.classList.add("is-visible")}
  function hidePlayer(){clearTimeout(hideTimer);player.classList.remove("is-visible")}
  function hidePlayerSoon(){
    clearTimeout(hideTimer);
    hideTimer=setTimeout(function(){
      if(!player.matches(":hover")&&!soundButton.matches(":hover, :focus-visible"))hidePlayer();
    },260);
  }
  function formatTime(seconds){
    return Math.floor(seconds/60)+":"+String(Math.floor(seconds%60)).padStart(2,"0");
  }
  function seek(seconds){
    if(!audio)return;
    try{audio.currentTime=Math.max(start,Math.min(end-.05,seconds))}catch(error){}
    reflect();
  }
  function reflect(){
    var playing=!!audio&&!audio.paused&&!audio.muted;
    var position=audio&&isFinite(audio.currentTime)?audio.currentTime:start;
    if(position<start-.25||position>end+.25)position=start;
    var progress=Math.max(0,Math.min(100,(position-start)/(end-start)*100));
    player.classList.toggle("is-playing",playing);
    playButton.setAttribute("aria-label",playing?"Pausar música":"Tocar música");
    current.textContent=formatTime(position);
    range.value=position;
    range.style.setProperty("--progress",progress+"%");
  }

  soundButton.addEventListener("pointerenter",showPlayer);
  soundButton.addEventListener("pointerleave",hidePlayerSoon);
  soundButton.addEventListener("focus",showPlayer);
  soundButton.addEventListener("blur",hidePlayerSoon);
  soundButton.addEventListener("click",function(){showPlayer();requestAnimationFrame(reflect)});
  player.addEventListener("pointerenter",showPlayer);
  player.addEventListener("pointerleave",hidePlayerSoon);
  player.querySelector(".spotify-mini__bar").addEventListener("click",hidePlayer);
  player.querySelector(".spotify-mini__previous").addEventListener("click",function(){seek(start)});
  player.querySelector(".spotify-mini__next").addEventListener("click",function(){seek((audio?audio.currentTime:start)+15)});
  range.addEventListener("input",function(){seek(Number(range.value))});
  playButton.addEventListener("pointerdown",function(event){event.stopPropagation()});
  playButton.addEventListener("click",function(){
    var playing=!!audio&&!audio.paused&&!audio.muted;
    if(playing||soundButton.getAttribute("aria-pressed")!=="true"){
      soundButton.click();
    }else if(audio){
      audio.muted=false;
      audio.volume=.15;
      seek(audio.currentTime);
      var playback=audio.play();
      if(playback&&playback.catch)playback.catch(function(){});
    }
    requestAnimationFrame(reflect);
  });
  if(audio){
    ["play","playing","pause","volumechange","timeupdate","loadedmetadata","seeked"].forEach(function(eventName){audio.addEventListener(eventName,reflect)});
  }
  reflect();
})();
