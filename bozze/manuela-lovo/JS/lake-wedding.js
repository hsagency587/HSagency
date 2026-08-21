(function () {
  'use strict';

  var groups = Array.prototype.slice.call(document.querySelectorAll('[data-location-group]'));
  if (!groups.length) return;

  function initializeGroup(group) {
    var items = Array.prototype.slice.call(group.querySelectorAll('[data-location-item]'));
    var photos = Array.prototype.slice.call(group.querySelectorAll('[data-location-photo]'));
    var buttons = Array.prototype.slice.call(group.querySelectorAll('[data-location-select]'));

    group.lakeLocationState = {
      index: 0,
      items: items,
      photos: photos,
      buttons: buttons,
      interval: parseInt(group.getAttribute('data-rotation-interval'), 10) || 4000,
      timer: null
    };

    showLocation(group, 0);
    startRotation(group);

    group.addEventListener('click', function (event) {
      var button = event.target.closest('[data-location-select]');
      if (!button || !group.contains(button)) return;

      var locationId = button.getAttribute('data-location-select');
      var selectedIndex = items.findIndex(function (item) {
        return item.getAttribute('data-location-item') === locationId;
      });

      if (selectedIndex < 0) return;
      showLocation(group, selectedIndex);
      startRotation(group);
    });
  }

  function startRotation(group) {
    var state = group.lakeLocationState;
    if (!state || !state.items.length) return;

    if (state.timer !== null) window.clearInterval(state.timer);
    state.timer = window.setInterval(function () {
      showLocation(group, state.index + 1);
    }, state.interval);
  }

  function showLocation(group, index) {
    var state = group.lakeLocationState;
    if (!state || !state.items.length) return;

    var nextIndex = index % state.items.length;
    var locationId = state.items[nextIndex].getAttribute('data-location-item');

    state.items.forEach(function (item) {
      if (item.getAttribute('data-location-item') === locationId) {
        item.setAttribute('aria-current', 'true');
      } else {
        item.removeAttribute('aria-current');
      }
    });

    state.photos.forEach(function (photo) {
      photo.hidden = photo.getAttribute('data-location-photo') !== locationId;
    });

    state.buttons.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-location-select') === locationId));
    });

    state.index = nextIndex;
  }

  groups.forEach(initializeGroup);
}());
