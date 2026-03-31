import { BoundingBox, Color, Entity, LIGHTTYPE_DIRECTIONAL, Mesh, MeshInstance, Script, StandardMaterial, Vec3 } from 'playcanvas';
import viewerSettings from "viewerSettings" with { type: "json" };

const VIEWER_HEIGHT = 450;

let currentMode = 'splat';
let splatEntity = null;
let meshEntity = null;

// --- Binary PLY Parser ---

function parseBinaryPLY(buffer) {
    const bytes = new Uint8Array(buffer);

    // Find end of ASCII header
    const headerEnd = findHeaderEnd(bytes);
    if (headerEnd === -1) throw new Error('Invalid PLY: no end_header found');
    const headerText = new TextDecoder().decode(bytes.slice(0, headerEnd));
    const dataStart = headerEnd + 'end_header\n'.length;

    // Parse header for counts
    const vertexMatch = headerText.match(/element vertex (\d+)/);
    const faceMatch = headerText.match(/element face (\d+)/);
    if (!vertexMatch || !faceMatch) throw new Error('Invalid PLY: missing vertex/face element counts');
    const vertexCount = parseInt(vertexMatch[1]);
    const faceCount = parseInt(faceMatch[1]);

    // Count float properties per vertex (x, y, z, s, t = 5 floats)
    const propLines = headerText.split('\n').filter(l => l.startsWith('property float'));
    const floatsPerVertex = propLines.length;

    const view = new DataView(buffer, dataStart);
    let offset = 0;

    // Read vertices
    const positions = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    for (let i = 0; i < vertexCount; i++) {
        positions[i * 3] = view.getFloat32(offset, true); offset += 4;
        positions[i * 3 + 1] = view.getFloat32(offset, true); offset += 4;
        positions[i * 3 + 2] = view.getFloat32(offset, true); offset += 4;
        if (floatsPerVertex >= 5) {
            uvs[i * 2] = view.getFloat32(offset, true); offset += 4;
            uvs[i * 2 + 1] = view.getFloat32(offset, true); offset += 4;
        }
    }

    // Read faces (triangulate quads into 2 triangles each)
    const indexList = [];
    for (let i = 0; i < faceCount; i++) {
        const count = view.getUint8(offset); offset += 1;
        const face = [];
        for (let j = 0; j < count; j++) {
            face.push(view.getUint32(offset, true)); offset += 4;
        }
        // Fan triangulation: works for tris and quads
        for (let j = 1; j < count - 1; j++) {
            indexList.push(face[0], face[j], face[j + 1]);
        }
    }
    const indices = new Uint32Array(indexList);

    // Compute normals
    const normals = computeNormals(positions, indices, vertexCount);

    return { positions, normals, uvs, indices };
}

function findHeaderEnd(bytes) {
    const headerChunk = new TextDecoder().decode(bytes.slice(0, 8192));
    const idx = headerChunk.indexOf('end_header');
    return idx === -1 ? -1 : idx;
}

function computeNormals(positions, indices, vertexCount) {
    const normals = new Float32Array(vertexCount * 3);
    for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i], i1 = indices[i + 1], i2 = indices[i + 2];
        const ax = positions[i1 * 3] - positions[i0 * 3];
        const ay = positions[i1 * 3 + 1] - positions[i0 * 3 + 1];
        const az = positions[i1 * 3 + 2] - positions[i0 * 3 + 2];
        const bx = positions[i2 * 3] - positions[i0 * 3];
        const by = positions[i2 * 3 + 1] - positions[i0 * 3 + 1];
        const bz = positions[i2 * 3 + 2] - positions[i0 * 3 + 2];
        const nx = ay * bz - az * by;
        const ny = az * bx - ax * bz;
        const nz = ax * by - ay * bx;
        for (const idx of [i0, i1, i2]) {
            normals[idx * 3] += nx;
            normals[idx * 3 + 1] += ny;
            normals[idx * 3 + 2] += nz;
        }
    }
    // Normalize
    for (let i = 0; i < vertexCount; i++) {
        const x = normals[i * 3], y = normals[i * 3 + 1], z = normals[i * 3 + 2];
        const len = Math.sqrt(x * x + y * y + z * z) || 1;
        normals[i * 3] /= len;
        normals[i * 3 + 1] /= len;
        normals[i * 3 + 2] /= len;
    }
    return normals;
}

// --- Mesh Entity Creation ---

function getThemeMeshColor() {
    const isDark = document.documentElement.classList.contains('dark');
    // Warm tones matching the site palette
    return isDark
        ? new Color(0.83, 0.53, 0.35) // --accent in dark: #d4865a
        : new Color(0.69, 0.36, 0.18); // --accent in light: #b05c2f
}

let meshMaterial = null;

function syncMeshColor() {
    if (!meshMaterial) return;
    const c = getThemeMeshColor();
    meshMaterial.diffuse = c;
    meshMaterial.ambient = c;
    meshMaterial.update();
}

