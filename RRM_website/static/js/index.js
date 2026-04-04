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

// Copy BibTeX to clipboard
function copyBibTeX() {
  var bibtexElement = document.getElementById('bibtex-code');
  var button = document.querySelector('.copy-bibtex-btn');
  var copyText = button.querySelector('.copy-text');

  if (bibtexElement) {
    navigator.clipboard.writeText(bibtexElement.textContent).then(function() {
      button.classList.add('copied');
      copyText.textContent = 'Copied!';
      setTimeout(function() {
        button.classList.remove('copied');
        copyText.textContent = 'Copy';
      }, 2000);
    }).catch(function() {
      var textArea = document.createElement('textarea');
      textArea.value = bibtexElement.textContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      button.classList.add('copied');
      copyText.textContent = 'Copied!';
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
  if (scrollButton) {
    if (window.pageYOffset > 300) {
      scrollButton.classList.add('visible');
    } else {
      scrollButton.classList.remove('visible');
    }
  }
});

// ── Video Selector Widget ───────────────────────────────────────────────

function makeButtonGroup(labels, onSelect, defaultIndex) {
  var group = document.createElement('div');
  group.className = 'btn-group';
  labels.forEach(function(label, i) {
    var btn = document.createElement('button');
    btn.textContent = label;
    if (i === (defaultIndex || 0)) btn.classList.add('active');
    btn.addEventListener('click', function() {
      group.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      onSelect(label, i);
    });
    group.appendChild(btn);
  });
  return group;
}

function initVideoSelector() {
  var widget = document.getElementById('video-selector-widget');
  if (!widget) return;

  var video = widget.querySelector('video');
  var controls = widget.querySelector('.comparison-controls');

  var typeList = ['Physically-Based NVS', 'Normals', 'Relighting'];
  var typeKeys = ['pb', 'normals', 'relight'];
  var sceneList = ['Car', 'Helmet'];
  var sceneKeys = ['car', 'helmet'];

  var currentType = 'pb';
  var currentScene = 'car';

  function updateVideo() {
    var src = 'media/' + currentType + '/' + currentScene + '.mp4';
    video.style.opacity = '0';
    setTimeout(function() {
      video.src = src;
      video.load();
      video.onloadeddata = function() {
        video.style.opacity = '1';
        video.play().catch(function() {});
      };
    }, 200);
  }

  var typeGroup = document.createElement('div');
  typeGroup.className = 'control-group';
  var typeLabel = document.createElement('span');
  typeLabel.className = 'control-label';
  typeLabel.textContent = 'Type:';
  var typeBtns = makeButtonGroup(typeList, function(label, i) {
    currentType = typeKeys[i];
    updateVideo();
  });
  typeGroup.appendChild(typeLabel);
  typeGroup.appendChild(typeBtns);

  var sceneGroup = document.createElement('div');
  sceneGroup.className = 'control-group';
  var sceneLabel = document.createElement('span');
  sceneLabel.className = 'control-label';
  sceneLabel.textContent = 'Scene:';
  var sceneBtns = makeButtonGroup(sceneList, function(label, i) {
    currentScene = sceneKeys[i];
    updateVideo();
  });
  sceneGroup.appendChild(sceneLabel);
  sceneGroup.appendChild(sceneBtns);

  controls.appendChild(typeGroup);
  controls.appendChild(sceneGroup);

  // Initial load
  updateVideo();

  // IntersectionObserver: pause when out of view
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

$(document).ready(function() {
  var options = {
    slidesToScroll: 1,
    slidesToShow: 1,
    loop: true,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 5000,
  };

  var carousels = bulmaCarousel.attach('.carousel', options);
  bulmaSlider.attach();

  initVideoSelector();
});
