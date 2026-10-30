// Botón "Instalar app": añade Tu CV Gratis a la pantalla de inicio como una aplicación.
// En Android/Chrome usa la ventana de instalación del navegador; en iPhone, donde no
// existe, explica cómo hacerlo desde "Compartir".
(function () {
  var KEY = 'cvlisto:install-dismissed';
  var DAYS = 14;
  var deferred = null;

  var ua = navigator.userAgent;
  var isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isAndroid = /android/i.test(ua);
  var standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }
  function hideAll() {
    each('.js-install', function (b) { b.hidden = true; });
    each('.js-install-done', function (b) { b.hidden = false; });
    var bar = document.getElementById('install-bar');
    if (bar) bar.hidden = true;
  }

  function showHelp() {
    var dlg = document.getElementById('dlg-install');
    if (!dlg) return;
    dlg.querySelectorAll('[data-os]').forEach(function (el) {
      var os = el.getAttribute('data-os');
      el.hidden = !(os === 'ios' ? isIOS : os === 'android' ? isAndroid && !isIOS : !isIOS && !isAndroid);
    });
    dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
  }

  function install() {
    if (deferred) {
      deferred.prompt();
      deferred.userChoice.then(function (r) {
        if (r && r.outcome === 'accepted') hideAll();
        deferred = null;
      });
    } else {
      showHelp();
    }
  }

  function dismissed() {
    var t = Number(get(KEY) || 0);
    return t && Date.now() - t < DAYS * 864e5;
  }

  function maybeShowBar() {
    var bar = document.getElementById('install-bar');
    if (!bar || standalone || dismissed()) return;
    if (!matchMedia('(max-width: 720px)').matches) return;
    // Solo si de verdad se puede instalar: Chrome/Android con aviso, o Safari en iPhone.
    if (!deferred && !isIOS) return;
    bar.hidden = false;
  }

  addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    setTimeout(maybeShowBar, 2500);
  });
  addEventListener('appinstalled', function () {
    set(KEY, String(Date.now() + 3650 * 864e5));
    hideAll();
  });

  function init() {
    if (standalone) { hideAll(); return; }
    each('.js-install', function (b) {
      b.hidden = false;
      b.addEventListener('click', install);
    });
    var bar = document.getElementById('install-bar');
    if (bar) {
      bar.querySelector('.js-install-close').addEventListener('click', function () {
        bar.hidden = true;
        set(KEY, String(Date.now()));
      });
    }
    if (isIOS) setTimeout(maybeShowBar, 2500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