function createMeshEntity(app, meshData) {
    const positions = Array.from(meshData.positions);
    const normals = Array.from(meshData.normals);
    const uvs = Array.from(meshData.uvs);
    const indices = Array.from(meshData.indices);

    // Center the mesh at origin based on its bounding box
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < positions.length; i += 3) {
        minX = Math.min(minX, positions[i]);     maxX = Math.max(maxX, positions[i]);
        minY = Math.min(minY, positions[i + 1]); maxY = Math.max(maxY, positions[i + 1]);
        minZ = Math.min(minZ, positions[i + 2]); maxZ = Math.max(maxZ, positions[i + 2]);
    }
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
    for (let i = 0; i < positions.length; i += 3) {
        positions[i] -= cx;
        positions[i + 1] -= cy;
        positions[i + 2] -= cz;
    }

    const mesh = new Mesh(app.graphicsDevice);
    mesh.setPositions(positions);
    mesh.setNormals(normals);
    mesh.setUvs(0, uvs);
    mesh.setIndices(indices);
    mesh.update();

    // Set scene ambient light so shading works
    app.scene.ambientLight = new Color(0.3, 0.3, 0.3);

    meshMaterial = new StandardMaterial();
    meshMaterial.diffuse = getThemeMeshColor();
    meshMaterial.ambient = getThemeMeshColor();
    meshMaterial.gloss = 0.4;
    meshMaterial.metalness = 0.0;
    meshMaterial.cull = 0; // CULLFACE_NONE - render both sides
    meshMaterial.update();

    const meshInstance = new MeshInstance(mesh, meshMaterial);

    const entity = new Entity('mesh');
    entity.addComponent('render', { type: 'asset' });
    entity.render.meshInstances = [meshInstance];
    entity.setLocalEulerAngles(0, 0, 180);
    entity.enabled = false;

    return entity;
}

// --- Toggle ---

function toggleView() {
    if (!splatEntity || !meshEntity) return;
    currentMode = currentMode === 'splat' ? 'mesh' : 'splat';
    splatEntity.enabled = currentMode === 'splat';
    meshEntity.enabled = currentMode === 'mesh';

    const btn = document.getElementById('viewer-toggle');
    if (currentMode === 'splat') {
        btn.innerHTML = '\u25B3';
        btn.title = 'Switch to Mesh view';
    } else {
        btn.innerHTML = '\u25CF';
        btn.title = 'Switch to 3DGS view';
    }
}

// --- Main ---

document.addEventListener('DOMContentLoaded', async () => {
    if (!document.querySelector('pc-app')) return;

    const position = viewerSettings.camera.position && new Vec3(viewerSettings.camera.position);
    const target = viewerSettings.camera.target && new Vec3(viewerSettings.camera.target);

    class FrameScene extends Script {
        frameScene(bbox) {
            const sceneSize = bbox.halfExtents.length();
            const distance = sceneSize / Math.sin(this.entity.camera.fov / 180 * Math.PI * 0.5);
            this.entity.script.cameraControls.sceneSize = sceneSize;
            this.entity.script.cameraControls.focus(
                bbox.center,
                new Vec3(2, 1, 2).normalize().mulScalar(distance).add(bbox.center)
            );
        }

        resetCamera(bbox) {
            const sceneSize = bbox.halfExtents.length();
            this.entity.script.cameraControls.sceneSize = sceneSize * 0.2;
            this.entity.script.cameraControls.focus(
                target ?? Vec3.ZERO,
                position ?? new Vec3(2, 1, 2)
            );
        }

        calcBound() {
            const gsplatComponents = this.app.root.findComponents('gsplat');
            return gsplatComponents?.[0]?.instance?.meshInstance?.aabb ?? new BoundingBox();
        }

        initCamera() {
            const indicator = document.getElementById('loadingIndicator');
            if (indicator) indicator.classList.add('hidden');

            const bbox = this.calcBound();
            if (bbox.halfExtents.length() > 100 || position || target) {
                this.resetCamera(bbox);
            } else {
                this.frameScene(bbox);
            }
        }

        postInitialize() {
            const assets = this.app.assets.filter(asset => asset.type === 'gsplat');
            if (assets.length > 0) {
                const asset = assets[0];
                if (asset.loaded) {
                    this.initCamera();
                } else {
                    asset.on('load', () => this.initCamera());
                }
            }
        }
    }

    const appElement = await document.querySelector('pc-app').ready();
    const cameraElement = await document.querySelector('pc-entity[name="camera"]').ready();

    const app = await appElement.app;
    const camera = cameraElement.entity;

    const col = document.getElementById('splat-viewer-col');
    const width = col ? col.offsetWidth : 380;
    app.setCanvasFillMode('NONE', width, VIEWER_HEIGHT);

    function syncBgColor() {
        const hex = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        camera.camera.clearColor = new Color(r, g, b);
    }

    syncBgColor();
    new MutationObserver(() => { syncBgColor(); syncMeshColor(); }).observe(document.documentElement, { attributeFilter: ['class'] });

    camera.camera.fov = viewerSettings.camera.fov;
    camera.script.create(FrameScene);

    // --- Load mesh and wire toggle ---
    splatEntity = app.root.findByName('splat');

    try {
        const response = await fetch(new URL('test_mesh.ply', import.meta.url));
        if (!response.ok) throw new Error(`HTTP ${response.status} loading mesh PLY`);
        const buffer = await response.arrayBuffer();
        const meshData = parseBinaryPLY(buffer);
        meshEntity = createMeshEntity(app, meshData);
        splatEntity.parent.addChild(meshEntity);

        const btn = document.getElementById('viewer-toggle');
        if (btn) {
            btn.classList.add('ready');
            btn.addEventListener('click', toggleView);
        }
    } catch (e) {
        console.warn('Failed to load mesh PLY, toggle disabled:', e);
    }
});
