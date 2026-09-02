(function() {
    "use strict";
    var C = window.SNOW_CONTOURS;
    if (!C || !document.querySelector(".stage")) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var DPR = Math.min(2, window.devicePixelRatio || 1);
    var TAU = Math.PI * 2;
    function rnd(seed) {
        var s = seed * 9301 + 49297;
        return function() {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
    }
    function stableNoise(seed) {
        var value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
        return value - Math.floor(value);
    }
    function Overlay(stage, idx) {
        this.stage = stage;
        this.cv = document.createElement("canvas");
        this.cv.className = "trk";
        this.cv.setAttribute("aria-hidden", "true");
        stage.insertBefore(this.cv, stage.firstChild);
        this.ctx = this.cv.getContext("2d");
        this.on = false;
        this.w = this.h = 0;
        this.marks = [];
        var self = this;
        [].slice.call(stage.querySelectorAll(".el")).forEach(function(el) {
            var m = /([a-z0-9-]+)\.png$/i.exec(el.getAttribute("src") || "");
            var blobs = m && C[m[1]];
            if (!blobs || !blobs.length) return;
            self.marks.push({
                el: el,
                name: m[1],
                blobs: blobs,
                id: "SNW_" + String(self.marks.length + 1 + idx * 3).padStart(2, "0"),
                seed: rnd(m[1].length * 37 + idx * 11 + self.marks.length)
            });
        });
        this.lays = [].slice.call(stage.querySelectorAll(".lay"));
        var r = rnd(idx * 977 + 13);
        this.nodes = [];
        for (var i = 0; i < 11; i++) {
            this.nodes.push({
                a: r() * TAU,
                av: (r() - .5) * .016,
                rx: .4 + r() * .13,
                ry: .36 + r() * .14,
                wob: .012 + r() * .018,
                wp: r() * TAU,
                wv: .1 + r() * .18,
                s: .6 + r() * .5
            });
        }
    }
    Overlay.prototype.resize = function() {
        var w = this.stage.offsetWidth, h = this.stage.offsetHeight;
        if (!w || !h) return false;
        if (w === this.w && h === this.h) return true;
        this.w = w;
        this.h = h;
        this.cv.width = Math.round(w * DPR);
        this.cv.height = Math.round(h * DPR);
        return true;
    };
    function boxOf(el) {
        var x = el.offsetLeft, y = el.offsetTop, w = el.offsetWidth, h = el.offsetHeight;
        var t = getComputedStyle(el).transform, M = null;
        if (t && t !== "none") {
            try {
                M = new DOMMatrix(t);
            } catch (e) {
                M = null;
            }
        }
        return {
            x: x,
            y: y,
            w: w,
            h: h,
            cx: x + w / 2,
            cy: y + h / 2,
            M: M
        };
    }
    function mapPt(b, u, v) {
        var px = b.x + u * b.w, py = b.y + v * b.h;
        if (!b.M) return [ px, py ];
        var dx = px - b.cx, dy = py - b.cy;
        return [
            b.cx + b.M.a * dx + b.M.c * dy + b.M.e,
            b.cy + b.M.b * dx + b.M.d * dy + b.M.f
        ];
    }
    Overlay.prototype.draw = function(t) {
        if (!this.resize()) return;
        var ctx = this.ctx, w = this.w, h = this.h;
        var cs = getComputedStyle(this.stage);
        var ink = cs.getPropertyValue("--trk").trim() || "rgba(255,255,255,.26)";
        var hi = cs.getPropertyValue("--trk-hi").trim() || "rgba(255,255,255,.46)";
        var unit = Math.min(w, h);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.clearRect(0, 0, w, h);
        var keep = new Path2D;
        keep.rect(0, 0, w, h);
        for (var i = 0; i < this.lays.length; i++) {
            var b = boxOf(this.lays[i]);
            var pad = Math.max(10, unit * .018);
            keep.rect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2);
        }
        ctx.save();
        ctx.clip(keep, "evenodd");
        ctx.lineWidth = 1;
        ctx.strokeStyle = ink;
        ctx.fillStyle = ink;
        ctx.lineJoin = "round";
        var fs = Math.max(8, Math.round(unit * .0105));
        ctx.font = fs + "px 'VCR', ui-monospace, monospace";
        if ("letterSpacing" in ctx) ctx.letterSpacing = "0.10em";
        ctx.textBaseline = "alphabetic";
        this.drawMarks(ctx, t, ink, hi, unit, fs);
        this.drawNodes(ctx, t, ink, hi, w, h, unit);
        ctx.restore();
    };
    Overlay.prototype.drawMarks = function(ctx, t, ink, hi, unit, fs) {
        var brk = unit * .022;
        var nodeR = Math.max(1.6, unit * .0026);
        for (var i = 0; i < this.marks.length; i++) {
            var mk = this.marks[i];
            if (mk.el.classList.contains("rev") && !mk.el.classList.contains("is-shown")) continue;
            var b = boxOf(mk.el);
            if (!b.w) continue;
            var jx = Math.sin(t * .0011 + i * 2.1) * .34;
            var jy = Math.cos(t * 9e-4 + i * 1.3) * .34;
            for (var k = 0; k < mk.blobs.length; k++) {
                var blob = mk.blobs[k], p = blob.p, n = p.length;
                ctx.save();
                ctx.strokeStyle = ink;
                ctx.setLineDash([ unit * .008, unit * .011 ]);
                ctx.lineDashOffset = -(t * .014) % 1e6;
                ctx.beginPath();
                for (var j = 0; j < n; j++) {
                    var q = mapPt(b, p[j][0], p[j][1]);
                    if (j) ctx.lineTo(q[0] + jx, q[1] + jy); else ctx.moveTo(q[0] + jx, q[1] + jy);
                }
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
                ctx.save();
                ctx.strokeStyle = hi;
                for (var v = 0; v < n; v += 2) {
                    var pt = mapPt(b, p[v][0], p[v][1]);
                    ctx.strokeRect(Math.round(pt[0] + jx - nodeR) + .5, Math.round(pt[1] + jy - nodeR) + .5, nodeR * 2, nodeR * 2);
                }
                ctx.restore();
                var c0 = mapPt(b, blob.b[0], blob.b[1]);
                var c1 = mapPt(b, blob.b[0] + blob.b[2], blob.b[1]);
                var c2 = mapPt(b, blob.b[0] + blob.b[2], blob.b[1] + blob.b[3]);
                var c3 = mapPt(b, blob.b[0], blob.b[1] + blob.b[3]);
                var corners = [ c0, c1, c2, c3 ];
                ctx.save();
                ctx.strokeStyle = ink;
                ctx.beginPath();
                for (var ci = 0; ci < 4; ci++) {
                    var cur = corners[ci];
                    var prev = corners[(ci + 3) % 4], next = corners[(ci + 1) % 4];
                    var asymSeed = (i + 1) * 101 + (k + 1) * 37 + (ci + 1) * 17;
                    var cornerX = jx + (stableNoise(asymSeed) - .5) * unit * .006;
                    var cornerY = jy + (stableNoise(asymSeed + 1) - .5) * unit * .006;
                    var prevLen = brk * (.48 + stableNoise(asymSeed + 2) * 1.08);
                    var nextLen = brk * (.48 + stableNoise(asymSeed + 3) * 1.08);
                    var omitPrev = stableNoise(asymSeed + 4) < .16;
                    var omitNext = stableNoise(asymSeed + 5) < .16;
                    if (!omitPrev || omitNext) arm(ctx, cur, prev, prevLen, cornerX, cornerY);
                    if (!omitNext) arm(ctx, cur, next, nextLen, cornerX, cornerY);
                }
                ctx.stroke();
                ctx.restore();
                if (k === 0) {
                    var conf = (.938 + .058 * (.5 + .5 * Math.sin(t * 42e-5 + i * 3.7))).toFixed(3);
                    var lx = Math.min(c0[0], c3[0]) + jx, ly = Math.min(c0[1], c1[1]) + jy - fs * .62;
                    ctx.save();
                    ctx.fillStyle = hi;
                    ctx.fillText(mk.id, lx, ly);
                    ctx.fillStyle = ink;
                    ctx.fillText(conf, lx + ctx.measureText(mk.id).width + fs * .7, ly);
                    ctx.restore();
                }
            }
        }
    };
    function arm(ctx, from, to, len, jx, jy) {
        var dx = to[0] - from[0], dy = to[1] - from[1];
        var d = Math.hypot(dx, dy) || 1;
        var l = Math.min(len, d * .34);
        ctx.moveTo(from[0] + jx, from[1] + jy);
        ctx.lineTo(from[0] + jx + dx / d * l, from[1] + jy + dy / d * l);
    }
    Overlay.prototype.drawNodes = function(ctx, t, ink, hi, w, h, unit) {
        var pts = [], i;
        for (i = 0; i < this.nodes.length; i++) {
            var nd = this.nodes[i];
            var a = nd.a + nd.av * t * .001;
            var wob = 1 + Math.sin(nd.wp + t * .001 * nd.wv) * nd.wob;
            pts.push([ w * .5 + Math.cos(a) * nd.rx * wob * w, h * .5 + Math.sin(a) * nd.ry * wob * h, nd.s ]);
        }
        var maxD = unit * .3;
        ctx.save();
        ctx.lineWidth = 1;
        for (i = 0; i < pts.length; i++) {
            for (var j = i + 1; j < pts.length; j++) {
                var d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
                if (d > maxD) continue;
                ctx.globalAlpha = .55 * (1 - d / maxD);
                ctx.strokeStyle = ink;
                ctx.beginPath();
                ctx.moveTo(pts[i][0], pts[i][1]);
                ctx.lineTo(pts[j][0], pts[j][1]);
                ctx.stroke();
            }
        }
        ctx.restore();
        ctx.save();
        ctx.lineWidth = 1;
        for (i = 0; i < pts.length; i++) {
            var x = Math.round(pts[i][0]) + .5, y = Math.round(pts[i][1]) + .5;
            var r = Math.max(4, unit * .0062) * pts[i][2];
            var pulse = 1 + Math.sin(t * .0012 + i * 1.7) * .06;
            r *= pulse;
            ctx.strokeStyle = i % 3 === 0 ? hi : ink;
            ctx.beginPath();
            ctx.moveTo(x, y + r * .78);
            ctx.bezierCurveTo(x - r * 1.35, y - r * .04, x - r * .92, y - r * 1.08, x, y - r * .42);
            ctx.bezierCurveTo(x + r * .92, y - r * 1.08, x + r * 1.35, y - r * .04, x, y + r * .78);
            ctx.closePath();
            ctx.stroke();
        }
        ctx.restore();
    };
    var overlays = [].slice.call(document.querySelectorAll(".stage")).map(function(s, i) {
        return new Overlay(s, i);
    });
    if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function(es) {
            es.forEach(function(e) {
                var o = e.target.__trk;
                if (!o) return;
                o.on = e.isIntersecting;
                if (e.isIntersecting) o.cv.classList.add("is-on");
            });
        }, {
            rootMargin: "10% 0px"
        });
        overlays.forEach(function(o) {
            o.stage.__trk = o;
            io.observe(o.stage);
        });
    } else {
        overlays.forEach(function(o) {
            o.on = true;
            o.cv.classList.add("is-on");
        });
    }
    function tick(t) {
        for (var i = 0; i < overlays.length; i++) if (overlays[i].on) overlays[i].draw(t);
        updateContactConfidence(t);
        requestAnimationFrame(tick);
    }
    var contactConfidence = document.querySelector("[data-contact-confidence]");
    function updateContactConfidence(t) {
        if (!contactConfidence) return;
        contactConfidence.textContent = (.938 + .058 * (.5 + .5 * Math.sin(t * 42e-5 + 9 * 3.7))).toFixed(3);
    }
    function start() {
        if (reduce) {
            var paint = function() {
                overlays.forEach(function(o) {
                    o.on = true;
                    o.cv.classList.add("is-on");
                    o.draw(0);
                });
                updateContactConfidence(0);
            };
            paint();
            window.addEventListener("resize", paint, {
                passive: true
            });
            window.addEventListener("scroll", paint, {
                passive: true
            });
            return;
        }
        requestAnimationFrame(tick);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start, start); else start();
})();
