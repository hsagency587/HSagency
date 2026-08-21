(function () {
  'use strict';

  var normalizedPath = window.location.pathname.replace(/\\/g, '/');
  var isEnglishPage = /(^|\/)en(\/|$)/.test(normalizedPath);
  var currentLanguage = isEnglishPage ? 'en' : 'it';

  function equivalentPath(nextLanguage) {
    if (nextLanguage === currentLanguage) return normalizedPath;

    if (nextLanguage === 'it') {
      return normalizedPath.replace('/en/', '/');
    }

    var rank2Position = normalizedPath.indexOf('/Rank2/');
    if (rank2Position >= 0) {
      return normalizedPath.slice(0, rank2Position) + '/en' + normalizedPath.slice(rank2Position);
    }

    if (/\/$/.test(normalizedPath)) return normalizedPath + 'en/index.html';
    return normalizedPath.replace(/\/([^/]+)$/, '/en/$1');
  }

  function setLanguage(nextLanguage) {
    if (nextLanguage === currentLanguage) return;
    window.location.href = equivalentPath(nextLanguage) + window.location.search + window.location.hash;
  }

  function addSwitcher() {
    var switcher = document.createElement('nav');
    switcher.className = 'language-switcher';
    switcher.setAttribute('aria-label', currentLanguage === 'en' ? 'Language selection' : 'Selezione lingua');
    switcher.innerHTML = '<button type="button" class="language-it" data-language="it" aria-label="Italiano" title="Italiano"><span class="flag flag-it" aria-hidden="true"></span><span class="screen-reader-text">Italiano</span></button><button type="button" class="language-en" data-language="en" aria-label="English" title="English"><span class="flag flag-en" aria-hidden="true"></span><span class="screen-reader-text">English</span></button>';

    switcher.querySelectorAll('button[data-language]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.language === currentLanguage));
    });

    switcher.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-language]');
      if (button) setLanguage(button.dataset.language);
    });

    document.body.appendChild(switcher);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var currentScript = document.querySelector('script[src$="language-switcher.js"]');
    var scriptSrc = currentScript ? currentScript.getAttribute('src') : '';
    var upLevels = (scriptSrc.match(/\.\.\//g) || []).length;
    var stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '../'.repeat(upLevels) + 'css/language-switcher.css';
    document.head.appendChild(stylesheet);
    document.documentElement.lang = currentLanguage;
    addSwitcher();
  });
}());
