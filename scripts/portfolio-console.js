import * as THREE from "three";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";

import { RenderPass } from "three/addons/postprocessing/RenderPass.js";

import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const PROJECTS = window.SNOW_PROJECTS || [];

const SNOW = window.SNOW || {
    fireReady() {},
    onReady(f) {
        f();
    }
};

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const canvas = document.getElementById("portfolioCanvas");

const stage = document.querySelector(".showcase__stage");

const loadingEl = document.getElementById("consoleLoading");

const railIdx = document.getElementById("railIdx");

const railTot = document.getElementById("railTot");

const railOpen = document.getElementById("railOpen");

const railEl = document.getElementById("rail");

const prevProject = document.getElementById("prevProject");

const nextProject = document.getElementById("nextProject");

const openProject = document.getElementById("openProject");

if (canvas && PROJECTS.length) init();

function init() {
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0, 0);
    const scene = new THREE.Scene;
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 400);
    camera.position.set(0, 0, 30);
    const root = new THREE.Group;
    const model = new THREE.Group;
    root.add(model);
    scene.add(root);
    const hemi = new THREE.HemisphereLight(16777215, 1907997, .76);
    scene.add(hemi);
    const keyLight = new THREE.DirectionalLight(16777215, 1.08);
    keyLight.position.set(-8, 9, 12);
    scene.add(keyLight);
    const rimIce = new THREE.DirectionalLight(16777215, 1.72);
    rimIce.position.set(11, 4, -9);
    scene.add(rimIce);
    const rimHot = new THREE.DirectionalLight(16777215, .92);
    rimHot.position.set(-12, -5, -7);
    scene.add(rimHot);
    const spillA = new THREE.PointLight(16777215, 0, 26, 2);
    const spillB = new THREE.PointLight(16777215, 0, 20, 2);
    const spillC = new THREE.PointLight(16777215, 0, 20, 2);
    scene.add(spillA, spillB, spillC);
    const pressLight = new THREE.PointLight(16777215, 0, 9, 2);
    scene.add(pressLight);
    let pressLightLife = 0;
    const SW = 1440, SH = 816;
    const sc = document.createElement("canvas");
    sc.width = SW;
    sc.height = SH;
    const sctx = sc.getContext("2d", {
        willReadFrequently: false
    });
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = "high";
    sctx.fillStyle = "#080808";
    sctx.fillRect(0, 0, SW, SH);
    const screenTex = new THREE.CanvasTexture(sc);
    screenTex.colorSpace = THREE.SRGBColorSpace;
    screenTex.minFilter = THREE.LinearFilter;
    screenTex.magFilter = THREE.LinearFilter;
    screenTex.generateMipmaps = false;
    screenTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const crtMat = new THREE.ShaderMaterial({
        uniforms: {
            uTex: {
                value: screenTex
            },
            uTime: {
                value: 0
            },
            uPower: {
                value: 0
            },
            uShutdown: {
                value: 0
            },
            uWarp: {
                value: 0
            },
            uGrid: {
                value: new THREE.Vector2(1200, 680)
            },
            uBright: {
                value: .92
            },
            uInvert: {
                value: document.body.classList.contains("is-invert") ? 0 : 1
            }
        },
        transparent: false,
        toneMapped: false,
        vertexShader: `\n      varying vec2 vUv;\n      void main(){\n        vUv = uv;\n        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);\n      }`,
        fragmentShader: `\n      precision highp float;\n      uniform sampler2D uTex;\n      uniform float uTime, uPower, uWarp, uBright, uInvert;\n      uniform vec2 uGrid;\n      varying vec2 vUv;\n\n      float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }\n\n      void main(){\n        vec2 uv = vUv;\n\n        vec2 c = uv - 0.5;\n        float r2 = dot(c, c);\n        uv = 0.5 + c * (1.0 + 0.012 * r2);\n\n        float band = step(0.5, hash(vec2(floor(uv.y * 26.0), floor(uTime * 22.0))));\n        uv.x += uWarp * (band - 0.5) * 0.09;\n\n        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {\n          gl_FragColor = vec4(0.008, 0.008, 0.008, 1.0);\n          return;\n        }\n\n        vec2 g = uGrid;\n        vec2 quv = (floor(uv * g) + 0.5) / g;\n\n        vec3 sampled = texture2D(uTex, quv).rgb;\n        float mono = dot(sampled, vec3(0.299, 0.587, 0.114));\n        \n        \n        vec3 col = mix(vec3(mono), sampled, 1.0);\n        col = (col - 0.5) * 1.06 + 0.5;\n\n        \n        \n        \n\n        float scan = 0.985 + 0.015 * cos(uv.y * g.y * 6.28318);\n        col *= scan;\n\n        col += vec3(0.065) * pow(1.0 - uv.y, 3.0) * 0.32;\n        col *= 1.0 - 0.22 * pow(r2 * 1.55, 1.6);\n\n        col += (hash(quv * 620.0) - 0.5) * 0.003;\n        col = mix(col, vec3(1.0) - col, uInvert);\n\n        float open = smoothstep(0.0, 1.0, uPower);\n        float slit = smoothstep(open * 0.62 + 0.002, 0.0, abs(uv.y - 0.5));\n        col = mix(vec3(0.92) * slit * 2.4, col, open);\n        col *= open;\n\n        gl_FragColor = vec4(col * uBright, 1.0);\n      }`
    });
    crtMat.fragmentShader = crtMat.fragmentShader.replace("uniform float uTime, uPower, uWarp, uBright, uInvert;", "uniform float uTime, uPower, uShutdown, uWarp, uBright, uInvert;").replace("vec2 g = uGrid;", `float shutdown = clamp(uShutdown, 0.0, 1.0);
        float collapse = max(0.002, 1.0 - smoothstep(0.0, 0.58, shutdown));
        vec2 sampleUv = vec2(uv.x, 0.5 + (uv.y - 0.5) / collapse);
        float pictureBand = 1.0 - step(collapse * 0.5, abs(uv.y - 0.5));

        vec2 g = uGrid;`).replace("vec2 quv = (floor(uv * g) + 0.5) / g;", "vec2 quv = (floor(sampleUv * g) + 0.5) / g;").replace("float scan = 0.985 + 0.015 * cos(uv.y * g.y * 6.28318);", "float scan = 0.985 + 0.015 * cos(sampleUv.y * g.y * 6.28318);").replace("col += (hash(quv * 620.0) - 0.5) * 0.003;", `col += (hash(quv * 620.0) - 0.5) * 0.003;
        col *= pictureBand;

        float beamIn = smoothstep(0.16, 0.52, shutdown);
        float beamOut = 1.0 - smoothstep(0.84, 1.0, shutdown);
        float beamWidth = mix(0.026, 0.003, smoothstep(0.18, 0.82, shutdown));
        float beam = 1.0 - smoothstep(beamWidth, beamWidth * 3.2, abs(uv.y - 0.5));
        float beamSpan = max(0.008, (1.0 - smoothstep(0.68, 0.94, shutdown)) * 0.5);
        float beamEnds = 1.0 - smoothstep(beamSpan, beamSpan + 0.025, abs(uv.x - 0.5));
        col += vec3(0.94) * beam * beamEnds * beamIn * beamOut * 2.8;

        float dotLife = smoothstep(0.76, 0.90, shutdown) * (1.0 - smoothstep(0.94, 1.0, shutdown));
        float dot = 1.0 - smoothstep(0.003, 0.025, length((uv - 0.5) * vec2(1.0, 1.8)));
        col += vec3(1.0) * dot * dotLife * 4.0;
        col *= 1.0 - smoothstep(0.97, 1.0, shutdown);`);
    let screenMesh = null;
    const buttons = {};
    const pressable = [];
    let modelReady = false;
    function tintable(m) {
        m.onBeforeCompile = shader => {
            shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\n  float shellGray = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));\n  diffuseColor.rgb = vec3(shellGray);");
        };
        return m;
    }
    SNOW.setScreenInvert = function(on) {
        crtMat.uniforms.uInvert.value = on ? 0 : 1;
        keyLight.visible = rimIce.visible = rimHot.visible = true;
        hemi.intensity = .72;
        bloom.strength = .24;
    };
    (new GLTFLoader).load("assets/3d/handheld-console.glb", gltf => {
        setup(gltf.scene);
    }, undefined, err => {
        console.error("[snow-console] model failed", err);
        if (loadingEl) loadingEl.textContent = "HARDWARE UNAVAILABLE";
        SNOW.fireReady();
    });
    function setup(src) {
        model.add(src);
        src.updateWorldMatrix(true, true);
        const parts = {};
        const bin = [];
        src.traverse(o => {
            if (!o.isMesh) return;
            o.frustumCulled = false;
            const n = o.name.toLowerCase();
            if (n.indexOf("ground") === 0) {
                bin.push(o);
                return;
            }
            if (n.indexOf("screen") === 0) screenMesh = o;
            const m = n.match(/^button(\d+)/);
            if (m) parts["b" + m[1]] = o;
            if (o.material) {
                o.material = o.material.clone();
                tintable(o.material);
                o.material.envMapIntensity = 1.25;
                if (o.material.metalness !== undefined) {
                    o.material.metalness = Math.min(1, (o.material.metalness ?? .5) * .9 + .18);
                    o.material.roughness = Math.max(.12, (o.material.roughness ?? .5) * .82);
                }
            }
        });
        bin.forEach(o => {
            o.parent && o.parent.remove(o);
        });
        if (!screenMesh) {
            console.warn("[snow-console] no screen mesh");
            SNOW.fireReady();
            return;
        }
        const nrm = largestFaceNormal(screenMesh);
        const centreOf = o => (new THREE.Box3).setFromObject(o).getCenter(new THREE.Vector3);
        const centre = centreOf(src);
        const sCentre = centreOf(screenMesh);
        if (nrm.dot(sCentre.clone().sub(centre)) < 0) nrm.negate();
        const rowKeys = [ "b9", "b10", "b11", "b12", "b13", "b14", "b15" ];
        const row = new THREE.Vector3;
        let rowN = 0;
        rowKeys.forEach(k => {
            if (parts[k]) {
                row.add(centreOf(parts[k]));
                rowN++;
            }
        });
        let up;
        if (rowN) {
            row.divideScalar(rowN);
            const down = row.sub(sCentre).projectOnPlane(nrm).normalize();
            up = down.negate();
        } else {
            up = new THREE.Vector3(0, 1, 0).projectOnPlane(nrm).normalize();
        }
        const right = (new THREE.Vector3).crossVectors(up, nrm).normalize();
        up.crossVectors(nrm, right).normalize();
        const basis = (new THREE.Matrix4).makeBasis(right, up, nrm);
        model.quaternion.setFromRotationMatrix(basis).invert();
        model.updateWorldMatrix(true, true);
        const size = (new THREE.Box3).setFromObject(model).getSize(new THREE.Vector3);
        model.scale.setScalar(10 / Math.max(size.x, size.y, size.z));
        model.updateWorldMatrix(true, true);
        model.position.sub((new THREE.Box3).setFromObject(model).getCenter(new THREE.Vector3));
        model.updateWorldMatrix(true, true);
        fitToView();
        const sNrm = largestFaceNormal(screenMesh);
        if (sNrm.z < 0) sNrm.negate();
        buildScreenUVs(screenMesh, sNrm, new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0));
        screenMesh.material = crtMat;
        screenMesh.renderOrder = 2;
        mapButton("up", parts.b1);
        mapButton("right", parts.b2);
        mapButton("down", parts.b3);
        mapButton("left", parts.b4);
        mapButton("triangle", parts.b5);
        mapButton("circle", parts.b6);
        mapButton("cross", parts.b7);
        mapButton("square", parts.b8);
        mapButton("home", parts.b9);
        mapButton("volumeDown", parts.b10);
        mapButton("volumeUp", parts.b11);
        mapButton("music", parts.b13);
        mapButton("select", parts.b14);
        mapButton("start", parts.b15);
        function mapButton(role, mesh) {
            if (!mesh) return;
            const parent = mesh.parent || model;
            const pq = new THREE.Quaternion;
            parent.getWorldQuaternion(pq);
            const ps = new THREE.Vector3;
            parent.getWorldScale(ps);
            const axis = new THREE.Vector3(0, 0, 1).applyQuaternion(pq.invert());
            axis.set(axis.x / (ps.x || 1), axis.y / (ps.y || 1), axis.z / (ps.z || 1));
            buttons[role] = {
                role: role,
                mesh: mesh,
                home: mesh.position.clone(),
                axis: axis,
                t: 0
            };
            if ([ "up", "right", "down", "left", "cross", "circle", "triangle", "square", "start", "select", "home", "volumeDown", "volumeUp", "music", "power" ].indexOf(role) > -1) {
                mesh.userData.role = role;
                pressable.push(mesh);
            }
        }
        const consoleBox = (new THREE.Box3).setFromObject(model);
        const consoleSize = consoleBox.getSize(new THREE.Vector3);
        const powerHit = new THREE.Mesh(new THREE.PlaneGeometry(consoleSize.x * .18, consoleSize.y * .18), new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
            side: THREE.DoubleSide
        }));
        powerHit.position.set(consoleBox.min.x + consoleSize.x * .90, consoleBox.min.y + consoleSize.y * .22, consoleBox.max.z + .12);
        root.add(powerHit);
        mapButton("power", powerHit);
        const sb = (new THREE.Box3).setFromObject(screenMesh);
        const sc2 = sb.getCenter(new THREE.Vector3);
        const halfW = (sb.max.x - sb.min.x) / 2;
        spillA.position.set(sc2.x, sc2.y, sc2.z + 2.2);
        spillB.position.set(sc2.x - halfW * 1.5, sc2.y, sc2.z + 1.5);
        spillC.position.set(sc2.x + halfW * 1.5, sc2.y, sc2.z + 1.5);
        if (screenMesh) screenMesh.userData.role = "screen";
        pressable.push(screenMesh);
        modelReady = true;
        if (loadingEl) loadingEl.classList.add("is-off");
        SNOW.fireReady();
        select(0, true);
        setTimeout(() => powerOn(), reduce ? 0 : 260);
    }
    function largestFaceNormal(mesh) {
        const geo = mesh.geometry;
        const pos = geo.getAttribute("position");
        const idx = geo.getIndex();
        const count = idx ? idx.count : pos.count;
        const a = new THREE.Vector3, b = new THREE.Vector3, c = new THREE.Vector3;
        const ab = new THREE.Vector3, ac = new THREE.Vector3, cr = new THREE.Vector3;
        let best = -1;
        const out = new THREE.Vector3(0, 0, 1);
        for (let i = 0; i < count; i += 3) {
            const i0 = idx ? idx.getX(i) : i;
            const i1 = idx ? idx.getX(i + 1) : i + 1;
            const i2 = idx ? idx.getX(i + 2) : i + 2;
            a.fromBufferAttribute(pos, i0);
            b.fromBufferAttribute(pos, i1);
            c.fromBufferAttribute(pos, i2);
            ab.subVectors(b, a);
            ac.subVectors(c, a);
            cr.crossVectors(ab, ac);
            const area = cr.lengthSq();
            if (area > best) {
                best = area;
                out.copy(cr).normalize();
            }
        }
        return out.applyMatrix3((new THREE.Matrix3).getNormalMatrix(mesh.matrixWorld)).normalize();
    }
    function buildScreenUVs(mesh, nrm, right, up) {
        const geo = mesh.geometry;
        const p = geo.getAttribute("position");
        const mw = mesh.matrixWorld;
        const wp = [];
        const v = new THREE.Vector3;
        for (let i = 0; i < p.count; i++) {
            v.fromBufferAttribute(p, i).applyMatrix4(mw);
            wp.push(v.clone());
        }
        const e1 = right.clone().projectOnPlane(nrm).normalize();
        const e2 = (new THREE.Vector3).crossVectors(nrm, e1).normalize();
        const a = [], b = [];
        let ma = 0, mb = 0;
        for (let i = 0; i < wp.length; i++) {
            const x = wp[i].dot(e1), y = wp[i].dot(e2);
            a.push(x);
            b.push(y);
            ma += x;
            mb += y;
        }
        ma /= a.length;
        mb /= b.length;
        let Saa = 0, Sbb = 0, Sab = 0;
        for (let i = 0; i < a.length; i++) {
            const da = a[i] - ma, db = b[i] - mb;
            Saa += da * da;
            Sbb += db * db;
            Sab += da * db;
        }
        const th = .5 * Math.atan2(2 * Sab, Saa - Sbb);
        const cs = Math.cos(th), sn = Math.sin(th);
        const U = e1.clone().multiplyScalar(cs).addScaledVector(e2, sn).normalize();
        const V = e1.clone().multiplyScalar(-sn).addScaledVector(e2, cs).normalize();
        if (U.dot(right) < 0) U.negate();
        if (V.dot(up) < 0) V.negate();
        let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
        const us = [], vs = [];
        for (let i = 0; i < wp.length; i++) {
            const u = wp[i].dot(U), w = wp[i].dot(V);
            us.push(u);
            vs.push(w);
            if (u < minU) minU = u;
            if (u > maxU) maxU = u;
            if (w < minV) minV = w;
            if (w > maxV) maxV = w;
        }
        const du = maxU - minU || 1, dv = maxV - minV || 1;
        const uv = new Float32Array(p.count * 2);
        for (let i = 0; i < p.count; i++) {
            uv[i * 2] = (us[i] - minU) / du;
            uv[i * 2 + 1] = (vs[i] - minV) / dv;
        }
        geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    }
    const cache = new Map;
    function getImage(src) {
        if (!src) return Promise.resolve(null);
        if (cache.has(src)) return cache.get(src);
        const p = new Promise(res => {
            const im = new Image;
            im.onload = () => res(im);
            im.onerror = () => res(null);
            im.src = src;
        });
        cache.set(src, p);
        return p;
    }
    const vcache = new Map;
    function getVideo(src) {
        if (!src) return Promise.resolve(null);
        if (vcache.has(src)) return vcache.get(src);
        const p = new Promise(res => {
            const v = document.createElement("video");
            v.src = src;
            v.muted = true;
            v.defaultMuted = true;
            v.volume = 0;
            v.loop = true;
            v.playsInline = true;
            v.autoplay = false;
            v.preload = "auto";
            v.setAttribute("muted", "");
            v.setAttribute("playsinline", "");
            let done = false;
            const ok = () => {
                if (done) return;
                done = true;
                res(v);
            };
            v.addEventListener("canplaythrough", ok, {
                once: true
            });
            v.addEventListener("canplay", ok, {
                once: true
            });
            v.addEventListener("error", () => {
                if (!done) {
                    done = true;
                    res(null);
                }
            }, {
                once: true
            });
            v.load();
        });
        vcache.set(src, p);
        return p;
    }
    let current = 0;
    let powered = false;
    let powerT = 0, powerTarget = 0, warpT = 0;
    let shutdownT = 0, shuttingDown = false;
    let live = null;
    const srcW = s => s && (s.videoWidth || s.width) || 0;
    const srcH = s => s && (s.videoHeight || s.height) || 0;
    const bg = document.createElement("canvas");
    bg.width = SW;
    bg.height = SH;
    const bgctx = bg.getContext("2d");
    function paintBackdrop(img, work) {
        bgctx.setTransform(1, 0, 0, 1, 0, 0);
        bgctx.fillStyle = "#080808";
        bgctx.fillRect(0, 0, SW, SH);
        if (!img || !srcW(img)) return;
        const ar = srcW(img) / srcH(img), sar = SW / SH;
        bgctx.save();
        try {
            bgctx.filter = work && work.id === "ggmax"
                ? "blur(12px) saturate(.82) contrast(1.2) brightness(.46)"
                : "blur(12px) saturate(.72) contrast(1.06) brightness(0.6)";
        } catch (e) {}
        let cw, ch;
        if (ar > sar) {
            ch = SH * 1.28;
            cw = ch * ar;
        } else {
            cw = SW * 1.28;
            ch = cw / ar;
        }
        bgctx.drawImage(img, (SW - cw) / 2, (SH - ch) / 2, cw, ch);
        bgctx.restore();
        bgctx.filter = "none";
    }
    function drawFrame(work, img) {
        sctx.save();
        sctx.setTransform(1, 0, 0, 1, 0, 0);
        sctx.drawImage(bg, 0, 0);
        if (img && srcW(img)) {
            const crop = work.screenCrop || { x: 0, y: 0, width: 1, height: 1 };
            const sx = srcW(img) * crop.x, sy = srcH(img) * crop.y;
            const sw = srcW(img) * crop.width, sh = srcH(img) * crop.height;
            const ar = sw / sh;
            const sar = SW / SH;
            let fw, fh;
            const pad = .9;
            if (ar > sar) {
                fw = SW * pad;
                fh = fw / ar;
            } else {
                fh = SH * pad;
                fw = fh * ar;
            }
            const fx = (SW - fw) / 2, fy = (SH - fh) / 2;
            sctx.save();
            sctx.shadowColor = "rgba(0,0,0,.75)";
            sctx.shadowBlur = 8;
            sctx.filter = work.screenFilter || "none";
            sctx.drawImage(img, sx, sy, sw, sh, fx, fy, fw, fh);
            sctx.filter = "none";
            sctx.restore();
            sctx.strokeStyle = "rgba(255,255,255,.35)";
            sctx.lineWidth = 2;
            sctx.strokeRect(fx + 1, fy + 1, fw - 2, fh - 2);
        } else {
            sctx.strokeStyle = "rgba(255,255,255,.34)";
            sctx.lineWidth = 2;
            sctx.strokeRect(70, 70, SW - 140, SH - 140);
            sctx.textAlign = "center";
            sctx.textBaseline = "middle";
            let titleSize = 86;
            do {
                sctx.font = titleSize + 'px "VCR", monospace';
                titleSize -= 4;
            } while (sctx.measureText(work.title).width > SW * .72 && titleSize > 34);
            sctx.fillStyle = "rgba(255,255,255,.94)";
            sctx.fillText(work.title, SW / 2, SH / 2 - 24);
            sctx.font = '22px "VCR", monospace';
            sctx.fillStyle = "rgba(220,220,220,.72)";
            sctx.fillText(work.meta || "COMING SOON", SW / 2, SH / 2 + 54);
            sctx.textAlign = "left";
        }
        sctx.textBaseline = "middle";
        sctx.font = '30px "VT323", monospace';
        sctx.fillStyle = "rgba(255,255,255,.92)";
        sctx.fillText(String(current + 1).padStart(2, "0"), 26, 32);
        sctx.fillStyle = "rgba(154,169,187,.55)";
        sctx.fillText("/ " + String(PROJECTS.length).padStart(2, "0"), 62, 32);
        const px0 = SW - 26;
        for (let i = 0; i < PROJECTS.length; i++) {
            const on = i === current;
            const w = on ? 20 : 7;
            const x = px0 - (PROJECTS.length - i) * 24;
            sctx.fillStyle = on ? "#ffffff" : "rgba(170,170,170,.38)";
            sctx.fillRect(x, SH - 30, w, 3);
        }
        sctx.restore();
        screenTex.needsUpdate = true;
    }
    let spillDue = 0;
    function updateSpillThrottled(t) {
        if (t < spillDue) return;
        spillDue = t + .16;
        updateSpill();
    }
    function updateSpill() {
        spillTargetColor.set(16777215);
        spillTargetIntensity = 24;
    }
    const spillTargetColor = new THREE.Color(16777215);
    let spillTargetIntensity = 24;
    async function select(i, instant) {
        current = (i % PROJECTS.length + PROJECTS.length) % PROJECTS.length;
        const w = PROJECTS[current];
        if (railIdx) railIdx.textContent = String(current + 1).padStart(2, "0");
        if (railTot) railTot.textContent = "/" + String(PROJECTS.length).padStart(2, "0");
        if (railOpen) {
            railOpen.hidden = !w.link;
            if (w.link) {
                railOpen.href = w.link;
                railOpen.setAttribute("aria-label", "Open " + w.title);
            }
        }
        if (openProject) openProject.disabled = !w.link;
        if (railEl && !instant && !reduce) {
            railEl.classList.remove("is-swap");
            void railEl.offsetWidth;
            railEl.classList.add("is-swap");
        }
        if (!instant && !reduce) warpT = 1;
        if (live) {
            try {
                live.pause();
            } catch (e) {}
            live = null;
        }
        const token = ++selectToken;
        const img = await getImage(w.img);
        if (token !== selectToken) return;
        paintBackdrop(img, w);
        drawFrame(w, img);
        updateSpill();
        if (!w.vid || reduce) {
            prefetchNeighbours();
            return;
        }
        const v = await getVideo(w.vid);
        if (token !== selectToken || !v) {
            prefetchNeighbours();
            return;
        }
        try {
            v.currentTime = 0;
        } catch (e) {}
        live = v;
        if (powered && inView && !document.hidden) {
            const play = v.play();
            if (play && play.catch) play.catch(() => {});
        }
        prefetchNeighbours();
    }
    let selectToken = 0;
    let prefetched = false;
    function prefetchNeighbours() {
        const run = () => {
            [ current + 1, current - 1 ].forEach(i => {
                const w = PROJECTS[(i % PROJECTS.length + PROJECTS.length) % PROJECTS.length];
                if (w && w.vid) getVideo(w.vid);
            });
        };
        if (prefetched) {
            run();
            return;
        }
        prefetched = true;
        if (window.requestIdleCallback) requestIdleCallback(run, {
            timeout: 3e3
        }); else setTimeout(run, 1200);
    }
    function powerOn() {
        powered = true;
        shuttingDown = false;
        shutdownT = 0;
        crtMat.uniforms.uShutdown.value = 0;
        powerTarget = 1;
        if (live && inView && !document.hidden) {
            const play = live.play();
            if (play && play.catch) play.catch(() => {});
        }
    }
    function powerOff() {
        powered = false;
        warpT = 1;
        if (reduce) {
            shuttingDown = false;
            shutdownT = 1;
            powerTarget = 0;
            crtMat.uniforms.uShutdown.value = 1;
        } else {
            shuttingDown = true;
            shutdownT = 0;
            powerTarget = 1;
        }
        if (live) live.pause();
    }
    function togglePower() {
        if (powered) powerOff(); else powerOn();
    }
    function open() {
        const w = PROJECTS[current];
        if (!w || !w.link) return;
        window.open(w.link, "_blank", "noopener");
    }
    function openWebsite() {
        window.open("https://vertexaodds.com/", "_blank", "noopener");
    }
    const PRESS_DEPTH = .17;
    function press(role) {
        markInteraction();
        const b = buttons[role];
        if (b) {
            b.t = 1;
            const wp = (new THREE.Box3).setFromObject(b.mesh).getCenter(new THREE.Vector3);
            pressLight.position.copy(wp).add(new THREE.Vector3(0, 0, 1.4));
            pressLight.color.set(16777215);
            pressLightLife = 1;
        }
        if (role === "power") {
            togglePower();
            return;
        }
        if (role === "music") {
            if (SNOW.sound) SNOW.sound.toggle();
            return;
        }
        if (role === "volumeDown" || role === "volumeUp") {
            if (SNOW.sound) SNOW.sound.changeVolume(role === "volumeUp" ? .1 : -.1);
            return;
        }
        if (!powered) return;
        if (role === "left") select(current - 1); else if (role === "right") select(current + 1); else if (role === "up") select(0); else if (role === "down") select(PROJECTS.length - 1); else if (role === "start") openWebsite(); else if (role === "cross" || role === "screen") open(); else if (role === "circle") select(current - 1); else if (role === "triangle") {
            const invert = document.getElementById("invertToggle");
            if (invert) invert.click();
        } else if (role === "square" || role === "select" || role === "home") {
            const a = document.getElementById("about");
            a && a.scrollIntoView({
                behavior: reduce ? "auto" : "smooth"
            });
        }
    }
    if (prevProject) prevProject.addEventListener("click", () => press("left"));
    if (nextProject) nextProject.addEventListener("click", () => press("right"));
    if (openProject) openProject.addEventListener("click", () => open());
    const ray = new THREE.Raycaster;
    const ptr = new THREE.Vector2;
    let hovered = null;
    let dragging = false, dragged = false, lastX = 0, lastY = 0;
    let spinY = 0, spinX = 0, spinVY = 0, spinVX = 0;
    let lastInteractionAt = performance.now() - 5e3;
    function markInteraction() {
        lastInteractionAt = performance.now();
    }
    function toNDC(e) {
        const r = canvas.getBoundingClientRect();
        const t = e.touches ? e.touches[0] : e;
        ptr.x = (t.clientX - r.left) / r.width * 2 - 1;
        ptr.y = -((t.clientY - r.top) / r.height) * 2 + 1;
    }
    function pick() {
        if (!modelReady) return null;
        ray.setFromCamera(ptr, camera);
        const hit = ray.intersectObjects(pressable, false)[0];
        return hit ? hit.object : null;
    }
    canvas.addEventListener("pointerdown", e => {
        markInteraction();
        toNDC(e);
        dragging = true;
        dragged = false;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", e => {
        toNDC(e);
        if (dragging) {
            const dx = e.clientX - lastX, dy = e.clientY - lastY;
            if (Math.abs(dx) + Math.abs(dy) > 4) dragged = true;
            spinVY += dx * 42e-5;
            spinVX += dy * 3e-4;
            lastX = e.clientX;
            lastY = e.clientY;
            return;
        }
        const o = pick();
        if (o !== hovered) {
            hovered = o;
            canvas.style.cursor = o ? "pointer" : "grab";
        }
    });
    function endDrag() {
        dragging = false;
    }
    canvas.addEventListener("pointerup", e => {
        if (!dragged) {
            toNDC(e);
            const o = pick();
            if (o && o.userData.role) press(o.userData.role);
        }
        endDrag();
    });
    canvas.addEventListener("pointercancel", endDrag);
    canvas.addEventListener("pointerleave", () => {
        endDrag();
        hovered = null;
        canvas.style.cursor = "grab";
    });
    canvas.style.cursor = "grab";
    window.addEventListener("keydown", e => {
        if (!inView) return;
        const k = e.key;
        if (k === "ArrowLeft") {
            press("left");
            e.preventDefault();
        } else if (k === "ArrowRight") {
            press("right");
            e.preventDefault();
        } else if (k === "ArrowUp") {
            press("triangle");
            e.preventDefault();
        } else if (k === "ArrowDown") {
            press("square");
            e.preventDefault();
        } else if (k === "Enter" || k === "x" || k === "X") {
            press("cross");
        } else if (k === "p" || k === "P") {
            press("power");
        }
    });
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    renderPass.clearColor = new THREE.Color(0);
    renderPass.clearAlpha = 0;
    composer.addPass(renderPass);
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .24, .2, .78);
    Object.keys(bloom).forEach(k => {
        const m = bloom[k];
        if (!m || !m.isMaterial || m.blending !== THREE.AdditiveBlending) return;
        m.blending = THREE.CustomBlending;
        m.blendEquation = THREE.AddEquation;
        m.blendSrc = THREE.OneFactor;
        m.blendDst = THREE.OneFactor;
        m.blendEquationAlpha = THREE.AddEquation;
        m.blendSrcAlpha = THREE.ZeroFactor;
        m.blendDstAlpha = THREE.OneFactor;
    });
    composer.addPass(bloom);
    composer.addPass(new OutputPass);
    function fitToView() {
        if (!modelBox()) return;
        const b = modelBox();
        const size = b.getSize(new THREE.Vector3);
        const fill = window.innerWidth < 720 ? .98 : .82;
        const vFov = THREE.MathUtils.degToRad(camera.fov);
        const distH = size.y / 2 / Math.tan(vFov / 2);
        const distW = size.x / 2 / (Math.tan(vFov / 2) * camera.aspect);
        camera.position.set(0, 0, Math.max(distH, distW) / fill + size.z);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
    }
    function modelBox() {
        if (!modelReady && !model.children.length) return null;
        return (new THREE.Box3).setFromObject(model);
    }
    function resize() {
        if (!stage) return;
        const w = stage.clientWidth, h = stage.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        composer.setSize(w, h);
        bloom.resolution.set(w, h);
        camera.aspect = w / h;
        camera.fov = w < 720 ? 42 : 32;
        camera.updateProjectionMatrix();
        if (modelReady) fitToView();
    }
    window.addEventListener("resize", resize, {
        passive: true
    });
    resize();
    let inView = true;
    if ("IntersectionObserver" in window) {
        new IntersectionObserver(es => {
            inView = es[0].isIntersecting;
            if (live) {
                if (inView && powered) {
                    const p = live.play();
                    if (p && p.catch) p.catch(() => {});
                } else live.pause();
            }
        }, {
            threshold: .01
        }).observe(stage || canvas);
    }
    document.addEventListener("visibilitychange", () => {
        if (!live) return;
        if (document.hidden) live.pause(); else if (inView && powered) {
            const p = live.play();
            if (p && p.catch) p.catch(() => {});
        }
    });
    const clock = new THREE.Clock;
    function tick() {
        requestAnimationFrame(tick);
        const dt = Math.min(.05, clock.getDelta());
        const t = clock.elapsedTime;
        if (!inView) return;
        spinVY *= .9;
        spinVX *= .9;
        spinY += spinVY;
        spinX += spinVX;
        spinX = Math.max(-.55, Math.min(.55, spinX));
        if (!dragging) {
            const idle = !reduce && performance.now() - lastInteractionAt > 2200;
            const idleY = idle ? Math.sin(t * .56) * .14 : 0;
            const idleX = idle ? Math.sin(t * .38 + .8) * .028 : 0;
            const follow = idle ? 1.35 : 3.2;
            spinY += (idleY - spinY) * Math.min(1, dt * follow);
            spinX += (idleX - spinX) * Math.min(1, dt * follow);
            if (!idle && Math.abs(spinY) < 8e-4) spinY = 0;
            if (!idle && Math.abs(spinX) < 8e-4) spinX = 0;
        }
        root.rotation.y = spinY;
        root.rotation.x = spinX;
        if (shuttingDown) {
            shutdownT = Math.min(1, shutdownT + dt / .96);
            if (shutdownT > .82) powerTarget = 0;
            if (shutdownT >= 1) shuttingDown = false;
        }
        crtMat.uniforms.uShutdown.value = shutdownT;
        powerT += (powerTarget - powerT) * Math.min(1, dt * 2.4);
        crtMat.uniforms.uPower.value = powerT;
        warpT *= Math.pow(.0025, dt);
        if (warpT < .001) warpT = 0;
        crtMat.uniforms.uWarp.value = warpT;
        crtMat.uniforms.uTime.value = t;
        const on = powerT;
        spillA.color.lerp(spillTargetColor, .12);
        spillB.color.copy(spillA.color);
        spillC.color.copy(spillA.color);
        spillA.intensity += (spillTargetIntensity * on - spillA.intensity) * .14;
        spillB.intensity = spillA.intensity * .42;
        spillC.intensity = spillA.intensity * .42;
        for (const k in buttons) {
            const b = buttons[k];
            if (b.t <= 5e-4 && b.mesh.position.equals(b.home)) continue;
            b.t *= Math.pow(.004, dt);
            if (b.t < 5e-4) b.t = 0;
            const d = b.axis.clone().multiplyScalar(-PRESS_DEPTH * b.t);
            b.mesh.position.copy(b.home).add(d);
        }
        if (pressLightLife > 0) {
            pressLightLife -= dt * 3.4;
            pressLight.intensity = Math.max(0, pressLightLife) * 22;
        } else pressLight.intensity = 0;
        if (live && !live.paused && !live.ended && live.readyState >= 2) {
            drawFrame(PROJECTS[current], live);
            updateSpillThrottled(t);
        }
        composer.render();
    }
    tick();
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            if (modelReady) select(current, true);
        });
    }
}
