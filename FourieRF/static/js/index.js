window.HELP_IMPROVE_VIDEOJS = false;

// ── Dark Mode Toggle ────────────────────────────────────────────────────
(function() {
  var saved = localStorage.getItem('theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  document.addEventListener('DOMContentLoaded', function() {
    var btn = document.querySelector('.dark-mode-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', document.documentElement.getAttribute('data-theme') === 'dark' ? 'true' : 'false');
    }
  });
})();

function toggleDarkMode() {
  var html = document.documentElement;
  var current = html.getAttribute('data-theme');
  var next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  var btn = document.querySelector('.dark-mode-toggle');
  if (btn) btn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
}

// Magnifier Help Toggle
function toggleMagnifierHelp() {
  var popup = document.getElementById('magnifierHelpPopup');
  popup.classList.toggle('show');
}

(function() {
  document.addEventListener('DOMContentLoaded', function() {
    var btn = document.querySelector('.magnifier-help-btn');
    var popup = document.getElementById('magnifierHelpPopup');
    if (!btn || !popup) return;
    btn.addEventListener('mouseleave', function(e) {
      if (!popup.contains(e.relatedTarget)) popup.classList.remove('show');
    });
    popup.addEventListener('mouseleave', function(e) {
      if (!btn.contains(e.relatedTarget)) popup.classList.remove('show');
    });
  });
})();

// More Works Dropdown Functionality
function toggleMoreWorks() {
  const dropdown = document.getElementById('moreWorksDropdown');
  const button = document.querySelector('.more-works-btn');
  if (dropdown.classList.contains('show')) {
    dropdown.classList.remove('show');
    button.classList.remove('active');
  } else {
    dropdown.classList.add('show');
    button.classList.add('active');
  }
}

document.addEventListener('click', function(event) {
  const container = document.querySelector('.more-works-container');
  const dropdown = document.getElementById('moreWorksDropdown');
  const button = document.querySelector('.more-works-btn');
  if (container && !container.contains(event.target)) {
    dropdown.classList.remove('show');
    button.classList.remove('active');
  }
});

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    if (dropdown) dropdown.classList.remove('show');
    if (button) button.classList.remove('active');
  }
});

// Copy BibTeX to clipboard
function copyBibTeX() {
  const bibtexElement = document.getElementById('bibtex-code');
  const button = document.querySelector('.copy-bibtex-btn');
  const copyText = button.querySelector('.copy-text');

  if (bibtexElement) {
    navigator.clipboard.writeText(bibtexElement.textContent).then(function() {
      button.classList.add('copied');
      copyText.textContent = 'Cop';
      setTimeout(function() {
        button.classList.remove('copied');
        copyText.textContent = 'Copy';
      }, 2000);
    }).catch(function(err) {
      console.error('Failed to copy: ', err);
      var textArea = document.createElement('textarea');
      textArea.value = bibtexElement.textContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      button.classList.add('copied');
      copyText.textContent = 'Cop';
      setTimeout(function() {
        button.classList.remove('copied');
        copyText.textContent = 'Copy';
      }, 2000);
    });
  }
}

// Scroll to top functionality
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('scroll', function() {
  var scrollButton = document.querySelector('.scroll-to-top');
  if (window.pageYOffset > 300) {
    scrollButton.classList.add('visible');
  } else {
    scrollButton.classList.remove('visible');
  }
});

// ── Button Group Utility ────────────────────────────────────────────────

function makeButtonGroup(labels, onSelect) {
  var group = document.createElement('div');
  group.className = 'btn-group';
  labels.forEach(function(label, i) {
    var btn = document.createElement('button');
    btn.textContent = label;
    if (i === 0) btn.classList.add('active');
    btn.addEventListener('click', function() {
      group.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      onSelect(label, i);
    });
    group.appendChild(btn);
  });
  return group;
}

function makeControlGroup(label, labels, onSelect) {
  var wrapper = document.createElement('div');
  wrapper.className = 'control-group';
  var lbl = document.createElement('span');
  lbl.className = 'control-label';
  lbl.textContent = label;
  wrapper.appendChild(lbl);
  wrapper.appendChild(makeButtonGroup(labels, onSelect));
  return wrapper;
}

// ══════════════════════════════════════════════════════════════════════════
// FOURIERF — Progressive Complexity Video Widget
// ══════════════════════════════════════════════════════════════════════════

