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

const lidToggle = document.getElementById("lidToggle");

if (canvas && PROJECTS.length) init();

function init() {
    const IS_LAPTOP = true;
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
    const SW = 1440, SH = 900;
    const sc = document.createElement("canvas");
    sc.width = SW;
    sc.height = SH;
    const sctx = sc.getContext("2d", {
        willReadFrequently: false
    });
    const previousFrame = document.createElement("canvas");
    const nextFrame = document.createElement("canvas");
    previousFrame.width = nextFrame.width = SW;
    previousFrame.height = nextFrame.height = SH;
    const previousFrameCtx = previousFrame.getContext("2d");
    const nextFrameCtx = nextFrame.getContext("2d");
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
                value: new THREE.Vector2(SW, SH)
            },
            uBright: {
                value: .92
            },
            uInvert: {
                value: 0
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
    const displayMat = new THREE.MeshBasicMaterial({
        map: screenTex,
        toneMapped: false,
        side: THREE.FrontSide,
        depthTest: true,
        depthWrite: true,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
    });
    let screenMesh = null;
    const buttons = {};
    const pressable = [];
    let modelReady = false;
    let lidPivot = null;
    let lidAngle = 0;
    let lidTarget = 0;
    let lidClosedAngle = Math.PI * .62;
    let lidOpen = true;
    let lidMotionFrom = 0;
    let lidMotionStarted = 0;
    let lidAnimating = false;
    function tintable(m) {
        m.onBeforeCompile = shader => {
            shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\n  float shellGray = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));\n  diffuseColor.rgb = vec3(shellGray);");
        };
        return m;
    }
    SNOW.setScreenInvert = function(on) {
        crtMat.uniforms.uInvert.value = 0;
        keyLight.visible = rimIce.visible = rimHot.visible = true;
        hemi.intensity = .72;
        bloom.strength = IS_LAPTOP ? .055 : .24;
    };
    (new GLTFLoader).load("assets/3d/macbook_pro_m3_16_inch_2024.glb", gltf => {
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
        const screenCandidates = [];
        src.traverse(o => {
            if (!o.isMesh) return;
            o.frustumCulled = false;
            const n = o.name.toLowerCase();
            if (n.indexOf("ground") === 0) {
                bin.push(o);
                return;
            }
            if (n.indexOf("screen") === 0) screenMesh = o;
            const sourceMaterials = Array.isArray(o.material) ? o.material : [ o.material ];
            if (sourceMaterials.some(material => material && material.emissiveMap)) screenMesh = o;
            if (o.geometry) {
                o.geometry.computeBoundingBox();
                const candidateSize = o.geometry.boundingBox.getSize(new THREE.Vector3);
                const ordered = [candidateSize.x, candidateSize.y, candidateSize.z].sort((a, b) => b - a);
                const area = ordered[0] * ordered[1];
                const flatness = ordered[2] / Math.max(ordered[1], 1e-6);
                if (area > 20 && flatness < .012) {
                    const centre = o.geometry.boundingBox.getCenter(new THREE.Vector3);
                    screenCandidates.push({ mesh: o, centre: centre, size: candidateSize, score: area / (1 + flatness * 2000) });
                }
            }
            const m = n.match(/^button(\d+)/);
            if (m) parts["b" + m[1]] = o;
            if (o.material) {
                const cloned = sourceMaterials.map(sourceMaterial => {
                    const material = sourceMaterial.clone();
                    tintable(material);
                    material.envMapIntensity = 1.25;
                    if (material.metalness !== undefined) {
                        material.metalness = Math.min(1, (material.metalness ?? .5) * .9 + .18);
                        material.roughness = Math.max(.12, (material.roughness ?? .5) * .82);
                    }
                    return material;
                });
                o.material = Array.isArray(o.material) ? cloned : cloned[0];
            }
        });
        bin.forEach(o => {
            o.parent && o.parent.remove(o);
        });
        if (!screenMesh && screenCandidates.length) {
            screenCandidates.sort((a, b) => a.centre.z - b.centre.z || b.score - a.score);
            screenMesh = screenCandidates[0].mesh;
        }
        if (!screenMesh) {
            console.warn("[snow-console] no screen mesh");
            SNOW.fireReady();
            return;
        }
        const screenBounds = screenMesh.geometry.boundingBox.getSize(new THREE.Vector3);
        const screenDepth = screenMesh.geometry.boundingBox.getCenter(new THREE.Vector3).z;
        screenCandidates.forEach(candidate => {
            if (candidate.mesh === screenMesh) return;
            const coversDisplay = candidate.size.x >= screenBounds.x * .98 && candidate.size.y >= screenBounds.y * .98;
            if (coversDisplay && candidate.centre.z < screenDepth + .08) candidate.mesh.visible = false;
        });
        const lidAssembly = screenMesh.parent && screenMesh.parent.parent;
        if (lidAssembly && lidAssembly.parent) {
            const pivotParent = lidAssembly.parent;
            const lidBaseObjects = pivotParent.children.filter(child => child !== lidAssembly);
            pivotParent.updateWorldMatrix(true, true);
            const parentWorldInverse = pivotParent.matrixWorld.clone().invert();
            const samplePoint = new THREE.Vector3;
            const boundsInParent = objects => {
                const bounds = new THREE.Box3;
                objects.forEach(object => object.traverse(part => {
                    if (!part.isMesh || !part.geometry) return;
                    const positions = part.geometry.getAttribute("position");
                    if (!positions) return;
                    for (let vertex = 0; vertex < positions.count; vertex++) {
                        samplePoint.fromBufferAttribute(positions, vertex)
                            .applyMatrix4(part.matrixWorld)
                            .applyMatrix4(parentWorldInverse);
                        bounds.expandByPoint(samplePoint);
                    }
                }));
                return bounds;
            };
            const baseBox = boundsInParent(lidBaseObjects);
            const lidBox = boundsInParent([ lidAssembly ]);
            const hingeLocal = new THREE.Vector3(
                (lidBox.min.x + lidBox.max.x) / 2,
                baseBox.min.y,
                (baseBox.min.z + baseBox.max.z) / 2
            );
            const hingeVertex = new THREE.Vector3;
            const hingeDepths = [];
            lidAssembly.updateWorldMatrix(true, true);
            lidAssembly.traverse(part => {
                if (!part.isMesh || !part.geometry) return;
                const positions = part.geometry.getAttribute("position");
                if (!positions) return;
                for (let vertex = 0; vertex < positions.count; vertex++) {
                    hingeVertex.fromBufferAttribute(positions, vertex);
                    hingeVertex.applyMatrix4(part.matrixWorld).applyMatrix4(parentWorldInverse);
                    if (Math.abs(hingeVertex.y - hingeLocal.y) > .05) continue;
                    hingeDepths.push(hingeVertex.z);
                }
            });
            if (hingeDepths.length) {
                hingeDepths.sort((a, b) => a - b);
                hingeLocal.z = hingeDepths[Math.floor(hingeDepths.length / 2)];
            }
            const lidCentreLocal = lidBox.getCenter(new THREE.Vector3);
            const baseCentreLocal = baseBox.getCenter(new THREE.Vector3);
            const openDirection = Math.atan2(lidCentreLocal.z - hingeLocal.z, lidCentreLocal.y - hingeLocal.y);
            const closedDirection = Math.atan2(baseCentreLocal.z - hingeLocal.z, baseCentreLocal.y - hingeLocal.y);
            const closureDelta = closedDirection - openDirection;
            const flushClosedAngle = Math.atan2(Math.sin(closureDelta), Math.cos(closureDelta));
            lidClosedAngle = flushClosedAngle - Math.sign(flushClosedAngle) * THREE.MathUtils.degToRad(1.5);
            lidPivot = new THREE.Group;
            lidPivot.name = "macbook_lid_hinge";
            pivotParent.add(lidPivot);
            lidPivot.position.copy(hingeLocal);
            lidPivot.attach(lidAssembly);
            lidAssembly.traverse(part => {
                if (!part.isMesh || part === screenMesh || !part.visible) return;
                part.userData.role = "lid";
                pressable.push(part);
                const materials = Array.isArray(part.material) ? part.material : [ part.material ];
                materials.forEach(material => {
                    if (!material) return;
                    material.side = THREE.DoubleSide;
                    material.needsUpdate = true;
                });
            });
            if (lidToggle) lidToggle.disabled = false;
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
        if (IS_LAPTOP) {
            model.rotateY(Math.PI);
            model.updateWorldMatrix(true, true);
        }
        const size = (new THREE.Box3).setFromObject(model).getSize(new THREE.Vector3);
        model.scale.setScalar(10 / Math.max(size.x, size.y, size.z));
        model.updateWorldMatrix(true, true);
        model.position.sub((new THREE.Box3).setFromObject(model).getCenter(new THREE.Vector3));
        model.updateWorldMatrix(true, true);
        fitToView();
        const sNrm = largestFaceNormal(screenMesh);
        if (sNrm.z < 0) sNrm.negate();
        buildScreenUVs(screenMesh, sNrm, new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0));
        const originalScreen = screenMesh;
        const visibleNormal = largestFaceNormal(originalScreen);
        const visibleCentre = (new THREE.Box3).setFromObject(originalScreen).getCenter(new THREE.Vector3);
        const towardCamera = camera.position.clone().sub(visibleCentre);
        displayMat.side = visibleNormal.dot(towardCamera) >= 0 ? THREE.FrontSide : THREE.BackSide;
        displayMat.needsUpdate = true;
        const displaySurface = new THREE.Mesh(originalScreen.geometry.clone(), displayMat);
        displaySurface.name = "screen_overlay";
        displaySurface.position.copy(originalScreen.position);
        displaySurface.quaternion.copy(originalScreen.quaternion);
        displaySurface.scale.copy(originalScreen.scale);
        originalScreen.parent.add(displaySurface);
        originalScreen.visible = false;
        screenMesh = displaySurface;
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
        const sb = (new THREE.Box3).setFromObject(screenMesh);
        const sc2 = sb.getCenter(new THREE.Vector3);
        const halfW = (sb.max.x - sb.min.x) / 2;
        spillA.position.set(sc2.x, sc2.y, sc2.z + 2.2);
        spillB.position.set(sc2.x - halfW * 1.5, sc2.y, sc2.z + 1.5);
        spillC.position.set(sc2.x + halfW * 1.5, sc2.y, sc2.z + 1.5);
        if (screenMesh) screenMesh.userData.role = "screen";
        pressable.push(screenMesh);
        modelReady = true;
        select(0, true).then(() => {
            powerOn();
            renderer.compile(scene, camera);
            composer.render();
            requestAnimationFrame(() => {
                composer.render();
                if (loadingEl) loadingEl.classList.add("is-off");
                SNOW.fireReady();
            });
        }).catch(() => {
            powerOn();
            if (loadingEl) loadingEl.classList.add("is-off");
            SNOW.fireReady();
        });

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
        const U = e1;
        const V = e2;
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
    let screenTransition = 1;
    let screenTransitionDirection = 1;
    let live = null;
    let activeImage = null;
    let lastClockMinute = "";
    const srcW = s => s && (s.videoWidth || s.width) || 0;
    const srcH = s => s && (s.videoHeight || s.height) || 0;
    const bg = document.createElement("canvas");
    bg.width = SW;
    bg.height = SH;
    const bgctx = bg.getContext("2d");
    const screenNav = {
        y: 61,
        h: 32,
        previous: { x: 1100, w: 45 },
        next: { x: 1269, w: 45 }
    };
    function roundedRect(ctx, x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + width, y, x + width, y + height, r);
        ctx.arcTo(x + width, y + height, x, y + height, r);
        ctx.arcTo(x, y + height, x, y, r);
        ctx.arcTo(x, y, x + width, y, r);
        ctx.closePath();
    }
    function drawCover(ctx, img, x, y, width, height, crop) {
        if (!img || !srcW(img)) return;
        const c = crop || { x: 0, y: 0, width: 1, height: 1 };
        let sx = srcW(img) * c.x, sy = srcH(img) * c.y;
        let sw = srcW(img) * c.width, sh = srcH(img) * c.height;
        const sourceAspect = sw / sh;
        const targetAspect = width / height;
        if (sourceAspect > targetAspect) {
            const nextWidth = sh * targetAspect;
            sx += (sw - nextWidth) / 2;
            sw = nextWidth;
        } else {
            const nextHeight = sw / targetAspect;
            sy += (sh - nextHeight) / 2;
            sh = nextHeight;
        }
        ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height);
    }
    function drawContain(ctx, img, x, y, width, height, zoom = 1) {
        if (!img || !srcW(img)) return;
        const scale = Math.min(width / srcW(img), height / srcH(img)) * zoom;
        const renderedWidth = srcW(img) * scale;
        const renderedHeight = srcH(img) * scale;
        ctx.drawImage(img, x + (width - renderedWidth) / 2, y + (height - renderedHeight) / 2, renderedWidth, renderedHeight);
    }
    function drawAppleLogo(ctx, x, y, size) {
        const mark = new Path2D;
        mark.moveTo(11.7, 5.7);
        mark.bezierCurveTo(9.4, 5.7, 8.5, 4.25, 5.9, 4.45);
        mark.bezierCurveTo(2.45, 4.7, .25, 7.6, .55, 11.45);
        mark.bezierCurveTo(.8, 14.65, 2.25, 18.7, 5.15, 21.05);
        mark.bezierCurveTo(7.05, 22.6, 8.55, 21.15, 10.55, 21.15);
        mark.bezierCurveTo(12.8, 21.15, 13.75, 22.65, 16.05, 22.3);
        mark.bezierCurveTo(18.75, 21.9, 20.35, 18.55, 21.65, 15.75);
        mark.bezierCurveTo(18.85, 14.55, 17.4, 12.45, 17.55, 10.25);
        mark.bezierCurveTo(17.7, 7.9, 19.15, 6.35, 21.1, 5.35);
        mark.bezierCurveTo(19.35, 4.25, 17.05, 4.1, 15.15, 4.75);
        mark.bezierCurveTo(13.7, 5.25, 13.05, 5.7, 11.7, 5.7);
        mark.closePath();
        mark.moveTo(21.15, 7.25);
        mark.arc(21.15, 7.25, 3.05, 0, Math.PI * 2);
        mark.ellipse(14.4, 1.45, 2.05, 3.75, .7, 0, Math.PI * 2);
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(size / 23, size / 23);
        ctx.fill(mark, "evenodd");
        ctx.restore();
    }
    function paintBackdrop(img, work) {
        bgctx.setTransform(1, 0, 0, 1, 0, 0);
        bgctx.fillStyle = "#b8bebd";
        bgctx.fillRect(0, 0, SW, SH);
        if (IS_LAPTOP) {
            bgctx.fillStyle = "#d0d4d2";
            bgctx.beginPath();
            bgctx.moveTo(0, 0);
            bgctx.lineTo(470, 0);
            bgctx.bezierCurveTo(560, 155, 590, 330, 780, 515);
            bgctx.bezierCurveTo(635, 645, 520, 755, 440, 900);
            bgctx.lineTo(0, 900);
            bgctx.closePath();
            bgctx.fill();
            bgctx.fillStyle = "#777d7d";
            bgctx.beginPath();
            bgctx.moveTo(0, 0);
            bgctx.lineTo(260, 0);
            bgctx.bezierCurveTo(390, 190, 420, 390, 650, 565);
            bgctx.bezierCurveTo(505, 680, 385, 790, 310, 900);
            bgctx.lineTo(0, 900);
            bgctx.closePath();
            bgctx.fill();
            bgctx.fillStyle = "#34393b";
            bgctx.beginPath();
            bgctx.moveTo(0, 0);
            bgctx.lineTo(125, 0);
            bgctx.bezierCurveTo(210, 190, 250, 405, 505, 590);
            bgctx.bezierCurveTo(350, 715, 250, 820, 190, 900);
            bgctx.lineTo(0, 900);
            bgctx.closePath();
            bgctx.fill();
            const haze = bgctx.createLinearGradient(0, 0, SW, SH);
            haze.addColorStop(0, "rgba(255,255,255,.12)");
            haze.addColorStop(.54, "rgba(255,255,255,.03)");
            haze.addColorStop(1, "rgba(34,38,40,.18)");
            bgctx.fillStyle = haze;
            bgctx.fillRect(0, 0, SW, SH);
        } else if (img && srcW(img)) {
            drawCover(bgctx, img, 0, 0, SW, SH);
        }
    }
    function drawLaptopFrame(work, img, now) {
        const light = work.lockTone === "light";
        const accent = work.accent || "#4e9eff";
        const clockText = new Intl.DateTimeFormat("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }).format(now);
        sctx.save();
        sctx.setTransform(1, 0, 0, 1, 0, 0);
        sctx.drawImage(bg, 0, 0);
        sctx.textBaseline = "middle";

        const desktopItems = [ [ "Imagens", 92 ], [ "Documentos", 170 ], [ "Músicas", 248 ], [ "Projetos", 326 ] ];
        desktopItems.forEach(item => {
            const x = 1367, y = item[1];
            roundedRect(sctx, x - 25, y - 23, 50, 36, 5);
            sctx.fillStyle = "#58a9e7";
            sctx.fill();
            sctx.fillStyle = "rgba(17,20,22,.84)";
            sctx.textAlign = "center";
            sctx.font = '400 12px "Helvetica", Arial, sans-serif';
            sctx.fillText(item[0], x, y + 27);
        });

        sctx.fillStyle = "rgba(239,241,239,.90)";
        sctx.fillRect(0, 0, SW, 35);
        sctx.fillStyle = "rgba(18,18,20,.92)";
        drawAppleLogo(sctx, 13, 5, 24);
        sctx.textAlign = "left";
        sctx.font = '600 16px "Helvetica", Arial, sans-serif';
        sctx.fillText("Finder", 44, 18);
        sctx.font = '400 15px "Helvetica", Arial, sans-serif';
        sctx.fillText("Arquivo", 108, 18);
        sctx.fillText("Editar", 174, 18);
        sctx.fillText("Visualizar", 230, 18);
        sctx.fillText("Ir", 317, 18);
        sctx.fillText("Janela", 345, 18);
        sctx.fillText("Ajuda", 408, 18);
        sctx.textAlign = "right";
        sctx.fillText("Wi-Fi   100%   " + clockText, SW - 20, 18);

        const cardX = 54, cardY = 48, cardW = 1260, cardH = 786, titleH = 58;
        sctx.save();
        sctx.shadowColor = "rgba(0,0,0,.35)";
        sctx.shadowBlur = 28;
        sctx.shadowOffsetY = 12;
        roundedRect(sctx, cardX, cardY, cardW, cardH, 12);
        sctx.fillStyle = "rgba(238,239,241,.985)";
        sctx.fill();
        sctx.restore();

        sctx.save();
        roundedRect(sctx, cardX, cardY, cardW, cardH, 12);
        sctx.clip();
        sctx.fillStyle = "#d7d8da";
        sctx.fillRect(cardX, cardY, cardW, titleH);
        sctx.fillStyle = "rgba(42,45,48,.62)";
        sctx.textAlign = "left";
        sctx.font = '500 21px "Helvetica", Arial, sans-serif';
        sctx.fillText("▣   ‹   ›", cardX + 18, cardY + titleH / 2);
        roundedRect(sctx, cardX + 340, cardY + 13, cardW - 680, 32, 10);
        sctx.fillStyle = "rgba(255,255,255,.62)";
        sctx.fill();
        sctx.fillStyle = "rgba(20,20,24,.70)";
        sctx.textAlign = "center";
        sctx.font = '400 14px "Helvetica", Arial, sans-serif';
        sctx.fillText(work.desktopUrl || "bysnow.dev/" + work.id, cardX + cardW / 2, cardY + titleH / 2 + 1);

        const navX = screenNav.previous.x;
        const navY = screenNav.y;
        const navW = cardX + cardW - navX;
        roundedRect(sctx, navX, navY, navW, screenNav.h, 8);
        sctx.fillStyle = "rgba(20,22,24,.82)";
        sctx.fill();
        sctx.strokeStyle = "rgba(255,255,255,.26)";
        sctx.lineWidth = 1;
        sctx.stroke();
        sctx.fillStyle = "rgba(255,255,255,.94)";
        sctx.font = '600 18px "Helvetica", Arial, sans-serif';
        sctx.textAlign = "center";
        sctx.fillText("‹", navX + screenNav.previous.w / 2, navY + screenNav.h / 2 + 1);
        sctx.fillText("›", screenNav.next.x + screenNav.next.w / 2, navY + screenNav.h / 2 + 1);
        sctx.fillStyle = "rgba(255,255,255,.74)";
        sctx.font = '600 12px "VCR", monospace';
        sctx.fillText(String(current + 1).padStart(2, "0") + " / " + String(PROJECTS.length).padStart(2, "0"), (navX + screenNav.next.x + screenNav.next.w) / 2, navY + screenNav.h / 2 + 1);
        sctx.strokeStyle = "rgba(255,255,255,.18)";
        sctx.beginPath();
        sctx.moveTo(navX + screenNav.previous.w, navY + 5);
        sctx.lineTo(navX + screenNav.previous.w, navY + screenNav.h - 5);
        sctx.moveTo(screenNav.next.x, navY + 5);
        sctx.lineTo(screenNav.next.x, navY + screenNav.h - 5);
        sctx.stroke();

        const contentY = cardY + titleH;
        const contentH = cardH - titleH;
        sctx.fillStyle = light ? "#f3f5f8" : "#080808";
        sctx.fillRect(cardX, contentY, cardW, contentH);
        if (img && srcW(img)) {
            sctx.filter = work.screenFilter || "contrast(1.03) saturate(1.03)";
            drawContain(sctx, img, cardX, contentY, cardW, contentH, 1.12);
            sctx.filter = "none";
        } else {
            sctx.fillStyle = light ? "#14263c" : "#f4f4f4";
            sctx.textAlign = "center";
            sctx.font = '600 84px "VCR", monospace';
            sctx.fillText(work.title, cardX + cardW / 2, contentY + contentH / 2);
        }
        sctx.restore();
        roundedRect(sctx, cardX, cardY, cardW, cardH, 12);
        sctx.strokeStyle = "rgba(255,255,255,.36)";
        sctx.lineWidth = 2;
        sctx.stroke();

        const dockW = 466, dockH = 58, dockX = (SW - dockW) / 2, dockY = 834;
        roundedRect(sctx, dockX, dockY, dockW, dockH, 18);
        sctx.fillStyle = "rgba(244,245,245,.55)";
        sctx.fill();
        sctx.strokeStyle = "rgba(255,255,255,.60)";
        sctx.lineWidth = 1;
        sctx.stroke();
        const dockCharacters = [ "0", "0", "S", "N", "O", "W", "0", "0" ];
        dockCharacters.forEach((character, i) => {
            const x = dockX + 34 + i * 56;
            roundedRect(sctx, x - 19, dockY + 9, 38, 38, 10);
            sctx.fillStyle = "#c8d0d3";
            sctx.fill();
            sctx.strokeStyle = "rgba(255,255,255,.72)";
            sctx.stroke();
            sctx.fillStyle = "rgba(20,23,25,.76)";
            sctx.textAlign = "center";
            sctx.font = '700 14px "Helvetica", Arial, sans-serif';
            sctx.fillText(character, x, dockY + 29);
        });
        sctx.restore();
        lastClockMinute = clockText;
        screenTex.needsUpdate = true;
    }
    function drawFrame(work, img) {
        const now = new Date;
        if (IS_LAPTOP) {
            drawLaptopFrame(work, img, now);
            return;
        }
        const light = work.lockTone === "light";
        const ink = light ? "rgba(10,38,78,1)" : "rgba(255,255,255,.96)";
        const muted = light ? "rgba(10,38,78,.74)" : "rgba(255,255,255,.62)";
        const accent = work.accent || (light ? "#0879f9" : "#ffffff");
        sctx.save();
        sctx.setTransform(1, 0, 0, 1, 0, 0);
        sctx.drawImage(bg, 0, 0);
        const wash = sctx.createLinearGradient(0, 0, 0, SH);
        if (light) {
            wash.addColorStop(0, "rgba(255,255,255,.08)");
            wash.addColorStop(.58, "rgba(236,244,255,.12)");
            wash.addColorStop(1, "rgba(213,229,252,.18)");
        } else {
            wash.addColorStop(0, "rgba(0,0,0,.04)");
            wash.addColorStop(.48, "rgba(0,0,0,.10)");
            wash.addColorStop(1, "rgba(0,0,0,.56)");
        }
        sctx.fillStyle = wash;
        sctx.fillRect(0, 0, SW, SH);

        const dateText = new Intl.DateTimeFormat("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long"
        }).format(now);
        sctx.textAlign = "center";
        sctx.textBaseline = "middle";
        sctx.fillStyle = muted;
        sctx.font = '600 25px "Helvetica", Arial, sans-serif';
        sctx.fillText(dateText.charAt(0).toUpperCase() + dateText.slice(1), SW / 2, 154);
        sctx.fillStyle = ink;
        sctx.font = '400 158px "Helvetica", Arial, sans-serif';
        const clockText = new Intl.DateTimeFormat("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }).format(now);
        sctx.fillText(clockText, SW / 2, 264);

        const cardX = 54, cardY = 300, cardW = SW - cardX * 2, cardH = 628;
        sctx.save();
        sctx.shadowColor = light ? "rgba(36,83,145,.28)" : "rgba(0,0,0,.72)";
        sctx.shadowBlur = 38;
        sctx.shadowOffsetY = 22;
        roundedRect(sctx, cardX, cardY, cardW, cardH, 42);
        sctx.fillStyle = light ? "rgba(255,255,255,.78)" : "rgba(10,10,10,.82)";
        sctx.fill();
        sctx.clip();
        if (img && srcW(img)) {
            sctx.filter = light ? "contrast(1.24) saturate(1.12) brightness(.9)" : "none";
            drawCover(sctx, img, cardX, cardY, cardW, cardH, work.lockCrop || work.screenCrop);
            sctx.filter = "none";
        } else {
            const empty = sctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
            empty.addColorStop(0, light ? "#f8fbff" : "#161616");
            empty.addColorStop(1, light ? "#d9e7fa" : "#050505");
            sctx.fillStyle = empty;
            sctx.fillRect(cardX, cardY, cardW, cardH);
            sctx.fillStyle = ink;
            sctx.font = '600 58px "VCR", monospace';
            sctx.fillText(work.title, SW / 2, cardY + cardH / 2 - 22);
            sctx.fillStyle = muted;
            sctx.font = '24px "VCR", monospace';
            sctx.fillText(work.meta || "COMING SOON", SW / 2, cardY + cardH / 2 + 46);
        }
        sctx.restore();
        sctx.save();
        roundedRect(sctx, cardX, cardY, cardW, cardH, 42);
        sctx.strokeStyle = light ? "rgba(255,255,255,.94)" : "rgba(255,255,255,.32)";
        sctx.lineWidth = 3;
        sctx.stroke();
        sctx.restore();

        sctx.textAlign = "left";
        sctx.fillStyle = accent;
        sctx.font = '600 20px "VCR", monospace';
        sctx.fillText(String(current + 1).padStart(2, "0") + " / " + String(PROJECTS.length).padStart(2, "0"), 55, 1000);
        sctx.fillStyle = ink;
        let titleSize = 58;
        do {
            sctx.font = '600 ' + titleSize + 'px "Helvetica", Arial, sans-serif';
            titleSize -= 2;
        } while (sctx.measureText(work.title).width > SW - 110 && titleSize > 36);
        sctx.fillText(work.title, 55, 1065);
        sctx.fillStyle = muted;
        sctx.font = '24px "Helvetica", Arial, sans-serif';
        const subtitle = work.sub || work.meta || "selected archive file";
        const words = subtitle.split(/\s+/);
        let line = "", lineY = 1115;
        words.forEach(word => {
            const test = line ? line + " " + word : word;
            if (sctx.measureText(test).width > SW - 110 && line) {
                sctx.fillText(line, 55, lineY);
                line = word;
                lineY += 34;
            } else line = test;
        });
        if (line) sctx.fillText(line, 55, lineY);

        sctx.textAlign = "center";
        const dotsY = 1360;
        for (let i = 0; i < PROJECTS.length; i++) {
            sctx.beginPath();
            sctx.arc(SW / 2 + (i - (PROJECTS.length - 1) / 2) * 28, dotsY, i === current ? 6 : 4, 0, Math.PI * 2);
            sctx.fillStyle = i === current ? accent : muted;
            sctx.fill();
        }
        sctx.fillStyle = muted;
        sctx.font = '18px "VCR", monospace';
        sctx.fillText(work.link ? "TOQUE PARA ABRIR" : "ARQUIVO EM DESENVOLVIMENTO", SW / 2, 1415);
        sctx.restore();
        lastClockMinute = clockText;
        screenTex.needsUpdate = true;
    }
    function beginScreenTransition(work, img, direction, instant) {
        if (instant || reduce) {
            screenTransition = 1;
            drawFrame(work, img);
            return;
        }
        previousFrameCtx.clearRect(0, 0, SW, SH);
        previousFrameCtx.drawImage(sc, 0, 0);
        drawFrame(work, img);
        nextFrameCtx.clearRect(0, 0, SW, SH);
        nextFrameCtx.drawImage(sc, 0, 0);
        screenTransitionDirection = direction || 1;
        screenTransition = 0;
        renderScreenTransition();
    }
    function renderScreenTransition() {
        const eased = 1 - Math.pow(1 - screenTransition, 3);
        const travel = SW * .34;
        sctx.save();
        sctx.setTransform(1, 0, 0, 1, 0, 0);
        sctx.clearRect(0, 0, SW, SH);
        sctx.globalAlpha = 1 - eased;
        sctx.drawImage(previousFrame, -screenTransitionDirection * travel * eased, 0);
        sctx.globalAlpha = eased;
        sctx.drawImage(nextFrame, screenTransitionDirection * travel * (1 - eased), 0);
        sctx.globalAlpha = Math.sin(screenTransition * Math.PI) * .28;
        sctx.fillStyle = "#000000";
        sctx.fillRect(0, 0, SW, SH);
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
        const previousIndex = current;
        current = (i % PROJECTS.length + PROJECTS.length) % PROJECTS.length;
        const forwardDistance = (current - previousIndex + PROJECTS.length) % PROJECTS.length;
        const transitionDirection = forwardDistance > 0 && forwardDistance <= PROJECTS.length / 2 ? 1 : -1;
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
        const [ img, wallpaper ] = await Promise.all([ getImage(w.img), getImage(w.wallpaper) ]);
        if (token !== selectToken) return;
        activeImage = img;
        paintBackdrop(IS_LAPTOP ? img : wallpaper || img, w);
        beginScreenTransition(w, img, transitionDirection, instant);
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
    function reflectLidControls(moving) {
        const label = moving ? lidOpen ? "opening..." : "closing..." : lidOpen ? "close lid" : "open lid";
        const action = lidOpen ? "Close MacBook lid" : "Open MacBook lid";
        if (lidToggle) {
            lidToggle.textContent = label + " [L]";
            lidToggle.setAttribute("aria-label", action);
            lidToggle.setAttribute("aria-pressed", lidOpen ? "false" : "true");
        }
    }
    function setLid(open) {
        lidOpen = open;
        lidMotionFrom = lidAngle;
        lidTarget = open ? 0 : lidClosedAngle;
        lidMotionStarted = performance.now();
        lidAnimating = !reduce;
        if (reduce) lidAngle = lidTarget;
        reflectLidControls(lidAnimating);
        markInteraction();
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
        if (role === "lid") {
            setLid(!lidOpen);
            return;
        }
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
    if (lidToggle) lidToggle.addEventListener("click", () => setLid(!lidOpen));
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
        return ray.intersectObjects(pressable, false)[0] || null;
    }
    function pressScreen(hit) {
        if (!hit || !hit.uv) {
            press("screen");
            return;
        }
        const x = hit.uv.x * SW;
        const y = (1 - hit.uv.y) * SH;
        const inNavY = y >= screenNav.y && y <= screenNav.y + screenNav.h;
        if (inNavY && x >= screenNav.previous.x && x <= screenNav.previous.x + screenNav.previous.w) {
            press("left");
        } else if (inNavY && x >= screenNav.next.x && x <= screenNav.next.x + screenNav.next.w) {
            press("right");
        } else {
            press("screen");
        }
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
        const hit = pick();
        const o = hit && hit.object;
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
            const hit = pick();
            const o = hit && hit.object;
            if (o && o.userData.role === "screen") pressScreen(hit); else if (o && o.userData.role) press(o.userData.role);
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
        } else if (k === "l" || k === "L") {
            setLid(!lidOpen);
        }
    });
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    renderPass.clearColor = new THREE.Color(0);
    renderPass.clearAlpha = 0;
    composer.addPass(renderPass);
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), IS_LAPTOP ? .055 : .24, .2, .78);
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
        const fill = window.innerWidth < 720 ? 1.16 : IS_LAPTOP ? 1.28 : .82;
        const vFov = THREE.MathUtils.degToRad(camera.fov);
        const distH = size.y / 2 / Math.tan(vFov / 2);
        const distW = size.x / 2 / (Math.tan(vFov / 2) * camera.aspect);
        const distance = Math.max(distH, distW) / fill + size.z;
        camera.position.set(0, IS_LAPTOP ? distance * .48 : 0, distance);
        camera.lookAt(0, IS_LAPTOP ? -1.2 : 0, 0);
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
    let nextClockCheck = 0;
    function tick() {
        requestAnimationFrame(tick);
        const dt = Math.min(.05, clock.getDelta());
        const t = clock.elapsedTime;
        if (!inView) return;
        if (!live && t >= nextClockCheck) {
            nextClockCheck = t + 1;
            const wallClock = new Intl.DateTimeFormat("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            }).format(new Date);
            if (wallClock !== lastClockMinute && activeImage !== undefined) {
                drawFrame(PROJECTS[current], activeImage);
            }
        }
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
        if (lidPivot) {
            if (lidAnimating) {
                const progress = Math.min(1, (performance.now() - lidMotionStarted) / 1900);
                const eased = progress < .5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                lidAngle = THREE.MathUtils.lerp(lidMotionFrom, lidTarget, eased);
                if (progress >= 1) {
                    lidAngle = lidTarget;
                    lidAnimating = false;
                    reflectLidControls(false);
                }
            }
            lidPivot.rotation.x = lidAngle;
        }
        if (shuttingDown) {
            shutdownT = Math.min(1, shutdownT + dt / .96);
            if (shutdownT > .82) powerTarget = 0;
            if (shutdownT >= 1) shuttingDown = false;
        }
        crtMat.uniforms.uShutdown.value = shutdownT;
        powerT += (powerTarget - powerT) * Math.min(1, dt * 2.4);
        crtMat.uniforms.uPower.value = powerT;
        displayMat.color.setScalar(Math.max(.002, powerT));
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
        if (screenTransition < 1) {
            screenTransition = Math.min(1, screenTransition + dt / 1.05);
            renderScreenTransition();
        } else if (live && !live.paused && !live.ended && live.readyState >= 2) {
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
