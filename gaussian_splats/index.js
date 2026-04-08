import { BoundingBox, Color, Script, Vec3 } from 'playcanvas';
import viewerSettings from "viewerSettings" with { type: "json" };

const VIEWER_HEIGHT = 450;

let currentMode = 'splat';

// --- Tint the GLB mesh a blue pastel once it loads ---

function tintMeshViewer() {
    const mv = document.getElementById('mesh-viewer');
    if (!mv) return;
    mv.addEventListener('load', () => {
        const model = mv.model;
        if (!model) return;
        for (const mat of model.materials) {
            mat.pbrMetallicRoughness.setBaseColorFactor([0.68, 0.78, 0.92, 1.0]);
        }
    });
}

document.addEventListener('DOMContentLoaded', tintMeshViewer);

// --- Toggle between 3DGS splat (PlayCanvas) and GLB mesh (model-viewer) ---

function toggleView() {
    const btn = document.getElementById('viewer-toggle');
    const pcApp = document.querySelector('pc-app');
    const meshViewer = document.getElementById('mesh-viewer');
    if (!btn || !pcApp || !meshViewer) return;

    currentMode = currentMode === 'splat' ? 'mesh' : 'splat';

    if (currentMode === 'mesh') {
        pcApp.style.display = 'none';
        meshViewer.style.display = 'block';
        btn.innerHTML = '<span class="toggle-icon">\u25D3</span> 3DGS';
        btn.title = 'Switch to 3DGS view';
    } else {
        pcApp.style.display = '';
        meshViewer.style.display = 'none';
        btn.innerHTML = '<span class="toggle-icon">\u25B5</span> Mesh';
        btn.title = 'Switch to Mesh view';
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

});
