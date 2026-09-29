import {
  Box3,
  MathUtils,
  Object3D,
  PerspectiveCamera,
  SkinnedMesh,
  Vector3,
} from 'three';

export const CAMERA_FIT_MARGIN = 1.12;
export const CAMERA_VIEW_DIRECTION = new Vector3(0, 0.08, 1).normalize();
export const CAMERA_CORE_JOINT_WEIGHT = 0.5;

export function isDescendantOf(node: Object3D, ancestor: Object3D): boolean {
  for (let current: Object3D | null = node; current; current = current.parent) {
    if (current === ancestor) return true;
  }
  return false;
}

export interface SkeletonBranchLayout {
  commonJoints: number[];
  branches: Array<{ root: Object3D; joints: number[] }>;
}

/**
 * Finds the skeleton's common ancestor bone, then groups every other bone
 * into whichever direct child branch of that ancestor it descends from.
 * Branches are ordered largest-first so callers can pick "the primary limb
 * group" (e.g. the torso/head branch vs. a cape or weapon bone chain).
 */
export function skeletonBranchLayout(
  mesh: SkinnedMesh,
): SkeletonBranchLayout | null {
  const bones = mesh.skeleton.bones;
  if (!bones.length) return null;

  const ancestors: Object3D[] = [];
  for (
    let current: Object3D | null = bones[0];
    current;
    current = current.parent
  ) {
    ancestors.push(current);
  }
  const commonAncestor = ancestors.find((ancestor) =>
    bones.every((bone) => isDescendantOf(bone, ancestor)),
  );
  if (!commonAncestor) return null;

  const commonJoints = new Set<number>();
  const branches = new Map<Object3D, number[]>();
  bones.forEach((bone, index) => {
    if (bone === commonAncestor) {
      commonJoints.add(index);
      return;
    }
    let branch: Object3D = bone;
    while (branch.parent && branch.parent !== commonAncestor) {
      branch = branch.parent;
    }
    if (branch.parent !== commonAncestor) return;
    const joints = branches.get(branch) ?? [];
    joints.push(index);
    branches.set(branch, joints);
  });

  return {
    commonJoints: [...commonJoints],
    branches: [...branches.entries()]
      .map(([root, joints]) => ({ root, joints }))
      .sort((left, right) => right.joints.length - left.joints.length),
  };
}

/** The common-ancestor joints plus the largest limb branch, treated as "the core body". */
export function primarySkeletonJoints(mesh: SkinnedMesh): Set<number> | null {
  const layout = skeletonBranchLayout(mesh);
  const primaryBranch = layout?.branches[0];
  if (!layout || !primaryBranch) return null;
  return new Set([...layout.commonJoints, ...primaryBranch.joints]);
}

/**
 * World-space bounding box of the first skinned mesh with at least
 * `vertexCount` vertices, restricted to vertices whose skin weight is
 * dominated by the "core body" joints (see `primarySkeletonJoints`) — this
 * excludes capes, weapons, or other loosely-attached bone chains from the
 * camera-framing box so the character stays centered.
 */
export function primaryActorBounds(
  model: Object3D,
  vertexCount: number,
): Box3 | null {
  model.updateWorldMatrix(true, true);
  let result: Box3 | null = null;
  model.traverse((child) => {
    if (result || !(child instanceof SkinnedMesh)) return;
    const positions = child.geometry.getAttribute('position');
    if (!positions || positions.count < vertexCount) return;
    const skinIndices = child.geometry.getAttribute('skinIndex');
    const skinWeights = child.geometry.getAttribute('skinWeight');
    const primaryJoints = primarySkeletonJoints(child);

    child.skeleton.update();
    const box = new Box3();
    const vertex = new Vector3();
    for (let index = 0; index < vertexCount; index += 1) {
      if (primaryJoints && skinIndices && skinWeights) {
        const indices = [
          skinIndices.getX(index),
          skinIndices.getY(index),
          skinIndices.getZ(index),
          skinIndices.getW(index),
        ];
        const weights = [
          skinWeights.getX(index),
          skinWeights.getY(index),
          skinWeights.getZ(index),
          skinWeights.getW(index),
        ];
        const coreWeight = weights.reduce(
          (total, weight, influence) =>
            total + (primaryJoints.has(indices[influence]) ? weight : 0),
          0,
        );
        if (coreWeight < CAMERA_CORE_JOINT_WEIGHT) continue;
      }
      vertex.fromBufferAttribute(positions, index);
      child.applyBoneTransform(index, vertex);
      box.expandByPoint(vertex.applyMatrix4(child.matrixWorld));
    }
    if (!box.isEmpty()) result = box;
  });
  return result;
}

/**
 * Camera distance along `viewDirection` needed so that `box`, viewed from
 * `center`, fits within `camera`'s frustum (with `CAMERA_FIT_MARGIN` slack).
 */
export function projectedFitDistance(
  box: Box3,
  center: Vector3,
  viewDirection: Vector3,
  camera: PerspectiveCamera,
): number {
  const forward = viewDirection.clone().negate();
  const right = forward.clone().cross(camera.up).normalize();
  const up = right.clone().cross(forward).normalize();
  const verticalTangent = Math.tan(MathUtils.degToRad(camera.fov) / 2);
  const horizontalTangent = verticalTangent * camera.aspect;
  let distance = 0;

  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) {
        const offset = new Vector3(x, y, z).sub(center);
        const depth = offset.dot(viewDirection);
        distance = Math.max(
          distance,
          depth +
            (Math.abs(offset.dot(right)) * CAMERA_FIT_MARGIN) /
              horizontalTangent,
          depth +
            (Math.abs(offset.dot(up)) * CAMERA_FIT_MARGIN) / verticalTangent,
        );
      }
    }
  }

  return Math.max(distance, 0.1);
}