function initProgressiveComplexity() {
  var widget = document.getElementById('progressive-complexity-widget');
  if (!widget) return;

  var video = widget.querySelector('video');
  var controls = widget.querySelector('.comparison-controls');

  var scenes = ['Flower', 'Fortress', 'Fern', 'Leaves', 'Orchids', 'Room', 'Trex', 'Horns'];
  var sceneKeys = ['flower', 'fortress', 'fern', 'leaves', 'orchids', 'room', 'trex', 'horns'];
  var views = ['3 Views', '6 Views', '9 Views'];
  var viewKeys = ['3', '6', '9'];

  var currentScene = 0;
  var currentViews = 0;

  function update() {
    var src = 'static/videos/' + sceneKeys[currentScene] + '_' + viewKeys[currentViews] + '_0.mp4';
    video.src = src;
    video.load();
    video.play().catch(function() {});
  }

  controls.appendChild(makeControlGroup('Scene:', scenes, function(_, i) {
    currentScene = i;
    update();
  }));

  controls.appendChild(makeControlGroup('Views:', views, function(_, i) {
    currentViews = i;
    update();
  }));

  // Autoplay when in view
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        video.play().catch(function() {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.3 });
  observer.observe(video);
}

// ══════════════════════════════════════════════════════════════════════════
// FOURIERF — Video Comparison Slider (Ours vs Baseline)
// ══════════════════════════════════════════════════════════════════════════

