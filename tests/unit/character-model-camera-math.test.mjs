import assert from 'node:assert/strict';
import test from 'node:test';
import { Box3, Object3D, PerspectiveCamera, Vector3 } from 'three';
import {
  isDescendantOf,
  projectedFitDistance,
  skeletonBranchLayout,
} from '../../src/features/characters/components/character-model-camera-math.ts';

function makeObject(name) {
  const object = new Object3D();
  object.name = name;
  return object;
}

test('isDescendantOf walks up the parent chain', () => {
  const grandparent = makeObject('grandparent');
  const parent = makeObject('parent');
  const child = makeObject('child');
  const stranger = makeObject('stranger');
  grandparent.add(parent);
  parent.add(child);

  assert.ok(isDescendantOf(child, grandparent));
  assert.ok(isDescendantOf(child, parent));
  assert.ok(isDescendantOf(child, child));
  assert.ok(!isDescendantOf(child, stranger));
});

/**
 * Builds a fake SkinnedMesh with a bone hierarchy shaped like:
 *   root
 *     torso (common ancestor)
 *       leftArm -> leftHand
 *       rightArm
 *       cape (small branch)
 * `skeletonBranchLayout` only reads `mesh.skeleton.bones`, so a plain object
 * with that shape stands in for a real SkinnedMesh here.
 */
function makeFakeSkinnedMesh() {
  const root = makeObject('root');
  const torso = makeObject('torso');
  const leftArm = makeObject('leftArm');
  const leftHand = makeObject('leftHand');
  const rightArm = makeObject('rightArm');
  const cape = makeObject('cape');
  root.add(torso);
  torso.add(leftArm);
  leftArm.add(leftHand);
  torso.add(rightArm);
  torso.add(cape);

  // Bone order intentionally doesn't match traversal order, since real
  // skeletons don't guarantee that either.
  const bones = [torso, leftArm, leftHand, rightArm, cape];
  return { skeleton: { bones } };
}

test('skeletonBranchLayout groups bones under the skeleton-wide common ancestor', () => {
  const mesh = makeFakeSkinnedMesh();
  const layout = skeletonBranchLayout(mesh);
  assert.ok(layout);
  // torso is bones[0] and is its own common ancestor.
  assert.deepEqual(layout.commonJoints, [0]);
  // Two branches: [leftArm(1), leftHand(2)] and [rightArm(3)] and [cape(4)] —
  // sorted largest-first.
  assert.equal(layout.branches.length, 3);
  assert.deepEqual(layout.branches[0].joints.sort(), [1, 2]);
});

test('skeletonBranchLayout returns null for an empty skeleton', () => {
  assert.equal(skeletonBranchLayout({ skeleton: { bones: [] } }), null);
});

test('projectedFitDistance grows with box size and shrinks with wider fov', () => {
  const camera = new PerspectiveCamera(32, 16 / 9);
  const center = new Vector3(0, 0, 0);
  const viewDirection = new Vector3(0, 0, 1);

  const smallBox = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
  const largeBox = new Box3(new Vector3(-5, -5, -5), new Vector3(5, 5, 5));

  const smallDistance = projectedFitDistance(
    smallBox,
    center,
    viewDirection,
    camera,
  );
  const largeDistance = projectedFitDistance(
    largeBox,
    center,
    viewDirection,
    camera,
  );
  assert.ok(largeDistance > smallDistance);

  const wideCamera = new PerspectiveCamera(90, 16 / 9);
  const wideFovDistance = projectedFitDistance(
    smallBox,
    center,
    viewDirection,
    wideCamera,
  );
  assert.ok(wideFovDistance < smallDistance);
});

test('projectedFitDistance never returns less than the 0.1 floor', () => {
  const camera = new PerspectiveCamera(120, 1);
  const point = new Vector3(0, 0, 0);
  const degenerateBox = new Box3(point, point.clone());
  const distance = projectedFitDistance(
    degenerateBox,
    point,
    new Vector3(0, 0, 1),
    camera,
  );
  assert.equal(distance, 0.1);
});
