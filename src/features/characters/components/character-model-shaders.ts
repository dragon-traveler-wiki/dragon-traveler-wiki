import { DataTexture, RGBAFormat, UnsignedByteType } from 'three';

export const vertexShader = /* glsl */ `
  #include <common>
  #include <skinning_pars_vertex>
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    #include <beginnormal_vertex>
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    vWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
    #include <begin_vertex>
    #include <skinning_vertex>
    vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const fragmentShader = /* glsl */ `
  uniform sampler2D baseMap;
  uniform sampler2D shadeMap;
  uniform sampler2D emissionMap;
  uniform sampler2D mraMap;
  uniform vec3 lightDirection;
  uniform float emissionStrength;
  uniform float indirectLight;
  uniform float shadowThreshold;
  uniform float shadowSoftness;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec4 base = texture2D(baseMap, vUv);
    vec3 authoredShade = texture2D(shadeMap, vUv).rgb;
    vec3 emission = texture2D(emissionMap, vUv).rgb;
    vec3 mra = texture2D(mraMap, vUv).rgb;
    vec3 normal = normalize(vWorldNormal);
    vec3 light = normalize(lightDirection);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 halfDirection = normalize(light + viewDirection);
    float halfLambert = dot(normal, light) * 0.5 + 0.5;
    float toonLight = smoothstep(shadowThreshold - shadowSoftness, shadowThreshold + shadowSoftness, halfLambert);
    vec3 color = mix(mix(authoredShade, base.rgb, indirectLight), base.rgb, toonLight);
    float metallic = mra.r;
    float roughness = clamp(mra.g, 0.04, 1.0);
    float specular = pow(max(dot(normal, halfDirection), 0.0), mix(96.0, 8.0, roughness));
    color += mix(vec3(0.04), base.rgb, metallic) * specular * toonLight * 0.22;
    color += base.rgb * pow(1.0 - max(dot(normal, viewDirection), 0.0), 3.0) * toonLight * 0.08;
    color += emission * emissionStrength;
    gl_FragColor = vec4(color, base.a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const outlineVertexShader = /* glsl */ `
  #include <common>
  #include <skinning_pars_vertex>
  uniform float outlineWidth;
  void main() {
    #include <beginnormal_vertex>
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    #include <begin_vertex>
    #include <skinning_vertex>
    transformed += objectNormal * outlineWidth;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

export const outlineFragmentShader = /* glsl */ `
  void main() {
    gl_FragColor = vec4(0.055, 0.04, 0.075, 1.0);
  }
`;

export function neutralTexture(r: number, g: number, b: number): DataTexture {
  const texture = new DataTexture(
    new Uint8Array([r, g, b, 255]),
    1,
    1,
    RGBAFormat,
    UnsignedByteType,
  );
  texture.needsUpdate = true;
  return texture;
}
