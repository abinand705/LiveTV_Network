import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { CameraPreset, Channel, ProgramSlot, StreamTelemetry } from '../types';

interface BroadcastStudio3DProps {
  primaryVideoElement: HTMLVideoElement | null;
  secondaryVideoElement: HTMLVideoElement | null;
  activeChannel: Channel | null;
  secondaryChannel: Channel | null;
  currentProgram: ProgramSlot | null;
  telemetry: StreamTelemetry;
  cameraPreset: CameraPreset;
  isMultiView: boolean;
  onSelectScreen?: () => void;
}

// Pre-allocated module-scope scratch objects to guarantee Zero GC inside the animation loop
const _camTargetPos = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _tempMatrix = new THREE.Matrix4();
const _tempPos = new THREE.Vector3();
const _tempQuat = new THREE.Quaternion();
const _tempScale = new THREE.Vector3();
const _tempColor = new THREE.Color();

const CAMERA_PRESETS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  studio: { pos: [0, 3.3, 8.6], target: [0, 2.1, -1.2] },
  screen: { pos: [0, 2.45, 4.3], target: [0, 2.45, -2.2] },
  console: { pos: [2.4, 2.6, 5.2], target: [0, 1.35, 1.4] },
  dual: { pos: [1.1, 2.5, 5.8], target: [1.3, 2.35, -1.8] },
};

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 120);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.32)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function createStudioFloorGridTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#090b10';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.09)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let i = 64; i < 512; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 16);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createConsoleTelemetryTexture(maxAnisotropy: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return { canvas, ctx, texture };
}

