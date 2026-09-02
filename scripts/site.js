(function() {
    "use strict";
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var config = window.SNOW_CONFIG || {};
    var pageTransitioning = false;
    function pageReady() {
        document.body.classList.remove("is-page-leaving");
        document.body.classList.add("is-page-ready");
        pageTransitioning = false;
    }
    function transitionTo(href) {
        if (pageTransitioning) return;
        pageTransitioning = true;
        document.body.classList.remove("is-page-ready");
        document.body.classList.add("is-page-leaving");
        setTimeout(function() {
            window.location.href = href;
        }, reduce ? 0 : 430);
    }
    document.addEventListener("click", function(event) {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        var link = event.target && event.target.closest ? event.target.closest("a[href]") : null;
        if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
        var url;
        try { url = new URL(link.href, window.location.href); } catch (error) { return; }
        if (url.origin !== window.location.origin || !/^https?:$/.test(url.protocol)) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
        event.preventDefault();
        transitionTo(url.href);
    });
    window.addEventListener("pageshow", function() {
        if (!document.body.classList.contains("is-booting")) pageReady();
    });
    var siteCursor = document.getElementById("siteCursor");
    if (siteCursor && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        var cursorInteractive = "a, button, [role='button'], #portfolioCanvas, .hero-proximity";
        window.addEventListener("pointermove", function(event) {
            if (event.pointerType === "touch") return;
            siteCursor.style.setProperty("--cx", event.clientX + "px");
            siteCursor.style.setProperty("--cy", event.clientY + "px");
            siteCursor.classList.add("is-visible");
            var target = event.target && event.target.closest ? event.target.closest(cursorInteractive) : null;
            siteCursor.classList.toggle("is-active", !!target);
        }, {
            passive: true
        });
        document.addEventListener("pointerdown", function(event) {
            if (event.pointerType !== "touch") siteCursor.classList.add("is-down");
        }, {
            passive: true
        });
        document.addEventListener("pointerup", function() {
            siteCursor.classList.remove("is-down");
        }, {
            passive: true
        });
        document.documentElement.addEventListener("mouseleave", function() {
            siteCursor.classList.remove("is-visible", "is-active", "is-down");
        });
    }
    var contactCount = 0;
    var websiteLink = document.querySelector('[data-contact="website"]');
    var emailLink = document.querySelector('[data-contact="email"]');
    var githubLink = document.querySelector('[data-contact="github"]');
    var discordButton = document.querySelector('[data-contact="discord"]');
    if (websiteLink && typeof config.website === "string" && config.website.trim()) {
        websiteLink.href = config.website.trim();
        websiteLink.hidden = false;
        contactCount++;
    }
    if (emailLink && typeof config.email === "string" && config.email.trim()) {
        var email = config.email.trim();
        emailLink.href = "mailto:" + email;
        emailLink.textContent = "email · " + email + " ↗";
        emailLink.hidden = false;
        contactCount++;
    }
    if (githubLink && typeof config.github === "string" && config.github.trim()) {
        githubLink.href = config.github.trim();
        githubLink.hidden = false;
        contactCount++;
    }
    if (discordButton && typeof config.discord === "string" && config.discord.trim()) {
        var discord = config.discord.trim();
        var discordLabel = "discord · " + discord;
        discordButton.textContent = discordLabel;
        discordButton.hidden = false;
        discordButton.addEventListener("click", function() {
            var copied = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(discord) : Promise.reject();
            copied.then(function() {
                discordButton.textContent = "copied · " + discord;
                setTimeout(function() {
                    discordButton.textContent = discordLabel;
                }, 1600);
            }, function() {
                window.prompt("Copy my Discord username:", discord);
            });
        });
        contactCount++;
    }
    var contactStatus = document.getElementById("contactStatus");
    if (contactStatus) contactStatus.hidden = contactCount > 0;
    var visitorCount = document.getElementById("visitorCount");
    var visitorNumber = document.getElementById("visitorNumber");
    function syncVisitorCount(attempt) {
        if (!visitorCount || !visitorNumber) return;
        var controller = typeof AbortController === "function" ? new AbortController() : null;
        var timeout = controller ? setTimeout(function() {
            controller.abort();
        }, 5e3) : null;
        fetch("/api/visit", {
            method: "POST",
            credentials: "same-origin",
            cache: "no-store",
            headers: {
                "Accept": "application/json"
            },
            signal: controller ? controller.signal : undefined
        }).then(function(response) {
            if (!response.ok) throw new Error("visitor counter unavailable");
            return response.json();
        }).then(function(data) {
            var total = Number(data && data.uniqueVisitors);
            if (!Number.isSafeInteger(total) || total < 0) throw new Error("invalid visitor count");
            visitorNumber.textContent = String(total);
            visitorCount.dataset.live = "true";
        }).catch(function() {
            if (attempt < 4) {
                setTimeout(function() {
                    syncVisitorCount(attempt + 1);
                }, Math.pow(2, attempt) * 700);
                return;
            }
            visitorNumber.textContent = "offline";
            visitorCount.title = "Visitor counter unavailable.";
        }).finally(function() {
            if (timeout) clearTimeout(timeout);
        });
    }
    syncVisitorCount(0);
    var SNOW = window.SNOW = {
        ready: false,
        _onReady: [],
        onReady: function(fn) {
            this.ready ? fn() : this._onReady.push(fn);
        },
        fireReady: function() {
            this.ready = true;
            this._onReady.splice(0).forEach(function(f) {
                f();
            });
        }
    };
    var boot = document.getElementById("boot");
    var fillEl = document.getElementById("bootFill");
    var pctEl = document.getElementById("bootPct");
    var pct = 0, targetPct = 0;
    var bootDone = false;
    function setPct(v) {
        pct = v;
        if (fillEl) fillEl.style.right = 100 - v + "%";
        if (pctEl) pctEl.textContent = String(Math.round(v)).padStart(3, "0");
    }
    function crawl() {
        targetPct = Math.min(96, targetPct + 6);
        if (targetPct < 96) setTimeout(crawl, reduce ? 30 : 90); else finishBoot();
    }
    function tickPct() {
        if (bootDone) return;
        setPct(pct + (targetPct - pct) * .14);
        requestAnimationFrame(tickPct);
    }
    function finishBoot() {
        var released = false;
        function release() {
            if (released) return;
            released = true;
            targetPct = 100;
            setPct(100);
            setTimeout(function() {
                bootDone = true;
                if (boot) boot.classList.add("is-done");
                document.body.classList.remove("is-booting");
                document.body.classList.add("is-lit");
                pageReady();
                if (window.location.hash) {
                    var hashTarget = document.querySelector(window.location.hash);
                    if (hashTarget) requestAnimationFrame(function() { hashTarget.scrollIntoView(); });
                }
            }, reduce ? 60 : 420);
        }
        SNOW.onReady(release);
        setTimeout(release, 9e3);
    }
    requestAnimationFrame(tickPct);
    setTimeout(crawl, reduce ? 0 : 200);
    var audio = document.getElementById("bgAudio");
    var btn = document.getElementById("soundToggle");
    var wanted = false, fadeTimer = null, audible = false;
    var VOL = .15;
    var AUDIO_START = audio ? Number(audio.dataset.start || 0) : 0;
    var AUDIO_END = audio ? Number(audio.dataset.end || 0) : 0;
    var AUDIO_POSITION_KEY = "snow_audio_position";
    var AUDIO_SHARED_KEY = "snow_audio_checkpoint";
    var pendingAudioPosition = null;
    try {
        var storedAudioPosition = Number(sessionStorage.getItem(AUDIO_POSITION_KEY));
        if (Number.isFinite(storedAudioPosition) && storedAudioPosition >= AUDIO_START && (!AUDIO_END || storedAudioPosition < AUDIO_END)) pendingAudioPosition = storedAudioPosition;
    } catch (e) {}
    function readSharedAudioPosition() {
        try {
            var checkpoint = JSON.parse(localStorage.getItem(AUDIO_SHARED_KEY) || "null");
            var fresh = checkpoint && Date.now() - Number(checkpoint.savedAt) < 3e5;
            var position = checkpoint && Number(checkpoint.position);
            if (fresh && Number.isFinite(position) && position >= AUDIO_START && (!AUDIO_END || position < AUDIO_END)) return position;
        } catch (e) {}
        return null;
    }
    var sharedAudioPosition = readSharedAudioPosition();
    if (sharedAudioPosition !== null) pendingAudioPosition = sharedAudioPosition;
    function restoreAudioPosition() {
        if (!audio || pendingAudioPosition === null) return false;
        try {
            audio.currentTime = pendingAudioPosition;
            pendingAudioPosition = null;
            return true;
        } catch (e) {
            return false;
        }
    }
    function persistAudioPosition() {
        if (!audio) return;
        var time = audio.currentTime;
        if (!Number.isFinite(time) || time < AUDIO_START || AUDIO_END && time >= AUDIO_END) return;
        try {
            sessionStorage.setItem(AUDIO_POSITION_KEY, time.toFixed(3));
            localStorage.setItem(AUDIO_SHARED_KEY, JSON.stringify({ position: Number(time.toFixed(3)), savedAt: Date.now() }));
        } catch (e) {}
    }
    function resetAudioSegment() {
        if (!audio) return;
        try { audio.currentTime = AUDIO_START; } catch (e) {}
    }
    function keepAudioInSegment() {
        if (!audio || !AUDIO_END) return;
        if (restoreAudioPosition()) return;
        if (audio.currentTime >= AUDIO_END || audio.currentTime < AUDIO_START - .25) {
            resetAudioSegment();
            if (wanted) {
                var replay = audio.play();
                if (replay && replay.catch) replay.catch(function() {});
            }
        }
    }
    if (audio) {
        audio.addEventListener("loadedmetadata", keepAudioInSegment);
        audio.addEventListener("timeupdate", function() {
            keepAudioInSegment();
            persistAudioPosition();
        });
        audio.addEventListener("ended", keepAudioInSegment);
    }
    window.addEventListener("pagehide", persistAudioPosition);
    window.addEventListener("pointerdown", persistAudioPosition, true);
    function fadeTo(target, done) {
        if (!audio) return;
        clearInterval(fadeTimer);
        var step = (target - audio.volume) / 22;
        fadeTimer = setInterval(function() {
            var v = audio.volume + step;
            if (step > 0 && v >= target || step < 0 && v <= target || step === 0) {
                audio.volume = Math.max(0, Math.min(1, target));
                clearInterval(fadeTimer);
                done && done();
            } else {
                audio.volume = Math.max(0, Math.min(1, v));
            }
        }, 40);
    }
    function reflect() {
        if (!btn) return;
        btn.setAttribute("aria-pressed", wanted ? "true" : "false");
        btn.textContent = wanted ? "music off" : "music on";
    }
    function rollSilently() {
        if (!audio) return;
        audio.muted = true;
        audio.volume = 0;
        keepAudioInSegment();
        var p = audio.play();
        if (p && p.catch) p.catch(function() {});
    }
    var inFlight = null;
    function goAudible() {
        if (!audio) return Promise.resolve(false);
        if (audible) return Promise.resolve(true);
        if (inFlight) return inFlight;
        var wasMuted = audio.muted;
        audio.muted = false;
        var restored = restoreAudioPosition();
        if (wasMuted && !restored && (audio.currentTime < AUDIO_START - .25 || AUDIO_END && audio.currentTime >= AUDIO_END)) resetAudioSegment();
        audio.volume = 0;
        var p;
        try {
            p = audio.play();
        } catch (e) {
            p = null;
        }
        var settle = function(ok) {
            inFlight = null;
            return ok;
        };
        var win = function() {
            audible = true;
            fadeTo(VOL);
            return settle(true);
        };
        var lose = function() {
            audio.muted = wasMuted;
            if (wasMuted && audio.paused) rollSilently();
            return settle(false);
        };
        if (!p || !p.then) return Promise.resolve(audio.paused ? lose() : win());
        inFlight = p.then(win, lose);
        return inFlight;
    }
    var ARM = [ "pointerdown", "pointerup", "click", "keydown", "touchstart", "touchend", "wheel", "scroll" ];
    var armed = false;
    function kick() {
        if (!wanted || audible) {
            disarm();
            return;
        }
        goAudible().then(function(ok) {
            if (ok) disarm();
        });
    }
    function arm() {
        if (armed || !audio) return;
        armed = true;
        ARM.forEach(function(t) {
            window.addEventListener(t, kick, {
                capture: true,
                passive: true
            });
        });
    }
    function disarm() {
        if (!armed) return;
        armed = false;
        ARM.forEach(function(t) {
            window.removeEventListener(t, kick, true);
        });
    }
    function setSound(on) {
        if (!audio) return;
        wanted = on;
        reflect();
        try {
            sessionStorage.setItem("snow_sound", on ? "1" : "0");
        } catch (e) {}
        if (on) {
            goAudible().then(function(ok) {
                if (!ok) {
                    rollSilently();
                    arm();
                }
            });
        } else {
            audible = false;
            disarm();
            persistAudioPosition();
            fadeTo(0, function() {
                audio.pause();
            });
        }
    }
    SNOW.sound = {
        toggle: function() {
            setSound(!wanted);
            return wanted;
        },
        changeVolume: function(delta) {
            VOL = Math.max(0, Math.min(1, VOL + delta));
            if (audio && wanted) {
                audio.muted = false;
                fadeTo(VOL);
            }
            return VOL;
        },
        isOn: function() {
            return wanted;
        },
        volume: function() {
            return VOL;
        }
    };
    if (btn) btn.addEventListener("click", function() {
        setSound(!wanted);
    });
    var firstInteractionPending = true;
    function stopFirstInteractionWatch() {
        if (!firstInteractionPending) return;
        firstInteractionPending = false;
        window.removeEventListener("click", enableSoundOnFirstInteraction);
        window.removeEventListener("keydown", enableSoundOnFirstInteraction);
    }
    function enableSoundOnFirstInteraction(event) {
        if (!firstInteractionPending) return;
        if (event.type === "keydown" && event.target && event.target.closest && event.target.closest("#soundToggle")) return;
        stopFirstInteractionWatch();
        if (!wanted) {
            setSound(true);
        } else if (!audible) {
            kick();
        }
    }
    window.addEventListener("click", enableSoundOnFirstInteraction);
    window.addEventListener("keydown", enableSoundOnFirstInteraction);
    document.addEventListener("visibilitychange", function() {
        if (!audio) return;
        if (document.hidden) {
            persistAudioPosition();
            audio.pause();
        } else if (wanted) {
            var latestPosition = readSharedAudioPosition();
            if (latestPosition !== null) {
                pendingAudioPosition = latestPosition;
                restoreAudioPosition();
            }
            var p = audio.play();
            if (p && p.catch) p.catch(function() {});
        }
    });
    var soundOnByDefault = true;
    try {
        if (sessionStorage.getItem("snow_sound") === "0") soundOnByDefault = false;
    } catch (e) {}
    if (audio && soundOnByDefault) {
        wanted = true;
        reflect();
        goAudible().then(function(ok) {
            if (ok) return;
            rollSilently();
            arm();
        });
    }
    var invBtn = document.getElementById("invertToggle");
    function setInvert(on) {
        document.body.classList.toggle("is-invert", on);
        if (invBtn) invBtn.setAttribute("aria-pressed", on ? "true" : "false");
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", on ? "#ffffff" : "#000000");
        if (SNOW.setScreenInvert) SNOW.setScreenInvert(on);
        if (typeof onScroll === "function") onScroll();
        try {
            localStorage.setItem("snow_invert", on ? "1" : "0");
        } catch (e) {}
    }
    if (invBtn) {
        invBtn.addEventListener("click", function() {
            setInvert(!document.body.classList.contains("is-invert"));
        });
    }
    setInvert(true);
    var backdrop = document.querySelector(".backdrop");
    var secs = [].slice.call(document.querySelectorAll(".sec"));
    var movers = [].slice.call(document.querySelectorAll(".el, .lay"));
    var DEPTH = {
        "el--star-a": .16,
        "el--star-b": -.13,
        "el--disc-a": .15,
        "el--disc-b": -.12,
        "lay--brand": -.05,
        "lay--abouth": -.04,
        "lay--bio": .035,
        "lay--visitors": .025,
        "lay--contact-note": .03
    };
    movers.forEach(function(m) {
        var d = 0;
        for (var k in DEPTH) if (m.classList.contains(k)) d = DEPTH[k];
        m.__d = d;
    });
    function toneOf(sec) {
        return sec.classList.contains("sec--dark") ? 1 : 0;
    }
    var ticking = false;
    function onScroll() {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(frame);
        }
    }
    function frame() {
        ticking = false;
        var vh = window.innerHeight;
        var mid = window.scrollY + vh * .5;
        if (backdrop && secs.length) {
            var band = vh * .6;
            var tone = toneOf(secs[secs.length - 1]);
            for (var i = 0; i < secs.length; i++) {
                var top = secs[i].offsetTop, bot = top + secs[i].offsetHeight;
                if (mid >= top && mid < bot) {
                    tone = toneOf(secs[i]);
                    if (i < secs.length - 1 && mid > bot - band) {
                        tone += (toneOf(secs[i + 1]) - tone) * ((mid - (bot - band)) / band);
                    } else if (i > 0 && mid < top + band) {
                        tone += (toneOf(secs[i - 1]) - tone) * (1 - (mid - top) / band);
                    }
                    break;
                }
            }
            var inv = document.body.classList.contains("is-invert");
            var v = Math.round((inv ? tone : 1 - tone) * 255);
            backdrop.style.backgroundColor = "rgb(" + v + "," + v + "," + v + ")";
        }
        for (var j = 0; j < movers.length; j++) {
            var m = movers[j];
            if (!m.__d) continue;
            var r = m.parentNode.getBoundingClientRect();
            if (r.bottom < -vh || r.top > vh * 2) continue;
            var p = (r.top + r.height / 2 - vh / 2) / vh;
            m.style.setProperty("--ty", (p * m.__d * vh).toFixed(1) + "px");
        }
    }
    window.addEventListener("scroll", onScroll, {
        passive: true
    });
    window.addEventListener("resize", onScroll, {
        passive: true
    });
    frame();
    if ("IntersectionObserver" in window && !reduce) {
        var lays = [].slice.call(document.querySelectorAll(".lay, .el, .archive__head, .archive__list > li, .showcase__hint, .showcase__stage, .rail, .keys"));
        lays.forEach(function(n) {
            n.classList.add("rev");
        });
        [].slice.call(document.querySelectorAll(".archive__list > li")).forEach(function(n, index) {
            n.style.setProperty("--rev-delay", index * 70 + "ms");
        });
        var ro = new IntersectionObserver(function(es) {
            es.forEach(function(e) {
                if (e.isIntersecting) {
                    e.target.classList.add("is-shown");
                    ro.unobserve(e.target);
                }
            });
        }, {
            threshold: 0,
            rootMargin: "0px 0px -6% 0px"
        });
        lays.forEach(function(n) {
            ro.observe(n);
        });
        var showIfNear = function() {
            var vh = window.innerHeight, live = 0;
            for (var z = 0; z < lays.length; z++) {
                var el = lays[z];
                if (el.classList.contains("is-shown")) continue;
                live++;
                var r = el.getBoundingClientRect();
                if (r.top < vh && r.bottom > 0) {
                    el.classList.add("is-shown");
                    ro.unobserve(el);
                }
            }
            if (!live && guard) {
                clearInterval(guard);
                guard = null;
            }
        };
        var guard = setInterval(showIfNear, 900);
        showIfNear();
        window.addEventListener("scroll", showIfNear, {
            passive: true
        });
        window.addEventListener("resize", showIfNear, {
            passive: true
        });
    }
    var smoothTarget = window.scrollY;
    var smoothPosition = window.scrollY;
    var smoothFrame = 0;
    var smoothStamp = 0;
    function maxScrollY() {
        return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }
    function clampScrollY(value) {
        return Math.max(0, Math.min(maxScrollY(), value));
    }
    function glide(timestamp) {
        var elapsed = smoothStamp ? Math.min(48, timestamp - smoothStamp) : 16.667;
        smoothStamp = timestamp;
        var pull = 1 - Math.pow(.93, elapsed / 16.667);
        smoothPosition += (smoothTarget - smoothPosition) * pull;
        if (Math.abs(smoothTarget - smoothPosition) < .35) {
            smoothPosition = smoothTarget;
            window.scrollTo(0, smoothPosition);
            smoothFrame = 0;
            smoothStamp = 0;
            return;
        }
        window.scrollTo(0, smoothPosition);
        smoothFrame = requestAnimationFrame(glide);
    }
    function smoothScrollTo(value) {
        if (reduce) {
            window.scrollTo(0, value);
            return;
        }
        if (!smoothFrame) smoothPosition = window.scrollY;
        smoothTarget = clampScrollY(value);
        if (!smoothFrame) smoothFrame = requestAnimationFrame(glide);
    }
    function canScrollInside(target, delta) {
        var node = target && target.nodeType === 1 ? target : null;
        while (node && node !== document.body) {
            var style = window.getComputedStyle(node);
            if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
                if (delta < 0 && node.scrollTop > 0 || delta > 0 && node.scrollTop + node.clientHeight < node.scrollHeight) return true;
            }
            node = node.parentElement;
        }
        return false;
    }
    if (!reduce) {
        document.documentElement.style.scrollBehavior = "auto";
        window.addEventListener("wheel", function(event) {
            if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || canScrollInside(event.target, event.deltaY)) return;
            event.preventDefault();
            var delta = event.deltaY;
            if (event.deltaMode === 1) delta *= 16;
            if (event.deltaMode === 2) delta *= window.innerHeight;
            delta = Math.max(-window.innerHeight * .9, Math.min(window.innerHeight * .9, delta));
            if (!smoothFrame) {
                smoothPosition = window.scrollY;
                smoothTarget = smoothPosition;
            }
            smoothTarget = clampScrollY(smoothTarget + delta);
            if (!smoothFrame) smoothFrame = requestAnimationFrame(glide);
        }, {
            passive: false
        });
        window.addEventListener("scroll", function() {
            if (smoothFrame) return;
            smoothPosition = window.scrollY;
            smoothTarget = smoothPosition;
        }, {
            passive: true
        });
    }
    document.querySelectorAll("[data-nav]").forEach(function(a) {
        a.addEventListener("click", function(e) {
            var id = a.getAttribute("href");
            if (!id || id.charAt(0) !== "#") return;
            var t = document.querySelector(id);
            if (!t) return;
            e.preventDefault();
            smoothScrollTo(t.getBoundingClientRect().top + window.scrollY);
        });
    });
    if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function(entries) {
            entries.forEach(function(en) {
                if (en.isIntersecting) {
                    en.target.classList.add("is-in");
                    io.unobserve(en.target);
                }
            });
        }, {
            threshold: .18
        });
        document.querySelectorAll(".about, .contact").forEach(function(el) {
            io.observe(el);
        });
    }
    document.addEventListener("contextmenu", function(event) {
        event.preventDefault();
    }, true);
    document.addEventListener("keydown", function(event) {
        var key = String(event.key || "").toLowerCase();
        var command = event.ctrlKey || event.metaKey;
        var devtoolsChord = command && (event.shiftKey || event.altKey) && (key === "i" || key === "j" || key === "c" || key === "k");
        var pageSourceChord = command && (key === "u" || key === "s");
        var functionKey = key === "f12" || event.keyCode === 123;
        if (!devtoolsChord && !pageSourceChord && !functionKey) return;
        event.preventDefault();
        event.stopImmediatePropagation();
    }, true);
    document.addEventListener("dragstart", function(event) {
        if (event.target && event.target.closest("img, video, canvas")) event.preventDefault();
    }, true);
})();
