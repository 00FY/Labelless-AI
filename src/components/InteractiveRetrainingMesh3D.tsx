import React, { useEffect, useRef, useState } from 'react';
import { ACTIVE_LEARNING_ROUNDS } from '../data/fallbackPresets';
import * as THREE from 'three';
import { Sparkles, RotateCw, ZoomIn, Eye, Activity, Layers, Zap } from 'lucide-react';

interface InteractiveRetrainingMesh3DProps {
  className?: string;
  height?: string;
  currentRound?: number;
}

export const InteractiveRetrainingMesh3D: React.FC<InteractiveRetrainingMesh3DProps> = ({
  className = '',
  height = 'h-72 sm:h-80',
  currentRound = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeRound, setActiveRound] = useState<number>(currentRound);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'mesh' | 'synapses' | 'particles'>('mesh');
  const [hoveredNode, setHoveredNode] = useState<{ id: string; type: string; entropy: string } | null>(null);

  // Store Three.js objects in refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 320;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8.5);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing and alpha
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Clear previous children if any
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x10b981, 3, 20); // Emerald
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x38bdf8, 2.5, 20); // Sky blue
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xf59e0b, 2, 20); // Amber
    pointLight3.position.set(0, 5, -5);
    scene.add(pointLight3);

    // 5. Build Retraining Mesh Group
    const meshGroup = new THREE.Group();
    meshGroupRef.current = meshGroup;
    scene.add(meshGroup);

    // Geodesic / Icosahedron Retraining Geometry
    const detailLevel = 2;
    const geometry = new THREE.IcosahedronGeometry(2.8, detailLevel);
    
    // Wireframe Mesh (Neural Loss Surface)
    const wireframeMaterial = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.65,
    });
    const wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
    wireframeMesh.name = 'wireframeMesh';
    meshGroup.add(wireframeMesh);

    // Inner Glowing Core (Representing Checkpoint Weights)
    const innerCoreGeometry = new THREE.SphereGeometry(1.4, 24, 24);
    const innerCoreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x10b981,
      roughness: 0.1,
      transmission: 0.75,
      thickness: 1.2,
      transparent: true,
      opacity: 0.55,
      wireframe: true,
    });
    const innerCore = new THREE.Mesh(innerCoreGeometry, innerCoreMaterial);
    innerCore.name = 'innerCore';
    meshGroup.add(innerCore);

    // Synapse Nodes on Vertices
    const posAttribute = geometry.getAttribute('position');
    const nodeSpheres: THREE.Mesh[] = [];
    const nodeColors = [0x10b981, 0x38bdf8, 0xf59e0b, 0xef4444, 0xa855f7];

    for (let i = 0; i < posAttribute.count; i += 3) {
      const vx = posAttribute.getX(i);
      const vy = posAttribute.getY(i);
      const vz = posAttribute.getZ(i);

      const sphereGeo = new THREE.SphereGeometry(0.08, 12, 12);
      const color = nodeColors[i % nodeColors.length];
      const sphereMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      });

      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(vx, vy, vz);
      sphere.userData = {
        nodeIndex: i,
        entropy: (0.2 + (Math.sin(i * 1.5) + 1) * 0.35).toFixed(2),
        type: i % 2 === 0 ? 'High-Entropy Gradient' : 'Auto-Labeled Anchor',
      };
      meshGroup.add(sphere);
      nodeSpheres.push(sphere);
    }

    // Outer Orbiting Data Ring (Active Learning Sampling Stream)
    const ringGeo = new THREE.TorusGeometry(3.6, 0.03, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    ring.rotation.y = Math.PI / 6;
    ring.name = 'orbitRing';
    meshGroup.add(ring);

    // Particles along the ring
    const particleCount = 40;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let p = 0; p < particleCount; p++) {
      const angle = (p / particleCount) * Math.PI * 2;
      particlePositions[p * 3] = Math.cos(angle) * 3.6;
      particlePositions[p * 3 + 1] = Math.sin(angle) * 3.6;
      particlePositions[p * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 0.12,
      transparent: true,
      opacity: 0.9,
    });
    const ringParticles = new THREE.Points(particleGeo, particleMat);
    ring.add(ringParticles);

    // Mouse Interaction: Click & Drag to Orbit, Raycasting for Hover
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && meshGroupRef.current) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        meshGroupRef.current.rotation.y += deltaX * 0.008;
        meshGroupRef.current.rotation.x += deltaY * 0.008;

        previousMousePosition = { x: e.clientX, y: e.clientY };
      }

      // Raycast hover check
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeSpheres);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData) {
          setHoveredNode({
            id: `Vertex #${hit.userData.nodeIndex}`,
            type: hit.userData.type,
            entropy: hit.userData.entropy,
          });
        }
      } else {
        setHoveredNode(null);
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (cameraRef.current) {
        cameraRef.current.position.z = THREE.MathUtils.clamp(
          cameraRef.current.position.z + e.deltaY * 0.005,
          4.5,
          14
        );
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });

    // Window Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (cameraRef.current && rendererRef.current && newWidth > 0 && newHeight > 0) {
          cameraRef.current.aspect = newWidth / newHeight;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      if (meshGroupRef.current) {
        // Continuous slow rotation if enabled
        meshGroupRef.current.rotation.y += 0.003;
        meshGroupRef.current.rotation.x = Math.sin(elapsedTime * 0.3) * 0.15;

        // Wave pulsing effect on mesh vertices to visualize gradient convergence
        const wire = meshGroupRef.current.getObjectByName('wireframeMesh') as THREE.Mesh;
        if (wire) {
          const scale = 1 + Math.sin(elapsedTime * 1.5) * 0.02;
          wire.scale.set(scale, scale, scale);
        }

        const ringObj = meshGroupRef.current.getObjectByName('orbitRing');
        if (ringObj) {
          ringObj.rotation.z += 0.005;
        }
      }

      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElement.removeEventListener('wheel', handleWheel);
      renderer.dispose();
      geometry.dispose();
      wireframeMaterial.dispose();
      innerCoreGeometry.dispose();
      innerCoreMaterial.dispose();
    };
  }, []);

  // Update mesh tightness based on Active Learning round
  useEffect(() => {
    if (!meshGroupRef.current) return;
    const wire = meshGroupRef.current.getObjectByName('wireframeMesh') as THREE.Mesh;
    const core = meshGroupRef.current.getObjectByName('innerCore') as THREE.Mesh;

    if (wire && wire.material instanceof THREE.MeshStandardMaterial) {
      if (activeRound === 0) {
        // Cold start: looser, reddish-amber
        wire.material.color.setHex(0xf59e0b);
        wire.material.opacity = 0.5;
        if (core) core.scale.set(0.8, 0.8, 0.8);
      } else if (activeRound < 0) {
        // Mid rounds: sky blue
        wire.material.color.setHex(0x0284c7);
        wire.material.opacity = 0.65;
        if (core) core.scale.set(1.0, 1.0, 1.0);
      } else {
        // After human-labelled retraining: bright emerald
        wire.material.color.setHex(0x10b981);
        wire.material.opacity = 0.8;
        if (core) core.scale.set(1.15, 1.15, 1.15);
      }
    }
  }, [activeRound]);

  // Handle View Mode switch
  useEffect(() => {
    if (!meshGroupRef.current) return;
    const wire = meshGroupRef.current.getObjectByName('wireframeMesh') as THREE.Mesh;
    const core = meshGroupRef.current.getObjectByName('innerCore') as THREE.Mesh;
    const ring = meshGroupRef.current.getObjectByName('orbitRing') as THREE.Mesh;

    if (wire && core && ring) {
      if (viewMode === 'mesh') {
        wire.visible = true;
        core.visible = true;
        ring.visible = true;
      } else if (viewMode === 'synapses') {
        wire.visible = false;
        core.visible = true;
        ring.visible = true;
      } else if (viewMode === 'particles') {
        wire.visible = true;
        core.visible = false;
        ring.visible = true;
      }
    }
  }, [viewMode]);

  return (
    <div
      className={`relative w-full rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-xl overflow-hidden select-none ${height} ${className}`}
    >
      {/* 3D WebGL Canvas Mount */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left HUD Telemetry */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/70 text-white text-xs font-mono shadow-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold tracking-wider uppercase text-[11px] text-emerald-400">
            Active Retraining Mesh 3D
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 font-semibold">Round {activeRound}</span>
          <span className="text-emerald-400 font-bold">
            {ACTIVE_LEARNING_ROUNDS.find((r) => r.round === activeRound)?.mAP50 ?? '—'}% mAP
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono px-1 flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-sky-400" />
          <span>Illustrative visual · Click & Drag to Orbit · Scroll to Zoom</span>
        </div>
      </div>

      {/* Top Right Tooltip on Node Hover */}
      {hoveredNode && (
        <div className="absolute top-3 right-3 z-20 bg-slate-900/95 backdrop-blur-md p-2.5 rounded-xl border border-sky-500/50 text-white text-xs font-mono shadow-2xl space-y-0.5 pointer-events-none animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 text-sky-400 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{hoveredNode.id}</span>
          </div>
          <div className="text-[11px] text-slate-300">{hoveredNode.type}</div>
          <div className="text-[10px] text-amber-400 font-bold">Entropy: {hoveredNode.entropy}</div>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-3 inset-x-3 z-10 flex flex-wrap items-center justify-between gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-xs font-mono">
        {/* Round Switcher */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Retrain Iteration:</span>
          {ACTIVE_LEARNING_ROUNDS.map(({ round: r }) => (
            <button
              key={r}
              onClick={() => setActiveRound(r)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                activeRound === r
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              R{r}
            </button>
          ))}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1">
          {(['mesh', 'synapses', 'particles'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2 py-0.5 rounded text-[11px] capitalize font-medium transition-all ${
                viewMode === mode
                  ? 'bg-sky-500/30 text-sky-300 border border-sky-500/50'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
