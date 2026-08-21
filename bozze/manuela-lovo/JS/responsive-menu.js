(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var button = document.getElementById('responsive-menu-button');
    var container = document.getElementById('responsive-menu-container');

    if (!button || !container) return;

    function setMenuOpen(isOpen) {
      document.documentElement.classList.toggle('responsive-menu-open', isOpen);
      button.classList.toggle('is-active', isOpen);
      button.setAttribute('aria-expanded', String(isOpen));
    }

    function closeMenu() {
      setMenuOpen(false);
    }

    button.setAttribute('aria-controls', 'responsive-menu-container');
    button.setAttribute('aria-expanded', 'false');

    button.addEventListener('click', function (event) {
      event.stopPropagation();
      setMenuOpen(!document.documentElement.classList.contains('responsive-menu-open'));
    });

    container.addEventListener('click', function (event) {
      var subArrow = event.target.closest('.responsive-menu-subarrow');

      if (subArrow) {
        var parentLink = subArrow.closest('a');
        var submenu = parentLink && parentLink.nextElementSibling;

        if (submenu && submenu.classList.contains('responsive-menu-submenu')) {
          event.preventDefault();
          event.stopPropagation();

          var isOpen = submenu.classList.toggle('responsive-menu-submenu-open');
          parentLink.setAttribute('aria-expanded', String(isOpen));
          subArrow.innerHTML = isOpen ? '&#9650;' : '&#9660;';
        }

        return;
      }

      var link = event.target.closest('a.responsive-menu-item-link');
      if (link && link.getAttribute('href') !== '#') closeMenu();
    });

    document.addEventListener('click', function (event) {
      if (!document.documentElement.classList.contains('responsive-menu-open')) return;
      if (!container.contains(event.target) && !button.contains(event.target)) closeMenu();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (!document.documentElement.classList.contains('responsive-menu-open')) return;

      closeMenu();
      button.focus();
    });
  });
}());
