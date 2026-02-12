/* eslint-env browser */

const Selectors = {
  /** @returns {HTMLDivElement | null} */
  content: () => document.querySelector("main.site-content"),
  /** @return {HTMLInputElement | null} */
  tocInput: () => document.querySelector("#table-of-contents-toggle"),
  /** @return {HTMLButtonElement | null} */
  tocButton: () => document.querySelector("#table-of-contents-toggle-button"),
  /** @return {HTMLDivElement | null} */
  siteContainer: () => document.querySelector(".site-container"),
  /** @return {HTMLDivElement | null } */
  colorSchemeToggleButton: () =>
    document.querySelector(".color-scheme-toggle__button"),
  /** @return {HTMLInputElement | null } */
  colorSchemeLightInput: () =>
    document.querySelector(".color-scheme-toggle__input[value='light']"),
  /** @return {HTMLInputElement | null } */
  colorSchemeDarkInput: () =>
    document.querySelector(".color-scheme-toggle__input[value='dark']"),
};

function cleanPageLink(link) {
  return link
    .replace(/index\.html$/, "")
    .replace(/\.html$/, "")
    .replace(/\//, "");
}

/**
 * @param {string} url
 * @param {boolean} pushState
 */
function loadContent(url, pushState = true, scrollToTop = 0) {
  const siteContainer = Selectors.siteContainer();
  const link = URL.parse(url);
  if (!link) {
    console.error("Invalid url");
    return;
  }
  siteContainer?.classList.add("site-container--loading");
  const xhr = new XMLHttpRequest();
  xhr.onload = () => {
    const content = Selectors.content();
    if (!content) {
      console.error("Cannot load page: could not find content div!");
      return;
    }
    content.innerHTML = xhr.responseText;
    if (pushState) {
      history.pushState({ href: link.href }, "", link.href);
    }
    if (link.hash) {
      const anchor = document.querySelector(link.hash);
      if (anchor) anchor.scrollIntoView();
    } else {
      content.innerHTML = xhr.responseText;
      content.scrollTo({ top: scrollToTop });
      siteContainer?.classList.remove("site-container--loading");
    }

    const input = Selectors.tocInput();
    if (input) input.checked = false;
  };
  xhr.responseType = "text";
  xhr.open("GET", url.replace(".html", "-content.html"));
  xhr.send();
}

/**
 * intercepts all click/touch events on links
 */
function touchAndClickLinkIntercept(e) {
  if (!e.target || !(e.target instanceof Element)) {
    return;
  }

  if (
    e.target &&
    e.target instanceof HTMLAnchorElement &&
    e.target.href === location.href &&
    location.hash.length > 1
  ) {
    if (!e.defaultPrevented) {
      onHashChange();
    }
  }

  const link = e.target.closest("a");

  if (link && link.host === window.location.host) {
    e.preventDefault();
    // load links to local pages into the main content area and preserve
    // the sidebar/nav in dom
    if (
      cleanPageLink(window.location.pathname) !== cleanPageLink(link.pathname)
    ) {
      loadContent(link.href);
    } else {
      const content = Selectors.content();
      if (content) content.scrollTo({ top: 0 });
    }
  }
}

/**
 * @param {Event} e
 */
function onClickTOCButton(e) {
  const container = Selectors.siteContainer();
  const input = Selectors.tocInput();

  if (container && container.scrollTop > 400) {
    container.scrollTo(0, 0);
    if (input && input.checked) {
      e.preventDefault();
    }
  }
}

function toggleColorScheme() {
  const colorSchemeLightInput = Selectors.colorSchemeLightInput();
  const colorSchemeDarkInput = Selectors.colorSchemeDarkInput();
  const colorSchemeToggleButton = Selectors.colorSchemeToggleButton();

  if (colorSchemeLightInput.checked) {
    colorSchemeDarkInput.checked = true;
    colorSchemeToggleButton.classList.add("active");
  } else if (colorSchemeDarkInput.checked) {
    colorSchemeLightInput.checked = true;
    colorSchemeToggleButton.classList.remove("active");
  } else if (colorSchemeToggleButton.classList.contains("active")) {
    colorSchemeLightInput.checked = true;
    colorSchemeToggleButton.classList.remove("active");
  } else if (!colorSchemeToggleButton.classList.contains("active")) {
    colorSchemeDarkInput.checked = true;
    colorSchemeToggleButton.classList.add("active");
  }
}

function onHashChange() {
  /** @type {string | undefined} */
  let hash;

  try {
    hash = decodeURIComponent(location.hash.slice(1)).toLowerCase();
  } catch {
    return;
  }

  const name = "user-content-" + hash;
  const target =
    document.getElementById(name) || document.getElementsByName(name)[0];

  if (target) {
    target.scrollIntoView();
  }
}

function initColorSchemeToggle() {
  const colorSchemeToggleButton = Selectors.colorSchemeToggleButton();

  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  ) {
    colorSchemeToggleButton.classList.remove("active");
  }
  colorSchemeToggleButton.removeAttribute("hidden");

  const colorSchemeToggle = Selectors.colorSchemeToggleButton();
  colorSchemeToggle?.addEventListener("click", toggleColorScheme);
  colorSchemeToggle?.addEventListener("touch", toggleColorScheme);
}

function initContentScrollListeners() {
  const content = Selectors.content();
  content?.addEventListener("scrollend", () => {
    history.replaceState(
      { contentScrollTop: content.scrollTop },
      "",
      cleanPageLink(window.location.href),
    );
  });
}

function initStateChangeHandlers() {
  window.onpopstate = ({ state }) => {
    loadContent(window.location.href, false, state?.contentScrollTop || 0);
  };

  if (history.state?.contentScrollTop) {
    const content = Selectors.content();
    content?.scrollTo({ top: history.state.contentScrollTop });
  }

  // dom clobbering protection
  onHashChange();
  window.addEventListener("hashchange", onHashChange);
}

function initLinkIntercepts() {
  document.addEventListener("click", touchAndClickLinkIntercept);
  document.addEventListener("touch", touchAndClickLinkIntercept);
}

function initTOCToggleButton() {
  const TOCToggleButton = Selectors.tocButton();
  TOCToggleButton?.addEventListener("click", onClickTOCButton);
}

function init() {
  initColorSchemeToggle();
  initContentScrollListeners();
  initStateChangeHandlers();
  initLinkIntercepts();
  initTOCToggleButton();
}
