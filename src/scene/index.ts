import { Engine } from '@babylonjs/core/Engines/engine';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateTorus } from '@babylonjs/core/Meshes/Builders/torusBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateLines } from '@babylonjs/core/Meshes/Builders/linesBuilder';
import { CAMERA_HOME, CAMERA_FORWARD } from '../contracts';
import type { SceneFacade, SceneSnapshot } from '../contracts';
import { createEnvironment, material } from './environment';
import { applyPose, createInstrument } from './instrument';
import { createIncisionPatch } from './incision';
import { createFirstPersonNavigation, usesFirstPersonNavigation } from './first-person-navigation';

export function createScene(canvas: HTMLCanvasElement): SceneFacade {
  return createSceneRuntime(new Engine(canvas, true)).facade;
}

/** Engine injection is for headless scene checks. The app alone owns animation scheduling. */
export function createSceneRuntime(engine: AbstractEngine) {
  const scene = new Scene(engine);
  scene.useRightHandedSystem = true;
  scene.clearColor = new Color4(0.034, 0.062, 0.076, 1);
  const camera = new FreeCamera('fixed-camera', new Vector3(...CAMERA_HOME), scene);
  camera.setTarget(camera.position.add(new Vector3(...CAMERA_FORWARD)));
  camera.inputs.clear();
  camera.minZ = 0.5;
  camera.maxZ = 1100;
  camera.fov = 0.72;
  const ambient = new HemisphericLight('soft-room', new Vector3(0, 1, 0), scene);
  ambient.intensity = 0.72;
  ambient.groundColor = Color3.FromHexString('#22363c');
  const light = new DirectionalLight('surgical-softbox', new Vector3(-0.4, -1, -0.35), scene);
  light.position.set(70, 160, 80);
  light.intensity = 1.45;
  const shadows = new ShadowGenerator(1024, light);
  shadows.usePoissonSampling = true;
  shadows.bias = 0.001;
  shadows.normalBias = 0.04;
  shadows.setDarkness(0.2);
  const environment = createEnvironment(scene);
  for (const mesh of environment) shadows.addShadowCaster(mesh);
  const incision = createIncisionPatch(scene);
  for (const mesh of incision.meshes) shadows.addShadowCaster(mesh);
  const instrument = createInstrument(scene, false);
  for (const mesh of instrument.meshes) shadows.addShadowCaster(mesh);
  const ghost = createInstrument(scene, true);
  ghost.root.setEnabled(false);
  const firstPerson = createFirstPersonNavigation(scene, camera);

  const mint = material(scene, 'target-mint', '#80f7c9');
  mint.emissiveColor = new Color3(0.18, 0.47, 0.35);
  mint.disableLighting = true;
  const target = new TransformNode('target', scene);
  const ring = CreateTorus('target-tolerance', { diameter: 2, thickness: 0.075, tessellation: 64 }, scene);
  ring.material = mint;
  ring.parent = target;
  const targetCenter = CreateSphere('target-center', { diameter: 1.6, segments: 12 }, scene);
  targetCenter.parent = target;
  targetCenter.material = mint;
  const targetDirection = new TransformNode('target-direction', scene);
  targetDirection.parent = target;
  const arrowShaft = CreateCylinder('direction-shaft', { height: 10, diameter: 0.55, tessellation: 8 }, scene);
  arrowShaft.rotation.x = Math.PI / 2;
  arrowShaft.position.z = -5;
  arrowShaft.parent = targetDirection;
  arrowShaft.material = mint;
  const arrowHead = CreateCylinder('direction-arrow', { height: 3, diameterTop: 0, diameterBottom: 2.6, tessellation: 12 }, scene);
  arrowHead.rotation.x = -Math.PI / 2;
  arrowHead.position.z = -11;
  arrowHead.parent = targetDirection;
  arrowHead.material = mint;
  // A faint stalk and surface ring make the airborne target's height readable.
  const stalk = CreateCylinder('target-height', { height: 1, diameter: 0.22, tessellation: 6 }, scene);
  stalk.material = mint;
  stalk.visibility = 0.25;
  const footprint = CreateTorus('target-footprint', { diameter: 4, thickness: 0.15, tessellation: 32 }, scene);
  footprint.material = mint;
  footprint.visibility = 0.4;

  const obstacleMaterial = material(scene, 'protected-volume', '#d99663', 45);
  obstacleMaterial.alpha = 0.35;
  const obstacles = new Map<string, Mesh>();
  const trailPoints = Array.from({ length: 96 }, () => new Vector3());
  let trailCount = 0;
  let previousMode: SceneSnapshot['exercise']['mode'] | null = null;
  const trail = CreateLines('tool-trail', { points: trailPoints, updatable: true }, scene);
  trail.color = new Color3(0.5, 0.9, 0.82);
  trail.alpha = 0.42;
  trail.isPickable = false;
  trail.alwaysSelectAsActiveMesh = true;
  let disposed = false;

  const facade: SceneFacade = {
    render(snapshot) {
      if (disposed) return;
      incision.update(snapshot.exercise.mode === 'incision' ? snapshot.incision : null);
      camera.position.copyFromFloats(...snapshot.cameraPositionMm);
      const firstPersonMode = usesFirstPersonNavigation(snapshot.exercise.mode);
      for (const mesh of environment) mesh.setEnabled(!firstPersonMode);
      firstPerson.update(snapshot.exercise.mode, snapshot.applied.pose);
      applyPose(instrument.root, snapshot.applied.pose);
      instrument.root.setEnabled(!firstPersonMode);
      ghost.root.setEnabled(!firstPersonMode && snapshot.applied.mismatch);
      if (!firstPersonMode && snapshot.applied.mismatch) applyPose(ghost.root, snapshot.applied.requestedPose);
      const currentTarget = snapshot.exercise.target;
      const visibleTarget = currentTarget !== null && snapshot.exercise.phase !== 'completed';
      target.setEnabled(visibleTarget);
      stalk.setEnabled(visibleTarget);
      footprint.setEnabled(visibleTarget);
      if (currentTarget && visibleTarget) {
        target.position.copyFromFloats(...currentTarget.positionMm);
        const radius = Math.max(0.5, currentTarget.positionToleranceMm);
        ring.scaling.set(radius, 1, radius);
        targetDirection.setEnabled(currentTarget.direction !== null);
        if (currentTarget.direction) applyPose(targetDirection, { positionMm: [0, 0, 0], direction: currentTarget.direction, directionKind: 'virtual-mapped' });
        const height = Math.max(0.1, currentTarget.positionMm[1] - 7);
        stalk.scaling.y = height;
        stalk.position.set(currentTarget.positionMm[0], 7 + height / 2, currentTarget.positionMm[2]);
        footprint.position.set(currentTarget.positionMm[0], 7, currentTarget.positionMm[2]);
      }
      const activeIds = new Set(snapshot.obstacles.map(obstacle => obstacle.id));
      for (const [id, mesh] of obstacles) if (!activeIds.has(id)) { mesh.dispose(); obstacles.delete(id); }
      for (const obstacle of snapshot.obstacles) {
        let mesh = obstacles.get(obstacle.id);
        if (!mesh) {
          mesh = CreateBox(`obstacle-${obstacle.id}`, { size: 1 }, scene);
          mesh.material = obstacleMaterial;
          mesh.receiveShadows = true;
          obstacles.set(obstacle.id, mesh);
        }
        mesh.position.set(...obstacle.min.map((n, i) => (n + obstacle.max[i]!) / 2) as [number, number, number]);
        mesh.scaling.set(...obstacle.min.map((n, i) => obstacle.max[i]! - n) as [number, number, number]);
        mesh.visibility = snapshot.applied.contactIds.includes(obstacle.id) ? 1 : 0.7;
      }
      if (!snapshot.showTrail || snapshot.exercise.mode !== previousMode || snapshot.exercise.phase === 'ready') trailCount = 0;
      previousMode = snapshot.exercise.mode;
      if (snapshot.showTrail) {
        const point = new Vector3(...snapshot.applied.pose.positionMm);
        if (trailCount === 0) {
          for (const value of trailPoints) value.copyFrom(point);
          trailCount = 1;
        } else if (Vector3.DistanceSquared(trailPoints[trailPoints.length - 1]!, point) > 0.36) {
          for (let i = 0; i < trailPoints.length - 1; i++) trailPoints[i]!.copyFrom(trailPoints[i + 1]!);
          trailPoints[trailPoints.length - 1]!.copyFrom(point);
          trailCount = Math.min(trailPoints.length, trailCount + 1);
        }
        CreateLines('tool-trail', { points: trailPoints, instance: trail });
      }
      trail.setEnabled(snapshot.showTrail && trailCount > 1);
      scene.render();
    },
    resize() { if (!disposed) engine.resize(); },
    dispose() { if (!disposed) { disposed = true; scene.dispose(); engine.dispose(); } },
  };
  return { facade, scene, camera };
}
