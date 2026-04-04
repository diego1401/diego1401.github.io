// ── Magnifier Lens ─────────────────────────────────────────────────────────
// Circular magnifying-glass overlay that follows the cursor on hover.
// Works for static images, image comparison sliders, and video comparison sliders.

function MagnifierLens(containerEl, options) {
  options = options || {};
  this.container = containerEl;
  this.zoom = options.zoom || 2.5;
  this.minZoom = options.minZoom || 1.5;
  this.maxZoom = options.maxZoom || 8;
  this.size = options.size || 180;
  this.getSources = options.getSources || function() { return { left: '' }; };
  this.getPosition = options.getPosition || function() { return 100; };
  this.onToggle = options.onToggle || null;
  this.isComparison = !!options.isComparison;
  this.isVideo = !!options.isVideo;
  this.getVideoElements = options.getVideoElements || null;

  // Ensure the container is a positioning context
  var cs = window.getComputedStyle(containerEl);
  if (cs.position === 'static') containerEl.style.position = 'relative';

  // Create lens — use canvas for video, div for images
  if (this.isVideo) {
    this.lens = document.createElement('canvas');
    this.lens.className = 'magnifier-lens';
    this.lens.width = this.size;
    this.lens.height = this.size;
    this.lensCtx = this.lens.getContext('2d');
  } else {
    this.lens = document.createElement('div');
    this.lens.className = 'magnifier-lens';
  }
  this.lens.style.width = this.size + 'px';
  this.lens.style.height = this.size + 'px';
  containerEl.appendChild(this.lens);

  this._active = false;
  this._hovering = false;
  this._lastMouseX = 0;
  this._lastMouseY = 0;

  this._onMouseMove = this._onMouseMove.bind(this);
  this._onMouseEnter = this._onMouseEnter.bind(this);
  this._onMouseLeave = this._onMouseLeave.bind(this);
  this._onKeyDown = this._onKeyDown.bind(this);
  this._onKeyUp = this._onKeyUp.bind(this);
  this._onWheel = this._onWheel.bind(this);

  containerEl.addEventListener('mouseenter', this._onMouseEnter);
  containerEl.addEventListener('mousemove', this._onMouseMove);
  containerEl.addEventListener('mouseleave', this._onMouseLeave);
  containerEl.addEventListener('wheel', this._onWheel, { passive: false });
  document.addEventListener('keydown', this._onKeyDown);
  document.addEventListener('keyup', this._onKeyUp);
}

MagnifierLens.prototype._showLens = function() {
  this._active = true;
  this.lens.classList.add('visible');
  this.container.classList.add('magnifier-active');
  if (this._hovering) this._updateLens();
};

MagnifierLens.prototype._hideLens = function() {
  this._active = false;
  this.lens.classList.remove('visible');
  this.container.classList.remove('magnifier-active');
};

MagnifierLens.prototype._onKeyDown = function(e) {
  if (e.key === 'x' && !e.repeat && this._hovering) this._showLens();
  if (e.key === 'c' && !e.repeat && this._active && this.onToggle) this._doToggle();
};

MagnifierLens.prototype._onKeyUp = function(e) {
  if (e.key === 'x') this._hideLens();
};

MagnifierLens.prototype._onMouseEnter = function() {
  this._hovering = true;
};

MagnifierLens.prototype._onMouseMove = function(e) {
  var rect = this.container.getBoundingClientRect();
  this._lastMouseX = e.clientX - rect.left;
  this._lastMouseY = e.clientY - rect.top;
  if (this._active) this._updateLens();
};

MagnifierLens.prototype._updateLens = function() {
  var mx = this._lastMouseX;
  var my = this._lastMouseY;
  var half = this.size / 2;
  var rect = this.container.getBoundingClientRect();

  this.lens.style.left = (mx - half) + 'px';
  this.lens.style.top = (my - half) + 'px';

  if (this.isVideo) {
    this._drawVideoLens(mx, my, rect);
  } else {
    this._drawImageLens(mx, my, rect);
  }
};

MagnifierLens.prototype._drawImageLens = function(mx, my, rect) {
  var sources = this.getSources();
  var dividerPct = this.getPosition();
  var cursorPct = (mx / rect.width) * 100;
  var src = (sources.right && cursorPct >= dividerPct) ? sources.right : sources.left;

  var bgW = rect.width * this.zoom;
  var bgH = rect.height * this.zoom;
  var half = this.size / 2;

  this.lens.style.backgroundImage = 'url("' + src + '")';
  this.lens.style.backgroundSize = bgW + 'px ' + bgH + 'px';
  this.lens.style.backgroundPosition = -(mx * this.zoom - half) + 'px ' + -(my * this.zoom - half) + 'px';
};

MagnifierLens.prototype._drawVideoLens = function(mx, my, rect) {
  var videos = this.getVideoElements();
  var dividerPct = this.getPosition();
  var cursorPct = (mx / rect.width) * 100;
  var video = (cursorPct >= dividerPct) ? videos.right : videos.left;

  var ctx = this.lensCtx;
  var size = this.size;
  var half = size / 2;
  var zoom = this.zoom;

  // Source rectangle in video coordinates
  var vw = video.videoWidth || rect.width;
  var vh = video.videoHeight || rect.height;
  var scaleX = vw / rect.width;
  var scaleY = vh / rect.height;

  var sx = (mx - half / zoom) * scaleX;
  var sy = (my - half / zoom) * scaleY;
  var sw = (size / zoom) * scaleX;
  var sh = (size / zoom) * scaleY;

  // Clip to circle
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(half, half, half, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, size, size);
  ctx.restore();
};

MagnifierLens.prototype._onWheel = function(e) {
  if (!this._active) return;
  e.preventDefault();
  var delta = e.deltaY > 0 ? -0.3 : 0.3;
  this.zoom = Math.min(this.maxZoom, Math.max(this.minZoom, this.zoom + delta));
  this._updateLens();
};

MagnifierLens.prototype._onMouseLeave = function() {
  this._hovering = false;
  this._hideLens();
};

MagnifierLens.prototype._doToggle = function() {
  var self = this;
  this.onToggle();
  // Keep redrawing the lens during the toggle animation
  var end = performance.now() + 350;
  (function refresh() {
    if (self._active) self._updateLens();
    if (performance.now() < end) requestAnimationFrame(refresh);
  })();
};
