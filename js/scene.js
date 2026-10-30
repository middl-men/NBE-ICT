/*
 * The world behind the interface: an aurora of NBE green and gold, and the NBE
 * emblem (arch, bowl, three pillars) extruded from its real vector geometry.
 * One continuous scene runs through all four stages; stages only change its pose.
 */
window.NBEScene = (function () {
  const T = window.THREE;

  const POSES = {
    //         camera      emblem position / scale   sway  ambience
    attract: { camZ: 14, camY: 0, emX: 0, emY: -.2, emZ: 0, emS: .5, sway: 1, glow: 1, energy: .85, gold: .45, reflect: 1, lum: 1 },
    welcome: { camZ: 14, camY: 0, emX: 0, emY: -12, emZ: -11, emS: 1.9, sway: .25, glow: .8, energy: .75, gold: .7, reflect: 0, lum: .7 },
    onboard: { camZ: 14, camY: 0, emX: 0, emY: -12, emZ: -11, emS: 1.9, sway: .08, glow: .4, energy: .72, gold: .3, reflect: 0, lum: .22 },
    done:    { camZ: 14, camY: 0, emX: 0, emY: 2.78, emZ: 0, emS: .3, sway: .5, glow: 1.2, energy: 1, gold: 1, reflect: 0, lum: 1 }
  };

  const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));
  const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeIn = t => t * t * t;

  // Coordinates are the emblem's own, from the app artwork.
  const C = { x: 196.05, y: 32.6 }, K = .1;
  const X = x => (x - C.x) * K, Y = y => -(y - C.y) * K;
  function shape(cmds) {
    const s = new T.Shape();
    cmds.forEach(c => {
      if (c[0] === 'M') s.moveTo(X(c[1]), Y(c[2]));
      if (c[0] === 'L') s.lineTo(X(c[1]), Y(c[2]));
      if (c[0] === 'C') s.bezierCurveTo(X(c[1]), Y(c[2]), X(c[3]), Y(c[4]), X(c[5]), Y(c[6]));
    });
    return s;
  }
  const ARCH = [['M', 211.19, 7], ['L', 180.91, 7], ['C', 176.87, 7, 173.6, 10.26, 173.6, 14.3], ['L', 173.6, 44.97], ['C', 173.6, 48.72, 175.87, 51.81, 179.52, 52.21], ['L', 179.52, 12.97], ['L', 212.62, 12.97], ['L', 212.62, 52.21], ['C', 216.23, 51.77, 218.5, 48.7, 218.5, 44.97], ['L', 218.5, 14.3], ['C', 218.5, 10.26, 215.23, 7, 211.19, 7]];
  const BOWL = [['M', 184.23, 18.72], ['C', 184.12, 19.34, 184.07, 19.98, 184.07, 20.64], ['C', 184.07, 27.24, 189.43, 32.59, 196.05, 32.59], ['C', 202.66, 32.59, 208.03, 27.24, 208.03, 20.64], ['C', 208.03, 19.98, 207.98, 19.34, 207.87, 18.72], ['L', 184.23, 18.72]];
  const P1 = [['M', 184.14, 36.56], ['L', 184.14, 53.18], ['C', 184.14, 57.28, 187.12, 58.03, 188.65, 58.14], ['L', 189.57, 58.14], ['L', 189.57, 36.56], ['L', 184.14, 36.56]];
  const P2 = [['M', 193.34, 58.14], ['L', 198.75, 58.14], ['L', 198.75, 36.56], ['L', 193.34, 36.56], ['L', 193.34, 58.14]];
  const P3 = [['M', 202.53, 36.56], ['L', 202.53, 58.14], ['L', 203.45, 58.14], ['C', 204.93, 58.03, 207.7, 57.35, 207.95, 53.71], ['L', 207.95, 36.56], ['L', 202.53, 36.56]];

  function extrude(cmds, depth, bevel) {
    const g = new T.ExtrudeGeometry(shape(cmds), { depth, curveSegments: 28, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5 });
    g.translate(0, 0, -depth / 2);
    return g;
  }

  function glowTexture(stops) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d'), g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    stops.forEach(s => g.addColorStop(s[0], s[1]));
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }
  function beamTexture() {
    const c = document.createElement('canvas'); c.width = 64; c.height = 512;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 512, 0, 0);
    g.addColorStop(0, 'rgba(255,214,140,.85)'); g.addColorStop(.5, 'rgba(255,190,90,.22)'); g.addColorStop(1, 'rgba(255,180,80,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 512);
    x.globalCompositeOperation = 'destination-in';
    const h = x.createLinearGradient(0, 0, 64, 0);
    h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(.5, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = h; x.fillRect(0, 0, 64, 512);
    return new T.CanvasTexture(c);
  }

  function studio(renderer) {
    // A small photo studio, baked into reflections for the metal.
    const s = new T.Scene(); s.background = new T.Color(0x010c08);
    const panel = (col, i, w, h, p) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(col).multiplyScalar(i), side: T.DoubleSide }));
      m.position.set(p[0], p[1], p[2]); m.lookAt(0, 0, 0); s.add(m);
    };
    panel(0xfff1d6, 9, 8, 3, [0, 9, 3]);
    panel(0xffb347, 7, 3, 10, [-9, 1, 4]);
    panel(0x7dffc6, 1.3, 3, 10, [9, 0, 3]);
    panel(0xffffff, 4, 1, 12, [4, 2, 9]);
    panel(0xffd080, 3, 12, 1.5, [0, -8, 4]);
    panel(0x0aa86a, 2, 14, 14, [0, 0, -10]);
    panel(0xffe6bd, .16, 16, 16, [0, -1, 14]);
    panel(0xffffff, 2.4, 2.2, 14, [-5, 0, 12]);
    const pm = new T.PMREMGenerator(renderer);
    const env = pm.fromScene(s, .035).texture; pm.dispose();
    return env;
  }

  function create(canvas) {
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false });
    } catch (e) { return null; }
    let pixelRatio = 1;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(1080, 1920, false);
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(32, 1080 / 1920, .1, 200);
    camera.position.set(0, 0, 14);

    /* The brand background, kept moving: its light drifts and breathes, with ribbons on top */
    const bgTex = new T.Texture();
    bgTex.wrapS = bgTex.wrapT = T.MirroredRepeatWrapping;
    bgTex.colorSpace = T.NoColorSpace; bgTex.generateMipmaps = false; bgTex.minFilter = T.LinearFilter;
    const bgU = { map: { value: bgTex }, t: { value: 0 }, energy: { value: .8 }, gold: { value: .4 }, warp: { value: 0 }, tint: { value: 0 } };
    canvas.style.opacity = 0; // the stage shows the same image until the texture is ready
    const bgImg = new Image();
    bgImg.onload = () => { bgTex.image = bgImg; bgTex.needsUpdate = true; canvas.style.opacity = 1; };
    bgImg.onerror = () => { canvas.style.opacity = 1; };
    bgImg.src = window.NBE_BACKGROUND;
    const bgMat = new T.ShaderMaterial({
      depthTest: false, depthWrite: false, toneMapped: false, uniforms: bgU,
      vertexShader: 'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,1.,1.);}',
      fragmentShader: `
        precision highp float; varying vec2 v; uniform sampler2D map; uniform float t,energy,gold,warp,tint;
        float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
          return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
        float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.03+vec2(11.3,7.1);a*=.5;}return s;}
        void main(){
          vec2 p=v; vec2 q=vec2(p.x*.5625,p.y);
          float d=length((q-vec2(.28125,.46))*vec2(1.,.85));
          float w=fbm(q*1.15+vec2(t*.05,-t*.07));
          float w2=fbm(q*1.9+w*1.3+vec2(-t*.055,t*.04));
          // cover the portrait stage, then let the image flow
          vec2 uv=vec2(.5+(p.x-.5)*.819,p.y);
          uv+=(vec2(w,w2)-.47)*.2;
          uv+=vec2(sin(t*.11),cos(t*.08))*.025;
          vec3 col=texture2D(map,uv).rgb*(.74+.34*energy);
          vec3 lit=vec3(.05,.52,.33), au=vec3(.97,.60,.11);
          // the bottom glow breathes
          col+=lit*smoothstep(.42,.0,p.y)*(.5+.5*sin(t*.45))*.13;
          // slow ribbons of light
          float r=pow(1.-abs(sin((q.y*1.1+q.x*.7+w*.8+t*.012)*3.14159)),3.);
          float r2=pow(1.-abs(sin((q.y*.8-q.x*1.1+w*1.1-t*.016)*3.14159)),4.5);
          col+=lit*r*.08*energy;
          col+=au*r2*(.015+.13*gold)*energy*smoothstep(1.1,.15,d);
          col+=au*w2*w2*tint*.08*energy;
          col+=(lit*.5+au*.5)*warp*pow(max(0.,1.-d*1.5),2.)*1.4;
          col+=(h(gl_FragCoord.xy*.71+fract(t))-.5)/170.;
          gl_FragColor=vec4(col,1.);
        }`
    });
    const bg = new T.Mesh(new T.PlaneGeometry(2, 2), bgMat);
    bg.frustumCulled = false; bg.renderOrder = -10;
    scene.add(bg);

    /* Lighting */
    const env = studio(renderer);
    scene.environment = env;
    const key = new T.DirectionalLight(0xffe2b0, .4); key.position.set(-3, 6, 8); scene.add(key);
    const inner = new T.PointLight(0xffb040, 8, 12, 2); inner.position.set(0, .2, 3); scene.add(inner);

    /* Emblem */
    const gold = new T.MeshStandardMaterial({ color: 0xffc655, metalness: .92, roughness: .36, envMapIntensity: 1.25, emissive: 0x8a5200, emissiveIntensity: .38 });
    const emerald = new T.MeshPhysicalMaterial({ color: 0x00805a, metalness: .9, roughness: .3, clearcoat: .6, clearcoatRoughness: .22, envMapIntensity: 1.05 });
    const G = {
      arch: extrude(ARCH, .85, .07), bowl: extrude(BOWL, .5, .05),
      p1: extrude(P1, .5, .04), p2: extrude(P2, .5, .04), p3: extrude(P3, .5, .04)
    };
    function build(ga, gg) {
      const root = new T.Group();
      const n = { arch: new T.Mesh(G.arch, ga), bowl: new T.Mesh(G.bowl, gg), p1: new T.Mesh(G.p1, gg), p2: new T.Mesh(G.p2, gg), p3: new T.Mesh(G.p3, gg) };
      Object.values(n).forEach(m => root.add(m));
      root.parts = n; return root;
    }
    const emblem = new T.Group(); scene.add(emblem);
    const front = build(emerald, gold); emblem.add(front);
    const refGold = gold.clone(), refEm = emerald.clone();
    [refGold, refEm].forEach(m => { m.transparent = true; m.opacity = .16; m.depthWrite = false; });
    const mirror = build(refEm, refGold);
    const FLOOR = -2.95;
    mirror.scale.y = -1; mirror.position.y = FLOOR * 2;
    emblem.add(mirror);

    const glowMat = new T.SpriteMaterial({ map: glowTexture([[0, 'rgba(255,205,120,.85)'], [.28, 'rgba(255,165,50,.32)'], [.62, 'rgba(0,160,110,.13)'], [1, 'rgba(0,0,0,0)']]), blending: T.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false });
    const glow = new T.Sprite(glowMat); glow.position.set(0, .1, -1.6); glow.scale.set(11, 11, 1); emblem.add(glow);

    const beamTex = beamTexture(), beams = [];
    const beamRoot = new T.Group(); beamRoot.position.set(0, -1.2, -1.5); emblem.add(beamRoot);
    for (let i = 0; i < 9; i++) {
      const m = new T.Mesh(new T.PlaneGeometry(1, 13), new T.MeshBasicMaterial({ map: beamTex, blending: T.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false, opacity: .14 }));
      m.geometry.translate(0, 6.5, 0);
      m.userData = { a: -1.05 + i * (2.1 / 8), w: .6 + (i % 3) * .55, p: i * 1.7 };
      beamRoot.add(m); beams.push(m);
    }

    /* Rising dust of gold */
    const COUNT = 900;
    const pos = new Float32Array(COUNT * 3), seed = new Float32Array(COUNT * 2);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - .5) * 13; pos[i * 3 + 1] = (Math.random() - .5) * 18; pos[i * 3 + 2] = (Math.random() - .5) * 12 - 1;
      seed[i * 2] = Math.random(); seed[i * 2 + 1] = Math.random();
    }
    const pg = new T.BufferGeometry();
    pg.setAttribute('position', new T.BufferAttribute(pos, 3));
    pg.setAttribute('seed', new T.BufferAttribute(seed, 2));
    const dustU = { t: { value: 0 }, lift: { value: 0 }, bright: { value: 1 } };
    const dust = new T.Points(pg, new T.ShaderMaterial({
      uniforms: dustU, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false,
      vertexShader: `attribute vec2 seed; uniform float t,lift; varying float a; varying float g;
        void main(){vec3 p=position;
          p.y=mod(p.y+9.+(t*(.1+seed.x*.25))+lift*(.6+seed.x),18.)-9.;
          p.x+=sin(t*.25+seed.y*6.28)*.35;
          vec4 mv=modelViewMatrix*vec4(p,1.);
          gl_Position=projectionMatrix*mv;
          gl_PointSize=(2.+seed.x*seed.x*11.)*(16./-mv.z);
          a=(.25+.75*abs(sin(t*(.4+seed.y)+seed.x*9.)))*smoothstep(9.,5.,abs(p.y));
          g=seed.y;}`,
      fragmentShader: `varying float a; varying float g; uniform float bright;
        void main(){float d=length(gl_PointCoord-.5);float s=smoothstep(.5,.0,d);s*=s;
          vec3 c=mix(vec3(1.,.72,.3),vec3(.5,1.,.78),step(.78,g));
          gl_FragColor=vec4(c,s*a*.62*bright);}`
    }));
    dust.frustumCulled = false; dust.visible = false; scene.add(dust); // hidden for now

    /* Celebration */
    const CN = 340;
    const confetti = new T.InstancedMesh(new T.PlaneGeometry(.13, .07), new T.MeshBasicMaterial({ side: T.DoubleSide, toneMapped: false }), CN);
    confetti.frustumCulled = false; confetti.visible = false; scene.add(confetti);
    const palette = [0xf89c1c, 0xf5d24e, 0xffffff, 0x00a06a, 0xe0823a, 0xffe7a8].map(c => new T.Color(c));
    const bits = []; for (let i = 0; i < CN; i++) { bits.push({}); confetti.setColorAt(i, palette[i % palette.length]); }
    const ringMat = new T.MeshBasicMaterial({ color: 0xffd28a, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false });
    const ring = new T.Mesh(new T.RingGeometry(.965, 1, 128), ringMat); ring.visible = false; scene.add(ring);
    const dummy = new T.Object3D();

    /* State */
    const pose = Object.assign({}, POSES.attract);
    let target = POSES.attract, rate = 1.6, spin = 0, flying = null, burstAt = -1, tintGoal = 0;
    const clock = new T.Clock();
    let time = 0, lift = 0, fpsT = 0, fpsN = 0;

    function frame() {
      requestAnimationFrame(frame);
      const dt = Math.min(clock.getDelta(), .05);
      time += dt;

      // Ease everything toward the current stage's pose
      if (!flying) for (const k in target) pose[k] = damp(pose[k], target[k], rate, dt);

      if (flying) {
        // The emblem, always whole, sinks while the phone rises to take its place.
        const u = Math.min((performance.now() - flying.t0) / flying.dur, 1); // real time, so slow screens don't stretch it
        const sink = easeInOut(u);
        pose.emY = flying.y0 + (POSES.welcome.emY - flying.y0) * sink;
        pose.sway = damp(pose.sway, 0, 5, dt);
        pose.reflect = damp(pose.reflect, 0, 7, dt);
        pose.energy = damp(pose.energy, POSES.welcome.energy, 2.5, dt);
        pose.gold = damp(pose.gold, POSES.welcome.gold, 2.5, dt);
        bgU.warp.value = Math.sin(u * Math.PI) * .22;
        lift += dt * (.05 + Math.sin(u * Math.PI) * 2.4);
        if (u >= 1) { const r = flying.done; flying = null; Object.assign(pose, POSES.welcome); target = POSES.welcome; r(); }
      } else {
        bgU.warp.value = damp(bgU.warp.value, 0, 3, dt);
        lift += dt * .05;
      }

      emblem.visible = pose.emY > -10;
      key.position.x = Math.sin(time * .55) * 5 - 4;
      camera.position.z = pose.camZ; camera.position.y = pose.camY;
      camera.lookAt(0, pose.camY, pose.camZ - 10);

      emblem.position.set(pose.emX, pose.emY, pose.emZ);
      emblem.scale.setScalar(pose.emS);
      spin = damp(spin, 0, 2.2, dt);
      emblem.rotation.y = Math.sin(time * .35) * .32 * pose.sway + spin;
      emblem.rotation.x = Math.sin(time * .23) * .04 * pose.sway;
      mirror.visible = pose.reflect > .02;
      refGold.opacity = refEm.opacity = .16 * pose.reflect;

      emerald.envMapIntensity = 1.05 * pose.lum; emerald.color.setHex(0x00805a).multiplyScalar(.4 + .6 * pose.lum); key.intensity = .4 * pose.lum;
      inner.intensity = 7 * pose.glow;
      glowMat.opacity = .85 * pose.glow * (1 + Math.sin(time * .9) * .08);
      glow.material.rotation = time * .02;
      beams.forEach(b => {
        const u = b.userData;
        b.rotation.z = u.a + Math.sin(time * .12 + u.p) * .08;
        b.scale.x = u.w * (1 + Math.sin(time * .5 + u.p) * .25);
        b.material.opacity = (.09 + .08 * Math.sin(time * .4 + u.p)) * pose.glow;
      });

      bgU.t.value = time; bgU.energy.value = pose.energy; bgU.gold.value = pose.gold;
      bgU.tint.value = damp(bgU.tint.value, tintGoal, 1.5, dt);
      dustU.t.value = time; dustU.lift.value = lift; dustU.bright.value = .55 + pose.energy * .55;

      // Burst
      if (burstAt >= 0) {
        const a = time - burstAt;
        if (a < .9) {
          ring.visible = true; ring.position.copy(emblem.position).setZ(-.5);
          const e = 1 - Math.pow(1 - a / .9, 3);
          ring.scale.setScalar(.4 + e * 8); ringMat.opacity = (1 - a / .9) * .9;
        } else ring.visible = false;
        for (let i = 0; i < CN; i++) {
          const b = bits[i];
          b.vy -= 3.6 * dt; b.vx *= (1 - .55 * dt); b.vz *= (1 - .55 * dt); b.vy *= (1 - .4 * dt);
          b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.r += b.w * dt;
          dummy.position.set(b.x, b.y + Math.sin(b.r) * .03, b.z);
          dummy.rotation.set(b.r, b.r * .7, b.r * 1.3); dummy.scale.setScalar(b.s);
          dummy.updateMatrix(); confetti.setMatrixAt(i, dummy.matrix);
        }
        confetti.instanceMatrix.needsUpdate = true;
        if (a > 9) { burstAt = -1; confetti.visible = false; ring.visible = false; }
      }

      renderer.render(scene, camera);

      // Hold frame rate on weaker GPUs by trading a little sharpness
      fpsT += dt; fpsN++;
      if (fpsT > 2.5) {
        const fps = fpsN / fpsT; fpsT = 0; fpsN = 0;
        if (!document.hidden && fps < 38 && pixelRatio > .6) {
          pixelRatio = Math.max(.6, pixelRatio - .15);
          renderer.setPixelRatio(pixelRatio); renderer.setSize(1080, 1920, false);
        }
      }
    }

    return {
      start() { requestAnimationFrame(frame); },
      goto(name, speed) {
        target = POSES[name]; rate = speed || 1.6;
        if (name === 'done') { spin = Math.PI * 4; }
      },
      /* The emblem sinks away, handing the stage to the phone. */
      handoff(dur) {
        return new Promise(res => {
          flying = { t0: performance.now(), dur: dur || 1500, y0: pose.emY, done: res };
        });
      },
      jump(name) { Object.assign(pose, POSES[name]); target = POSES[name]; },
      burst() {
        burstAt = time; confetti.visible = true;
        const o = emblem.position;
        for (let i = 0; i < CN; i++) {
          const a = Math.random() * 6.283, f = 2 + Math.random() * 7.5, up = Math.random() * 5.5;
          Object.assign(bits[i], { x: o.x, y: o.y, z: Math.random() * 1.5, vx: Math.cos(a) * f * .75, vy: Math.sin(a) * f + up, vz: (Math.random() - .3) * 4, r: Math.random() * 6, w: 2 + Math.random() * 9, s: .6 + Math.random() * 1.1 });
        }
      },
      tint(v) { tintGoal = v; },
      pulse() { bgU.warp.value = Math.max(bgU.warp.value, .28); lift += .6; }
    };
  }

  return { create };
})();
