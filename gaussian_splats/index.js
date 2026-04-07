import { BoundingBox, Color, Entity, Mesh, MeshInstance, PRIMITIVE_TRIANGLES, Script, StandardMaterial, Vec3 } from 'playcanvas';
import viewerSettings from "viewerSettings" with { type: "json" };

const VIEWER_HEIGHT = 450;
const PLY_MESH_URL = 'gaussian_splats/bike_decimated_aligned.ply';

let currentMode = 'splat';
let splatEntity = null;
let meshEntity = null;

// --- Toggle between 3DGS splat and PLY mesh within the same PlayCanvas app ---

function toggleView() {
    const btn = document.getElementById('viewer-toggle');
    if (!btn || !splatEntity || !meshEntity) return;

    currentMode = currentMode === 'splat' ? 'mesh' : 'splat';

    splatEntity.enabled = currentMode === 'splat';
    meshEntity.enabled = currentMode === 'mesh';

    if (currentMode === 'mesh') {
        btn.innerHTML = '<span class="toggle-icon">\u25D3</span> 3DGS';
        btn.title = 'Switch to 3DGS view';
    } else {
        btn.innerHTML = '<span class="toggle-icon">\u25B5</span> Mesh';
        btn.title = 'Switch to Mesh view';
    }
}

// --- PLY binary parser ---

async function parsePly(url) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Find end_header
    let headerEnd = 0;
    for (let i = 0; i < Math.min(bytes.length, 4096); i++) {
        if (bytes[i] === 0x65 &&
            new TextDecoder().decode(bytes.slice(i, i + 11)) === 'end_header\n') {
            headerEnd = i + 11;
            break;
        }
    }

    const headerText = new TextDecoder().decode(bytes.slice(0, headerEnd));
    let vertexCount = 0, faceCount = 0;
    for (const line of headerText.split('\n')) {
        let m = line.match(/^element vertex (\d+)/);
        if (m) vertexCount = parseInt(m[1]);
        m = line.match(/^element face (\d+)/);
        if (m) faceCount = parseInt(m[1]);
    }

    const dataView = new DataView(buffer, headerEnd);
    let off = 0;

    // Vertices: 3 floats each (x, y, z)
    const positions = new Float32Array(vertexCount * 3);
    for (let i = 0; i < vertexCount * 3; i++) {
        positions[i] = dataView.getFloat32(off, true);
        off += 4;
    }

    // Faces: uchar count + uint[] vertex_indices
    const indices = [];
    for (let i = 0; i < faceCount; i++) {
        const n = dataView.getUint8(off); off += 1;
        const vi = [];
        for (let j = 0; j < n; j++) {
            vi.push(dataView.getUint32(off, true)); off += 4;
        }
        // Triangulate using fan
        for (let j = 1; j < n - 1; j++) {
            indices.push(vi[0], vi[j], vi[j + 1]);
        }
    }

    return { positions, indices: new Uint32Array(indices) };
}

// --- Compute smooth vertex normals from face geometry ---

function computeNormals(positions, indices) {
    const normals = new Float32Array(positions.length);
    for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i] * 3, i1 = indices[i + 1] * 3, i2 = indices[i + 2] * 3;
        const ax = positions[i1] - positions[i0], ay = positions[i1 + 1] - positions[i0 + 1], az = positions[i1 + 2] - positions[i0 + 2];
        const bx = positions[i2] - positions[i0], by = positions[i2 + 1] - positions[i0 + 1], bz = positions[i2 + 2] - positions[i0 + 2];
        const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
        normals[i0] += nx; normals[i0 + 1] += ny; normals[i0 + 2] += nz;
        normals[i1] += nx; normals[i1 + 1] += ny; normals[i1 + 2] += nz;
        normals[i2] += nx; normals[i2 + 1] += ny; normals[i2 + 2] += nz;
    }
    for (let i = 0; i < normals.length; i += 3) {
        const len = Math.sqrt(normals[i] ** 2 + normals[i + 1] ** 2 + normals[i + 2] ** 2);
        if (len > 0) { normals[i] /= len; normals[i + 1] /= len; normals[i + 2] /= len; }
    }
    return normals;
}

// --- Create a PlayCanvas mesh entity from parsed PLY data ---

async function loadMeshEntity(app) {
    const { positions, indices } = await parsePly(PLY_MESH_URL);
    const normals = computeNormals(positions, indices);

    const mesh = new Mesh(app.graphicsDevice);
    mesh.setPositions(positions, 3);
    mesh.setNormals(normals, 3);
    mesh.setIndices(indices);
    mesh.update(PRIMITIVE_TRIANGLES);

    const material = new StandardMaterial();
    material.diffuse.set(0.68, 0.77, 0.81);
    material.ambient.set(0.9, 0.9, 0.9);
    material.shininess = 1;
    material.update();

    // Compute bounding box center to re-center the mesh at origin
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i], y = positions[i + 1], z = positions[i + 2];
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;

    // Offset positions so the mesh is centered at origin
    for (let i = 0; i < positions.length; i += 3) {
        positions[i] -= cx;
        positions[i + 1] -= cy;
        positions[i + 2] -= cz;
    }

    // Re-upload centered positions
    mesh.setPositions(positions, 3);
    mesh.update(PRIMITIVE_TRIANGLES);

    const mi = new MeshInstance(mesh, material);
    const entity = new Entity('mesh-ply');
    entity.addComponent('render', { meshInstances: [mi] });
    entity.setLocalEulerAngles(-90, 0, 0); // Blender Z-up to PlayCanvas Y-up
    entity.enabled = false;

    return entity;
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

            // Show toggle button once splat is loaded
            const btn = document.getElementById('viewer-toggle');
            if (btn) {
                btn.classList.add('ready');
                btn.addEventListener('click', toggleView);
            }
            const caption = document.getElementById('mesh-caption');
            if (caption) caption.style.display = '';
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
    new MutationObserver(() => { syncBgColor(); }).observe(document.documentElement, { attributeFilter: ['class'] });

    camera.camera.fov = viewerSettings.camera.fov;
    camera.script.create(FrameScene);

    // Store splat entity reference and load PLY mesh
    splatEntity = app.root.findByName('splat');

    try {
        meshEntity = await loadMeshEntity(app);
        if (splatEntity && splatEntity.parent) {
            splatEntity.parent.addChild(meshEntity);
        } else {
            app.root.addChild(meshEntity);
        }
    } catch (e) {
        console.error('Failed to load PLY mesh:', e);
    }
});