function initVideoComparison() {
  var widget = document.getElementById('video-comparison-widget');
  if (!widget) return;

  var container = widget.querySelector('.video-comparison-container');
  var videoLeft = container.querySelector('.video-comparison-left');
  var videoRight = container.querySelector('.video-comparison-right');
  var divider = container.querySelector('.comparison-divider');
  var handle = container.querySelector('.comparison-handle');
  var labelLeft = container.querySelector('.comparison-label-left');
  var labelRight = container.querySelector('.comparison-label-right');
  var overlay = container.querySelector('.video-play-pause-overlay');
  var timeline = widget.querySelector('.video-timeline');
  var filledBar = widget.querySelector('.video-timeline-filled');
  var timelineHandle = widget.querySelector('.video-timeline-handle');
  var controls = widget.querySelector('.comparison-controls');

  var scenes = ['Flower', 'Fortress', 'Fern', 'Leaves', 'Orchids', 'Room', 'Trex', 'Horns'];
  var sceneKeys = ['flower', 'fortress', 'fern', 'leaves', 'orchids', 'room', 'trex', 'horns'];
  var baselines = ['TensoRF', 'ZeroRF'];
  var baselineKeys = ['vanilla', 'zerorf'];
  var modes = ['RGB', 'Depth'];
  var modeKeys = ['rgb', 'depth'];
  var viewLabels = ['3 Views', '6 Views', '9 Views'];
  var viewKeys = ['3', '6', '9'];

  var currentScene = 0;
  var currentBaseline = 0;
  var currentMode = 0;
  var currentViews = 0;
  var position = 50;
  var isDragging = false;
  var isTimelineDragging = false;
  var userPaused = false;
  var dragStartX = 0;

  function getLeftSrc() {
    return 'static/' + modeKeys[currentMode] + '_videos/' + sceneKeys[currentScene] + '_' + viewKeys[currentViews] + '.mp4';
  }

  function getRightSrc() {
    return 'static/' + modeKeys[currentMode] + '_videos_' + baselineKeys[currentBaseline] + '/' + sceneKeys[currentScene] + '_' + viewKeys[currentViews] + '.mp4';
  }

  function updateVideos() {
    videoLeft.src = getLeftSrc();
    videoRight.src = getRightSrc();
    videoLeft.load();
    videoRight.load();
    labelLeft.textContent = 'Ours';
    labelRight.textContent = baselines[currentBaseline];
    if (!userPaused) {
      videoLeft.play().catch(function() {});
      videoRight.play().catch(function() {});
    }
    setPosition(50);
  }

  function setPosition(pct) {
    pct = Math.max(2, Math.min(98, pct));
    position = pct;
    videoLeft.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
    divider.style.left = pct + '%';
    handle.style.left = pct + '%';
  }

  function getPercent(clientX) {
    var rect = container.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  }

  // Slider drag
  container.addEventListener('mousedown', function(e) {
    dragStartX = e.clientX;
    isDragging = true;
    e.preventDefault();
  });

  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    setPosition(getPercent(e.clientX));
  });

  document.addEventListener('mouseup', function(e) {
    if (!isDragging) return;
    var moved = Math.abs(e.clientX - dragStartX);
    isDragging = false;
    if (moved < 5) {
      togglePlayPause();
    }
  });

  // Touch support
  container.addEventListener('touchstart', function(e) {
    isDragging = true;
    setPosition(getPercent(e.touches[0].clientX));
  }, { passive: true });
  container.addEventListener('touchmove', function(e) {
    if (isDragging) setPosition(getPercent(e.touches[0].clientX));
  }, { passive: true });
  container.addEventListener('touchend', function() { isDragging = false; });

  // Play/pause
  function togglePlayPause() {
    if (videoLeft.paused) {
      videoLeft.play();
      videoRight.play();
      userPaused = false;
      container.classList.remove('is-paused');
      flashIcon('fa-play');
    } else {
      videoLeft.pause();
      videoRight.pause();
      userPaused = true;
      container.classList.add('is-paused');
      flashIcon('fa-pause');
    }
  }

  function flashIcon(iconClass) {
    var icon = overlay.querySelector('i');
    icon.className = 'fas ' + iconClass;
    overlay.classList.remove('fade-out');
    overlay.classList.add('flash');
    setTimeout(function() {
      overlay.classList.remove('flash');
      overlay.classList.add('fade-out');
    }, 200);
    setTimeout(function() {
      overlay.classList.remove('fade-out');
    }, 600);
  }

  // Sync videos
  setInterval(function() {
    if (!videoLeft.paused && !videoRight.paused) {
      var diff = Math.abs(videoLeft.currentTime - videoRight.currentTime);
      if (diff > 0.15) videoRight.currentTime = videoLeft.currentTime;
    }
  }, 500);

  // Timeline
  function updateTimeline() {
    if (videoLeft.duration) {
      var pct = (videoLeft.currentTime / videoLeft.duration) * 100;
      filledBar.style.width = pct + '%';
      timelineHandle.style.left = pct + '%';
    }
    requestAnimationFrame(updateTimeline);
  }
  requestAnimationFrame(updateTimeline);

  function seekFromTimeline(clientX) {
    var rect = timeline.getBoundingClientRect();
    var pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    if (videoLeft.duration) {
      videoLeft.currentTime = pct * videoLeft.duration;
      videoRight.currentTime = pct * videoRight.duration;
    }
  }

  timeline.addEventListener('mousedown', function(e) {
    isTimelineDragging = true;
    seekFromTimeline(e.clientX);
    e.preventDefault();
  });
  document.addEventListener('mousemove', function(e) {
    if (isTimelineDragging) seekFromTimeline(e.clientX);
  });
  document.addEventListener('mouseup', function() { isTimelineDragging = false; });

  // Autoplay when in view
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting && !userPaused) {
        videoLeft.play().catch(function() {});
        videoRight.play().catch(function() {});
      } else if (!entry.isIntersecting) {
        videoLeft.pause();
        videoRight.pause();
      }
    });
  }, { threshold: 0.3 });
  observer.observe(container);

  // Controls
  controls.appendChild(makeControlGroup('Baseline:', baselines, function(_, i) {
    currentBaseline = i;
    updateVideos();
  }));

  controls.appendChild(makeControlGroup('Mode:', modes, function(_, i) {
    currentMode = i;
    updateVideos();
  }));

  controls.appendChild(makeControlGroup('Views:', viewLabels, function(_, i) {
    currentViews = i;
    updateVideos();
  }));

  controls.appendChild(makeControlGroup('Scene:', scenes, function(_, i) {
    currentScene = i;
    updateVideos();
  }));

  // Set initial sources
  updateVideos();

  // Attach magnifier
  new MagnifierLens(container, {
    isVideo: true,
    isComparison: true,
    getVideoElements: function() { return { left: videoLeft, right: videoRight }; },
    getPosition: function() { return position; },
    onToggle: function() {
      var target = position < 50 ? 95 : 5;
      var start = position;
      var duration = 300;
      var startTime = performance.now();
      (function animate(now) {
        var t = Math.min((now - startTime) / duration, 1);
        t = t * (2 - t);
        setPosition(start + (target - start) * t);
        if (t < 1) requestAnimationFrame(animate);
      })(performance.now());
    }
  });
}

// ══════════════════════════════════════════════════════════════════════════
// DOMContentLoaded — Initialize everything
// ══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
  initProgressiveComplexity();
  initVideoComparison();

  // Attach magnifiers to static zoomable images
  document.querySelectorAll('.zoomable-image').forEach(function(img) {
    var wrapper = document.createElement('div');
    wrapper.className = 'zoomable-image-wrapper';
    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(img);
    new MagnifierLens(wrapper, {
      getSources: function() { return { left: img.src }; },
      getPosition: function() { return 100; }
    });
  });
});