export const BroadcastStudio3D: React.FC<BroadcastStudio3DProps> = ({
  primaryVideoElement,
  secondaryVideoElement,
  activeChannel,
  secondaryChannel,
  currentProgram,
  telemetry,
  cameraPreset,
  isMultiView,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);

  // Store latest props in refs so React UI updates never tear down the WebGL canvas
  const stateRef = useRef({
    activeChannel,
    secondaryChannel,
    currentProgram,
    telemetry,
    cameraPreset,
    isMultiView,
    primaryVideoElement,
    secondaryVideoElement,
  });

  useEffect(() => {
    stateRef.current = {
      activeChannel,
      secondaryChannel,
      currentProgram,
      telemetry,
      cameraPreset,
      isMultiView,
      primaryVideoElement,
      secondaryVideoElement,
    };
  }, [
    activeChannel,
    secondaryChannel,
    currentProgram,
    telemetry,
    cameraPreset,
    isMultiView,
    primaryVideoElement,
    secondaryVideoElement,
  ]);

  const activePresetTransitionRef = useRef<boolean>(true);
  useEffect(() => {
    activePresetTransitionRef.current = true;
  }, [cameraPreset]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // 1. Software WebGL detection from GPU renderer string
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    // 2. Scene, Horizon Fog & Mandatory Studio Environment Reflection (RoomEnvironment)
    const scene = new THREE.Scene();
    const bgColor = new THREE.Color(0x090b10);
    scene.background = bgColor;
    scene.fog = new THREE.FogExp2(0x090b10, 0.032);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Camera & Damped OrbitControls
    const camera = new THREE.PerspectiveCamera(
      48,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.1,
      100
    );
    camera.position.set(0, 3.3, 8.6);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2.1, -1.2);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.04; // Never clip below studio floor
    controls.minDistance = 2.4;
    controls.maxDistance = 16;

    controls.addEventListener('start', () => {
      activePresetTransitionRef.current = false;
    });

    // 4. Studio 3-Point Lighting Rig + Area Softboxes
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x090b10, 0.65);
    hemiLight.position.set(0, 12, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff3e0, 1.9);
    keyLight.position.set(5.5, 8.5, 6.0);
    keyLight.castShadow = !isSoftwareGl;
    const d = 9;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.SpotLight(0x06b6d4, 2.6, 22, Math.PI / 4, 0.6, 1.5);
    rimLight.position.set(-6, 6.5, -5.5);
    rimLight.target.position.set(0, 2.0, -1.5);
    scene.add(rimLight);
    scene.add(rimLight.target);

    const biasLight = new THREE.PointLight(0xf59e0b, 2.2, 12, 1.8);
    biasLight.position.set(0, 2.6, -1.6);
    scene.add(biasLight);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softboxLeft = new THREE.RectAreaLight(0x38bdf8, 3.2, 3.0, 1.2);
      softboxLeft.position.set(-4.5, 4.8, -1.0);
      softboxLeft.lookAt(0, 2.2, -2.0);
      scene.add(softboxLeft);

      const softboxRight = new THREE.RectAreaLight(0xf59e0b, 2.8, 3.0, 1.2);
      softboxRight.position.set(4.5, 4.8, -1.0);
      softboxRight.lookAt(0, 2.2, -2.0);
      scene.add(softboxRight);
    }

    // 5. Studio Architecture & Floor with Contact Shadow Grounding
    const floorGridTex = createStudioFloorGridTexture(maxAnisotropy);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0d111a,
      roughness: 0.35,
      metalness: 0.25,
      map: floorGridTex,
    });
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(44, 44), floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const contactShadowTex = createContactShadowTexture();
    const createGroundedShadow = (w: number, h: number, x: number, z: number) => {
      const mat = new THREE.MeshBasicMaterial({
        map: contactShadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.55,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(x, 0.02, z);
      scene.add(plane);
    };

    // Shared PBR Material Library (varied roughness >= 0.25 across adjacent parts)
    const darkTitaniumMat = new THREE.MeshPhysicalMaterial({
      color: 0x161b26,
      metalness: 0.88,
      roughness: 0.22,
      clearcoat: 0.4,
    });
    const mattePolymerMat = new THREE.MeshStandardMaterial({
      color: 0x0f131c,
      metalness: 0.15,
      roughness: 0.78,
    });
    const brushedChromeMat = new THREE.MeshPhysicalMaterial({
      color: 0xcbd5e1,
      metalness: 0.95,
      roughness: 0.16,
    });
    const warmWalnutMat = new THREE.MeshStandardMaterial({
      color: 0x2c1d14,
      metalness: 0.08,
      roughness: 0.55,
    });
    const amberAccentMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.85,
      roughness: 0.3,
    });
    const cyanAccentMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.75,
      roughness: 0.3,
    });
    const opticalGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      metalness: 0,
      roughness: 0.08,
      transmission: isSoftwareGl ? 0 : 0.9,
      transparent: true,
      opacity: isSoftwareGl ? 0.38 : 1,
      ior: 1.52,
      thickness: 0.6,
      depthWrite: false,
    });

    // Live Broadcast Canvas Fallback & Secondary Monitor Texture
    const primaryFallback = createConsoleTelemetryTexture(maxAnisotropy);
    const secondaryScreenCanvas = createConsoleTelemetryTexture(maxAnisotropy);

    // -------------------------------------------------------------------------
    // HERO ASSEMBLY 1: Master Broadcast Video Wall & Truss Rig (9-part Group)
    // -------------------------------------------------------------------------
    const videoWallGroup = new THREE.Group();
    videoWallGroup.position.set(0, 0, -2.3);
    scene.add(videoWallGroup);
    createGroundedShadow(6.8, 2.4, 0, -2.3);

    // Part 1: Raised Studio Stage Plinth
    const plinthGeo = new THREE.BoxGeometry(6.6, 0.24, 1.8);
    const plinthMesh = new THREE.Mesh(plinthGeo, mattePolymerMat);
    plinthMesh.position.set(0, 0.12, 0);
    plinthMesh.receiveShadow = true;
    videoWallGroup.add(plinthMesh);

    // Part 2: Amber Stage Edge Light Strip
    const stageStripMesh = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.03, 0.04), amberAccentMat);
    stageStripMesh.position.set(0, 0.22, 0.9);
    videoWallGroup.add(stageStripMesh);

    // Part 3 & 4: Twin Vertical Hydraulic Truss Pillars (LatheGeometry)
    const pillarPoints = [
      new THREE.Vector2(0.18, 0),
      new THREE.Vector2(0.18, 0.3),
      new THREE.Vector2(0.11, 0.4),
      new THREE.Vector2(0.11, 3.8),
      new THREE.Vector2(0.15, 4.1),
      new THREE.Vector2(0, 4.1),
    ];
    const pillarGeo = new THREE.LatheGeometry(pillarPoints, 20);
    [-2.1, 2.1].forEach((xPos) => {
      const pillar = new THREE.Mesh(pillarGeo, brushedChromeMat);
      pillar.position.set(xPos, 0.24, -0.35);
      pillar.castShadow = true;
      videoWallGroup.add(pillar);
    });

    // Part 5: Overhead Broadcast Gantry Beam
    const gantryBeam = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.14, 0.22), darkTitaniumMat);
    gantryBeam.position.set(0, 4.25, -0.2);
    videoWallGroup.add(gantryBeam);

    // Part 6: Outer Beveled Broadcast Monitor Frame
    const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(4.95, 2.86, 0.16), darkTitaniumMat);
    frameMesh.position.set(0, 2.45, 0);
    frameMesh.castShadow = true;
    videoWallGroup.add(frameMesh);

    // Part 7: Inner Anodized Bezel Trim
    const innerBezel = new THREE.Mesh(new THREE.BoxGeometry(4.78, 2.69, 0.18), mattePolymerMat);
    innerBezel.position.set(0, 2.45, 0.01);
    videoWallGroup.add(innerBezel);

    // Part 8: Active Primary Broadcast Screen Surface (16:9)
    const primaryScreenMat = new THREE.MeshBasicMaterial({
      map: primaryFallback.texture,
      toneMapped: false,
    });
    const primaryScreenMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.64, 2.61), primaryScreenMat);
    primaryScreenMesh.position.set(0, 2.45, 0.11);
    videoWallGroup.add(primaryScreenMesh);

    // Part 9: Top "ON AIR" Broadcast Tally Light Housing
    const tallyHousing = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.12), darkTitaniumMat);
    tallyHousing.position.set(0, 3.98, 0.05);
    videoWallGroup.add(tallyHousing);

    const tallyGlow = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.09, 0.14), amberAccentMat);
    tallyGlow.position.set(0, 3.98, 0.06);
    videoWallGroup.add(tallyGlow);

    // -------------------------------------------------------------------------
    // AUXILIARY MULTI-VIEW MONITOR RIG (Right Wing, 5-part Group)
    // -------------------------------------------------------------------------
    const auxWingGroup = new THREE.Group();
    auxWingGroup.position.set(3.85, 0, -1.35);
    auxWingGroup.rotation.y = -0.38;
    scene.add(auxWingGroup);
    createGroundedShadow(2.8, 1.4, 3.85, -1.35);

    const auxPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.22, 2.1, 20), brushedChromeMat);
    auxPedestal.position.set(0, 1.05, 0);
    auxWingGroup.add(auxPedestal);

    const auxFrame = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.38, 0.1), darkTitaniumMat);
    auxFrame.position.set(0, 2.25, 0.06);
    auxFrame.castShadow = true;
    auxWingGroup.add(auxFrame);

    const auxScreenMat = new THREE.MeshBasicMaterial({
      map: secondaryScreenCanvas.texture,
      toneMapped: false,
    });
    const auxScreenMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.24), auxScreenMat);
    auxScreenMesh.position.set(0, 2.25, 0.12);
    auxWingGroup.add(auxScreenMesh);

    const auxAccentBar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.03, 0.12), cyanAccentMat);
    auxAccentBar.position.set(0, 1.54, 0.07);
    auxWingGroup.add(auxAccentBar);

    // -------------------------------------------------------------------------
    // HERO ASSEMBLY 2: Master Broadcast Control Console Desk (10-part Group)
    // -------------------------------------------------------------------------
    const consoleGroup = new THREE.Group();
    consoleGroup.position.set(0, 0, 1.55);
    scene.add(consoleGroup);
    createGroundedShadow(3.9, 1.8, 0, 1.55);

    // Part 1 & 2: Left & Right Curved Console Support Legs
    [-1.45, 1.45].forEach((xPos) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.92, 0.95), darkTitaniumMat);
      leg.position.set(xPos, 0.46, 0);
      leg.castShadow = true;
      consoleGroup.add(leg);
    });

    // Part 3: Modesty Acoustic Front Panel
    const modestyPanel = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.65, 0.08), mattePolymerMat);
    modestyPanel.position.set(0, 0.48, -0.38);
    consoleGroup.add(modestyPanel);

    // Part 4: Main Walnut & Brushed Metal Console Tabletop
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.09, 1.15), warmWalnutMat);
    deskTop.position.set(0, 0.94, 0);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    consoleGroup.add(deskTop);

    // Part 5: Sloped Broadcast Switcher Deck
    const mixerDeck = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.12, 0.62), darkTitaniumMat);
    mixerDeck.position.set(0, 1.03, 0.05);
    mixerDeck.rotation.x = 0.14;
    consoleGroup.add(mixerDeck);

    // Part 6: Illuminated Program/Preview Bus Bar
    const busBar = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.025, 0.08), cyanAccentMat);
    busBar.position.set(-0.2, 1.1, 0.16);
    busBar.rotation.x = 0.14;
    consoleGroup.add(busBar);

    // Part 7: Rotary Broadcast Jog/Shuttle Wheel (LatheGeometry)
    const wheelPoints = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.14, 0),
      new THREE.Vector2(0.15, 0.05),
      new THREE.Vector2(0.11, 0.08),
      new THREE.Vector2(0, 0.08),
    ];
    const jogWheel = new THREE.Mesh(new THREE.LatheGeometry(wheelPoints, 24), brushedChromeMat);
    jogWheel.position.set(0.95, 1.09, 0.12);
    jogWheel.rotation.x = 0.14;
    consoleGroup.add(jogWheel);

    // Part 8 & 9: Dual Angled Engineering Telemetry Monitors on Desk Bridge
    [-0.65, 0.65].forEach((xPos, idx) => {
      const monFrame = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.5, 0.05), darkTitaniumMat);
      monFrame.position.set(xPos, 1.28, -0.36);
      monFrame.rotation.x = -0.32;
      consoleGroup.add(monFrame);

      const monScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.82, 0.44),
        new THREE.MeshBasicMaterial({
          map: idx === 0 ? primaryFallback.texture : secondaryScreenCanvas.texture,
        })
      );
      monScreen.position.set(xPos, 1.28, -0.33);
      monScreen.rotation.x = -0.32;
      consoleGroup.add(monScreen);
    });

    // Part 10: Instanced Console Faders & T-Bar Controls (24 instances)
    const faderCapGeo = new THREE.BoxGeometry(0.035, 0.04, 0.07);
    const faderInstanced = new THREE.InstancedMesh(faderCapGeo, brushedChromeMat, 24);
    for (let i = 0; i < 24; i++) {
      const row = Math.floor(i / 12);
      const col = i % 12;
      const x = -0.95 + col * 0.14;
      const z = row === 0 ? -0.05 : 0.18;
      const y = 1.09 - z * 0.14;
      _tempPos.set(x, y, z);
      _tempQuat.setFromEuler(new THREE.Euler(0.14, 0, 0));
      _tempScale.set(1, 1, 1);
      _tempMatrix.compose(_tempPos, _tempQuat, _tempScale);
      faderInstanced.setMatrixAt(i, _tempMatrix);
    }
    faderInstanced.instanceMatrix.needsUpdate = true;
    faderInstanced.computeBoundingSphere();
    consoleGroup.add(faderInstanced);

    // -------------------------------------------------------------------------
    // HERO ASSEMBLY 3: Robotic Studio Pedestal Camera (8-part Group, Left Flank)
    // -------------------------------------------------------------------------
    const studioCamGroup = new THREE.Group();
    studioCamGroup.position.set(-3.3, 0, 0.6);
    studioCamGroup.rotation.y = -0.52;
    scene.add(studioCamGroup);
    createGroundedShadow(1.6, 1.6, -3.3, 0.6);

    // Part 1: 3-Spoke Studio Dolly Base (flush at Y=0)
    const dollyBase = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.12, 6), darkTitaniumMat);
    dollyBase.position.set(0, 0.06, 0);
    studioCamGroup.add(dollyBase);

    // Part 2: Pneumatic Telescoping Pedestal Column (LatheGeometry)
    const pedPoints = [
      new THREE.Vector2(0.18, 0),
      new THREE.Vector2(0.18, 0.65),
      new THREE.Vector2(0.13, 0.7),
      new THREE.Vector2(0.13, 1.35),
      new THREE.Vector2(0.09, 1.4),
      new THREE.Vector2(0.09, 1.85),
      new THREE.Vector2(0, 1.85),
    ];
    const pedColumn = new THREE.Mesh(new THREE.LatheGeometry(pedPoints, 20), mattePolymerMat);
    pedColumn.position.set(0, 0.12, 0);
    pedColumn.castShadow = true;
    studioCamGroup.add(pedColumn);

    // Part 3: Steering Ring
    const steeringRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.025, 12, 28), brushedChromeMat);
    steeringRing.rotation.x = Math.PI / 2;
    steeringRing.position.set(0, 1.25, 0);
    studioCamGroup.add(steeringRing);

    // Part 4: Pan/Tilt Head Assembly (animated subtly in tick)
    const camHeadGroup = new THREE.Group();
    camHeadGroup.position.set(0, 2.05, 0);
    studioCamGroup.add(camHeadGroup);

    const camBody = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.68), darkTitaniumMat);
    camBody.castShadow = true;
    camHeadGroup.add(camBody);

    // Part 5: Cinema Zoom Lens Barrel
    const lensBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.45, 24), brushedChromeMat);
    lensBarrel.rotation.x = Math.PI / 2;
    lensBarrel.position.set(0, 0, -0.52);
    camHeadGroup.add(lensBarrel);

    // Part 6: Optical Front Glass Element (MeshPhysicalMaterial)
    const lensGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 24), opticalGlassMat);
    lensGlass.rotation.x = Math.PI / 2;
    lensGlass.position.set(0, 0, -0.74);
    lensGlass.renderOrder = 2;
    camHeadGroup.add(lensGlass);

    // Part 7: Teleprompter Hood & Beam-Splitter Glass
    const prompterGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.36), opticalGlassMat);
    prompterGlass.position.set(0, 0.05, -0.88);
    prompterGlass.rotation.x = -Math.PI / 4;
    prompterGlass.renderOrder = 3;
    camHeadGroup.add(prompterGlass);

    // Part 8: Camera Tally Indicator
    const camTally = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.06), amberAccentMat);
    camTally.position.set(0, 0.24, -0.25);
    camHeadGroup.add(camTally);

    // -------------------------------------------------------------------------
    // INSTANCED ACOUSTIC STUDIO DIFFUSER WALL (> 20 items -> 36 instances)
    // -------------------------------------------------------------------------
    const slatCount = 36;
    const slatGeo = new THREE.BoxGeometry(0.16, 4.2, 0.22);
    const slatMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.55,
      metalness: 0.35,
    });
    const acousticInstanced = new THREE.InstancedMesh(slatGeo, slatMat, slatCount);
    for (let i = 0; i < slatCount; i++) {
      const t = (i / (slatCount - 1)) * 2 - 1; // -1 to 1
      const angle = t * 0.95;
      const radius = 8.2;
      const x = Math.sin(angle) * radius;
      const z = -Math.cos(angle) * radius + 2.2;
      const scaleY = 0.85 + 0.28 * Math.cos(t * Math.PI * 1.5);
      _tempPos.set(x, (4.2 * scaleY) / 2, z);
      _tempQuat.setFromEuler(new THREE.Euler(0, -angle, 0));
      _tempScale.set(1, scaleY, 1);
      _tempMatrix.compose(_tempPos, _tempQuat, _tempScale);
      acousticInstanced.setMatrixAt(i, _tempMatrix);

      // Subtle tint variation across slats
      _tempColor.setHSL(0.6 + (i % 5) * 0.01, 0.28, 0.12 + (i % 3) * 0.02);
      acousticInstanced.setColorAt(i, _tempColor);
    }
    acousticInstanced.instanceMatrix.needsUpdate = true;
    if (acousticInstanced.instanceColor) acousticInstanced.instanceColor.needsUpdate = true;
    acousticInstanced.computeBoundingSphere();
    scene.add(acousticInstanced);

    // Pre-warm shaders on GPU
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // VideoTextures cache so we only wrap each HTMLVideoElement once
    let boundPrimaryVideo: HTMLVideoElement | null = null;
    let primaryVideoTex: THREE.VideoTexture | null = null;
    let boundSecondaryVideo: HTMLVideoElement | null = null;
    let secondaryVideoTex: THREE.VideoTexture | null = null;

    // Draw rich procedural broadcast graphics onto fallback/telemetry canvases
    let lastCanvasDrawTime = 0;
    const drawProceduralScreens = (elapsed: number) => {
      if (elapsed - lastCanvasDrawTime < 0.2) return;
      lastCanvasDrawTime = elapsed;

      const { activeChannel: ch, secondaryChannel: secCh, currentProgram: prog, telemetry: tel, isMultiView: mv } =
        stateRef.current;

      // 1. Primary fallback/standby graphic (shown when video is loading or in standby)
      const pCtx = primaryFallback.ctx;
      pCtx.fillStyle = '#0b0f19';
      pCtx.fillRect(0, 0, 1024, 512);

      // Broadcast grid lines
      pCtx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
      pCtx.lineWidth = 2;
      pCtx.strokeRect(36, 36, 952, 440);

      // Color bars header accent
      const barColors = ['#f59e0b', '#06b6d4', '#10b981', '#3b82f6', '#ec4899', '#eab308'];
      barColors.forEach((c, idx) => {
        pCtx.fillStyle = c;
        pCtx.fillRect(60 + idx * 70, 64, 58, 8);
      });

      pCtx.fillStyle = '#94a3b8';
      pCtx.font = '600 20px "JetBrains Mono", monospace';
      pCtx.fillText(
        `CH ${ch?.number || 100}  ·  ${(ch?.group || 'BROADCAST').toUpperCase()}  ·  ${(
          ch?.language || 'INDIA'
        ).toUpperCase()}`,
        60,
        118
      );

      pCtx.fillStyle = '#f8fafc';
      pCtx.font = '700 46px "Outfit", sans-serif';
      pCtx.fillText((ch?.name || 'AetherCast India Studio').slice(0, 32), 60, 182);

      pCtx.fillStyle = '#f59e0b';
      pCtx.font = '600 26px "Plus Jakarta Sans", sans-serif';
      pCtx.fillText(`NOW: ${(prog?.title || 'Live National Broadcast').slice(0, 44)}`, 60, 242);

      pCtx.fillStyle = '#cbd5e1';
      pCtx.font = '400 20px "Plus Jakarta Sans", sans-serif';
      pCtx.fillText((prog?.description || 'Connecting to adaptive HLS / MPEG-DASH stream...').slice(0, 68), 60, 286);

      // Status readout box
      pCtx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      pCtx.fillRect(60, 340, 904, 96);
      pCtx.strokeStyle = tel.status === 'error' ? '#ef4444' : '#06b6d4';
      pCtx.strokeRect(60, 340, 904, 96);

      pCtx.fillStyle = tel.status === 'error' ? '#fca5a5' : '#38bdf8';
      pCtx.font = '600 22px "JetBrains Mono", monospace';
      const statusText =
        tel.status === 'loading'
          ? 'TUNING LIVE TRANSPONDER FEED...'
          : tel.status === 'recovering'
          ? 'AUTO-RECOVERING STREAM BUFFER...'
          : tel.status === 'error'
          ? 'SIGNAL STANDBY — USE MIRROR OR BACKUP FEED IN DOCK'
          : `LIVE FEED ACTIVE · ${tel.format.toUpperCase()} · ${tel.resolution}`;
      pCtx.fillText(statusText, 88, 396);
      primaryFallback.texture.needsUpdate = true;

      // 2. Secondary Monitor Screen (shows either Multi-View status or Live EPG Matrix)
      const sCtx = secondaryScreenCanvas.ctx;
      sCtx.fillStyle = '#090d16';
      sCtx.fillRect(0, 0, 1024, 512);
      sCtx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      sCtx.lineWidth = 3;
      sCtx.strokeRect(28, 28, 968, 456);

      sCtx.fillStyle = '#06b6d4';
      sCtx.font = '600 22px "JetBrains Mono", monospace';
      sCtx.fillText(mv ? 'MULTI-VIEW AUXILIARY FEED' : 'STUDIO EPG & TELEMETRY MONITOR', 56, 82);

      sCtx.fillStyle = '#f8fafc';
      sCtx.font = '700 38px "Outfit", sans-serif';
      sCtx.fillText(
        mv && secCh ? `CH ${secCh.number} · ${secCh.name.slice(0, 26)}` : `BITRATE: ${tel.bitrateKbps || 2400} KBPS`,
        56,
        148
      );

      // Draw animated audio/signal spectrum bars on engineering monitor
      for (let b = 0; b < 24; b++) {
        const wave = Math.abs(Math.sin(elapsed * 3.2 + b * 0.45));
        const barH = Math.round(40 + wave * 180);
        sCtx.fillStyle = b > 19 ? '#f59e0b' : '#06b6d4';
        sCtx.fillRect(56 + b * 38, 420 - barH, 26, barH);
      }
      secondaryScreenCanvas.texture.needsUpdate = true;
    };

    // 6. Paced Render Loop with Software-WebGL fenceSync guard
    const clock = new THREE.Clock();
    let frameId = 0;
    let isDisposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (isDisposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      const {
        primaryVideoElement: pVid,
        secondaryVideoElement: sVid,
        telemetry: tel,
        cameraPreset: preset,
        isMultiView: mv,
      } = stateRef.current;

      // Bind or switch Primary VideoTexture when video has decoded frames
      if (pVid && pVid !== boundPrimaryVideo) {
        boundPrimaryVideo = pVid;
        if (primaryVideoTex) primaryVideoTex.dispose();
        primaryVideoTex = new THREE.VideoTexture(pVid);
        primaryVideoTex.colorSpace = THREE.SRGBColorSpace;
        primaryVideoTex.minFilter = THREE.LinearFilter;
        primaryVideoTex.magFilter = THREE.LinearFilter;
      }

      if (pVid && pVid.readyState >= 2 && tel.status === 'playing' && primaryVideoTex) {
        if (primaryScreenMat.map !== primaryVideoTex) {
          primaryScreenMat.map = primaryVideoTex;
          primaryScreenMat.needsUpdate = true;
        }
      } else {
        if (primaryScreenMat.map !== primaryFallback.texture) {
          primaryScreenMat.map = primaryFallback.texture;
          primaryScreenMat.needsUpdate = true;
        }
      }

      // Bind or switch Secondary VideoTexture on Auxiliary Right Monitor
      if (sVid && sVid !== boundSecondaryVideo) {
        boundSecondaryVideo = sVid;
        if (secondaryVideoTex) secondaryVideoTex.dispose();
        secondaryVideoTex = new THREE.VideoTexture(sVid);
        secondaryVideoTex.colorSpace = THREE.SRGBColorSpace;
        secondaryVideoTex.minFilter = THREE.LinearFilter;
        secondaryVideoTex.magFilter = THREE.LinearFilter;
      }

      if (mv && sVid && sVid.readyState >= 2 && secondaryVideoTex) {
        if (auxScreenMat.map !== secondaryVideoTex) {
          auxScreenMat.map = secondaryVideoTex;
          auxScreenMat.needsUpdate = true;
        }
      } else {
        if (auxScreenMat.map !== secondaryScreenCanvas.texture) {
          auxScreenMat.map = secondaryScreenCanvas.texture;
          auxScreenMat.needsUpdate = true;
        }
      }

      drawProceduralScreens(elapsed);

      // Subtle robotic pedestal camera pan motion
      camHeadGroup.rotation.y = Math.sin(elapsed * 0.35) * 0.18;

      // Smooth exponential damping for camera preset transitions
      if (activePresetTransitionRef.current) {
        const targetCfg = CAMERA_PRESETS[preset] || CAMERA_PRESETS.studio;
        _camTargetPos.set(targetCfg.pos[0], targetCfg.pos[1], targetCfg.pos[2]);
        _camLookTarget.set(targetCfg.target[0], targetCfg.target[1], targetCfg.target[2]);

        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camTargetPos.x, 4.2, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camTargetPos.y, 4.2, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camTargetPos.z, 4.2, delta);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, _camLookTarget.x, 4.2, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _camLookTarget.y, 4.2, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _camLookTarget.z, 4.2, delta);

        if (
          camera.position.distanceToSquared(_camTargetPos) < 0.002 &&
          controls.target.distanceToSquared(_camLookTarget) < 0.002
        ) {
          activePresetTransitionRef.current = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      if (primaryVideoTex) primaryVideoTex.dispose();
      if (secondaryVideoTex) secondaryVideoTex.dispose();
      primaryFallback.texture.dispose();
      secondaryScreenCanvas.texture.dispose();
      floorGridTex.dispose();
      contactShadowTex.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={canvasMountRef}
      className="fixed inset-0 w-screen h-screen overflow-hidden z-0 bg-[#090b10]"
      aria-label="Interactive 3D Television Broadcast Studio"
    />
  );
};
