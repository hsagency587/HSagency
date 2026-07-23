(function () {
  "use strict";

  var STORAGE_KEY = "manuela-lovo-language";
  var originalText = new WeakMap();
  var originalAttributes = new WeakMap();

  var sharedEnglish = {
    "seo.locale": "en_GB",
    "nav.leftLabel": "Main navigation, left",
    "nav.rightLabel": "Main navigation, right",
    "nav.mobileLabel": "Mobile menu",
    "nav.home": "Home",
    "nav.about": "About",
    "nav.wedding": "Wedding",
    "nav.services": "Services",
    "nav.express": "Express Yourself",
    "nav.children": "Children",
    "nav.family": "Family",
    "nav.maternity": "Maternity",
    "nav.newborn": "Newborn",
    "nav.dance": "Dance",
    "nav.explosion": "Explosion Box",
    "nav.collections": "Collections",
    "nav.corporate": "Corporate",
    "nav.stories": "Stories",
    "nav.contact": "Contact",
    "nav.submenu": "Open submenu",
    "video.placeholder": "Video coming soon",
    "contact.group": "Contact details",
    "contact.phoneAria": "Call +39 347 479 9390",
    "contact.phone": "Phone",
    "contact.emailAria": "Email info@manuelalovo.it",
    "contact.email": "Email",
    "contact.mapTitle": "Studio map and address",
    "contact.mapFrameTitle": "Map of the Manuela Lovo photography studio",
    "contact.explore": "Explore",
    "contact.family": "Family and children",
    "contact.orta": "Lake Orta Wedding",
    "contact.maggiore": "Lake Maggiore Wedding",
    "footer.rights": "All rights reserved.",
    "footer.privacy": "Privacy policy",
    "footer.cookie": "Cookie policy",
    "footer.tracking": "Tracking technology preferences",
    "footer.credits": "Credits:",
    "footer.goTop": "Back to the top of the page"
  };

  var translations = {
    orta: {
      en: {
        "seo.title": "Lake Orta wedding photographer | Manuela Lovo",
        "seo.description": "An intimate and natural photographic story for a Lake Orta wedding, focused on gestures, emotions and the atmosphere of the day.",
        "breadcrumb.current": "Lake Orta wedding",
        "language.group": "Choose language",
        "language.italian": "Italian",
        "language.english": "English",
        "cross.label": "Discover Lake Maggiore",
        "hero.eyebrow": "Wedding stories on the Italian lakes",
        "hero.title": "Wedding on Lake Orta",
        "hero.subtitle": "An intimate story, shaped by quiet moments, glances and gentle light",
        "hero.alt": "Newlyweds looking over Lake Orta",
        "intro.kicker": "A story close to the people",
        "intro.titleMain": "Lake Orta wedding photographer:",
        "intro.titleSubtitle": "intimacy becomes memory",
        "intro.p1": "Lake Orta has a quiet, intimate character. Its landscape never needs to take centre stage: it stays beside the people, gives space to their voices and turns every pause into part of the story.",
        "intro.p2": "My photography begins there, with what happens naturally. I look for gestures that are almost hidden, the way hands meet and the expressions that appear when no one is performing for the camera. The result is a wedding story that remains true to the day and to the people who lived it.",
        "story1.kicker": "Chapter one",
        "story1.title": "The quiet before everything begins",
        "story1.p1": "Preparations are made of small movements and suspended time. A dress waiting, familiar voices in the next room, a deep breath before stepping outside: each detail holds the anticipation of what is about to happen.",
        "story1.p2": "On Lake Orta, this part of the day feels especially collected. I photograph it without interrupting its rhythm, staying close enough to recognise emotion and discreet enough to let it remain authentic.",
        "story1.note": "The story begins before the ceremony, in the gestures no one thinks they will remember.",
        "story1.videoLabel": "Video: preparations for a Lake Orta wedding",
        "story1.caption": "Temporary poster for the preparations video",
        "story2.kicker": "Chapter two",
        "story2.title": "When emotions find their voice",
        "story2.p1": "The ceremony brings together everything that came before it: expectation, presence and the emotion of recognising one another in a decisive moment. A glance can carry more than words, and silence can become the most intense part of the story.",
        "story2.p2": "I follow what happens without forcing it into a pattern. The lake, the light and the people remain connected, while the photographs preserve the delicate balance between the setting and the intimacy of the promise.",
        "story2.note": "Nothing needs to be repeated when a moment has been truly lived.",
        "story2.videoLabel": "Video: ceremony and emotions on Lake Orta",
        "story2.caption": "Temporary poster for the ceremony video",
        "story3.kicker": "Chapter three",
        "story3.title": "The celebration, and what remains",
        "story3.p1": "After the intensity of the ceremony, the day opens up. Hugs become freer, laughter fills the spaces and the celebration gathers everyone into a shared rhythm. This is where the story changes pace without losing its meaning.",
        "story3.p2": "I photograph the energy of the party together with the quieter moments that still emerge within it. What remains is not a sequence of perfect poses, but the warmth of the people, the atmosphere and the feeling of having been there.",
        "story3.note": "A photograph keeps the echo of a celebration long after the music has ended.",
        "story3.videoLabel": "Video: Lake Orta wedding celebration",
        "story3.caption": "Temporary poster for the celebration video",
        "portfolio.title": "Wedding stories",
        "cross.text": "If you imagine a brighter, more expansive and scenic atmosphere, discover the story dedicated to Lake Maggiore.",
        "cross.cta": "Discover weddings on Lake Maggiore"
      }
    },
    maggiore: {
      en: {
        "seo.title": "Lake Maggiore wedding photographer | Manuela Lovo",
        "seo.description": "An elegant and luminous photographic story for a Lake Maggiore wedding, balancing emotions, landscape and the rhythm of the celebration.",
        "breadcrumb.current": "Lake Maggiore wedding",
        "language.group": "Choose language",
        "language.italian": "Italian",
        "language.english": "English",
        "cross.label": "Discover Lake Orta",
        "hero.eyebrow": "Wedding stories on the Italian lakes",
        "hero.title": "Wedding on Lake Maggiore",
        "hero.subtitle": "Light, elegance and a wide horizon for a story that breathes",
        "hero.alt": "Newlyweds during a luminous moment on Lake Maggiore",
        "intro.kicker": "A story with room to breathe",
        "intro.titleMain": "Lake Maggiore wedding photographer:",
        "intro.titleSubtitle": "light shapes the story",
        "intro.p1": "Lake Maggiore has a broad, luminous presence. Its changing reflections and open horizon give the wedding day a scenic quality that never needs to become theatrical: the landscape expands the atmosphere while people remain at the centre.",
        "intro.p2": "I photograph this balance by moving between the scale of the setting and the closeness of emotion. Wide views establish the rhythm of the day; gestures, expressions and unexpected moments reveal its most personal meaning.",
        "story1.kicker": "Chapter one",
        "story1.title": "Light enters the preparations",
        "story1.p1": "At the beginning of the day, every room holds a different kind of expectation. The preparations unfold through details, movement and conversations, while light gradually changes the space and gives shape to the anticipation.",
        "story1.p2": "On Lake Maggiore, I let that brightness become part of the photographs without allowing it to distract from the people. The story remains natural, attentive to what happens and to the energy that grows as the ceremony approaches.",
        "story1.note": "The day begins in the space between anticipation and the first real smile.",
        "story1.videoLabel": "Video: preparations for a Lake Maggiore wedding",
        "story1.caption": "Temporary poster for the preparations video",
        "story2.kicker": "Chapter two",
        "story2.title": "A promise within the landscape",
        "story2.p1": "During the ceremony, the breadth of the landscape meets the concentration of a deeply personal moment. The setting opens around the couple, while every look and every voice draws the story back to what truly matters.",
        "story2.p2": "I alternate wider images with close, discreet observations. This allows the photographs to preserve both the elegance of the atmosphere and the emotion of those who are living it, without forcing either one.",
        "story2.note": "The landscape gives the moment space; emotion gives it meaning.",
        "story2.videoLabel": "Video: ceremony and emotions on Lake Maggiore",
        "story2.caption": "Temporary poster for the ceremony video",
        "story3.kicker": "Chapter three",
        "story3.title": "The energy of the celebration",
        "story3.p1": "The celebration changes the pace of the day. Movement, embraces and laughter fill the space, and the scenic elegance of the setting becomes the background to something spontaneous and alive.",
        "story3.p2": "I follow that energy while continuing to notice the quieter exchanges within it. The final story brings together the scale of the celebration and its most intimate details, so that the photographs can return the full atmosphere of the day.",
        "story3.note": "What remains is the light, the movement and the unmistakable feeling of being together.",
        "story3.videoLabel": "Video: Lake Maggiore wedding celebration",
        "story3.caption": "Temporary poster for the celebration video",
        "portfolio.title": "Wedding stories",
        "cross.text": "If you are drawn to a more intimate, collected and delicate atmosphere, discover the story dedicated to Lake Orta.",
        "cross.cta": "Discover weddings on Lake Orta"
      }
    }
  };

  function readStoredLanguage() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "it";
    } catch (error) {
      return "it";
    }
  }

  function storeLanguage(language) {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      // The page still works when storage is unavailable.
    }
  }

  function rememberAttribute(element, attribute) {
    var values = originalAttributes.get(element) || {};
    if (!Object.prototype.hasOwnProperty.call(values, attribute)) {
      values[attribute] = element.getAttribute(attribute);
      originalAttributes.set(element, values);
    }
    return values[attribute];
  }

  function translatedValue(page, language, key) {
    if (language !== "en") {
      return null;
    }
    if (translations[page] && translations[page].en[key]) {
      return translations[page].en[key];
    }
    return sharedEnglish[key] || null;
  }

  function applyLanguage(page, language) {
    var normalizedLanguage = language === "en" ? "en" : "it";

    document.querySelectorAll("[data-i18n]").forEach(function (element) {
      var key = element.getAttribute("data-i18n");
      if (!originalText.has(element)) {
        originalText.set(element, element.textContent);
      }
      element.textContent = translatedValue(page, normalizedLanguage, key) || originalText.get(element);
    });

    document.querySelectorAll("[data-i18n-content]").forEach(function (element) {
      var key = element.getAttribute("data-i18n-content");
      var original = rememberAttribute(element, "content");
      element.setAttribute("content", translatedValue(page, normalizedLanguage, key) || original);
    });

    document.querySelectorAll("[data-i18n-alt]").forEach(function (element) {
      var key = element.getAttribute("data-i18n-alt");
      var original = rememberAttribute(element, "alt");
      element.setAttribute("alt", translatedValue(page, normalizedLanguage, key) || original);
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach(function (element) {
      var key = element.getAttribute("data-i18n-aria-label");
      var original = rememberAttribute(element, "aria-label");
      element.setAttribute("aria-label", translatedValue(page, normalizedLanguage, key) || original);
    });

    document.querySelectorAll("[data-i18n-title]").forEach(function (element) {
      var key = element.getAttribute("data-i18n-title");
      var original = rememberAttribute(element, "title");
      element.setAttribute("title", translatedValue(page, normalizedLanguage, key) || original);
    });

    document.documentElement.lang = normalizedLanguage;
    document.querySelectorAll("[data-language]").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.getAttribute("data-language") === normalizedLanguage));
    });

    var pageElement = document.querySelector(".lake-wedding-page");
    if (pageElement) {
      pageElement.classList.add("is-language-ready");
    }

    storeLanguage(normalizedLanguage);
    document.dispatchEvent(new CustomEvent("lakeLanguageChange", { detail: { language: normalizedLanguage } }));
  }

  function setupLanguageSwitch(page) {
    var language = readStoredLanguage();
    document.querySelectorAll("[data-language]").forEach(function (button) {
      button.addEventListener("click", function () {
        applyLanguage(page, button.getAttribute("data-language"));
      });
    });
    applyLanguage(page, language);
  }

  function activateVideo(video) {
    var sources = video.querySelectorAll("source[data-src]");
    var hasRealSource = false;

    sources.forEach(function (source) {
      var sourcePath = source.getAttribute("data-src") || "";
      if (sourcePath && sourcePath.indexOf("VIDEO-") !== 0) {
        source.setAttribute("src", sourcePath);
        hasRealSource = true;
      }
    });

    if (hasRealSource) {
      video.load();
      var frame = video.closest(".lake-video-frame");
      if (frame) {
        frame.classList.add("is-video-ready");
      }
    }
  }

  function setupDeferredVideos() {
    var videos = Array.prototype.slice.call(document.querySelectorAll(".lake-story video"));
    if (!("IntersectionObserver" in window)) {
      videos.forEach(activateVideo);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          activateVideo(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "320px 0px" });

    videos.forEach(function (video) {
      observer.observe(video);
    });
  }

  function setupResponsiveMenu() {
    var button = document.getElementById("responsive-menu-button");
    var container = document.getElementById("responsive-menu-container");
    if (!button || !container) {
      return;
    }

    function setMenu(open) {
      document.documentElement.classList.toggle("responsive-menu-open", open);
      button.classList.toggle("is-active", open);
      button.setAttribute("aria-expanded", String(open));
      container.setAttribute("aria-hidden", String(!open));
    }

    button.setAttribute("aria-controls", "responsive-menu-container");
    setMenu(false);
    button.addEventListener("click", function () {
      setMenu(!document.documentElement.classList.contains("responsive-menu-open"));
    });

    container.querySelectorAll(".responsive-menu-subarrow").forEach(function (arrow) {
      arrow.setAttribute("role", "button");
      arrow.setAttribute("tabindex", "0");
      if (!arrow.hasAttribute("aria-label")) {
        arrow.setAttribute("aria-label", "Apri sottomenu");
      }
      function toggleSubmenu(event) {
        event.preventDefault();
        event.stopPropagation();
        var submenu = arrow.parentElement.nextElementSibling;
        if (submenu) {
          var open = submenu.classList.toggle("responsive-menu-submenu-open");
          arrow.classList.toggle("responsive-menu-subarrow-active", open);
        }
      }
      arrow.addEventListener("click", toggleSubmenu);
      arrow.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          toggleSubmenu(event);
        }
      });
    });

    container.querySelectorAll("a:not([href='#'])").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setMenu(false);
        button.focus();
      }
    });
  }

  function setupBackToTop() {
    var button = document.querySelector(".go-top");
    if (!button) {
      return;
    }
    button.setAttribute("role", "button");
    button.setAttribute("tabindex", "0");
    if (!button.hasAttribute("aria-label")) {
      button.setAttribute("aria-label", "Torna all'inizio della pagina");
    }
    function goToTop() {
      var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    }
    button.addEventListener("click", goToTop);
    button.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        goToTop();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var pageElement = document.querySelector(".lake-wedding-page");
    if (!pageElement) {
      return;
    }
    var page = pageElement.getAttribute("data-lake-page");
    setupLanguageSwitch(page);
    setupDeferredVideos();
    setupResponsiveMenu();
    setupBackToTop();
  });
}());
