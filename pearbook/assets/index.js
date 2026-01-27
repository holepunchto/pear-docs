// @ts-check
/* eslint-env browser */

const Selectors = {
  /** @returns {HTMLDivElement | null} */
  content: () => document.querySelector("main.site-content"),
  /**
   * Input controlling whether the table of contents is opened
   * @return {HTMLInputElement | null}
   */
  tocInput: () => document.querySelector("#table-of-contents-toggle"),
  /** @return {HTMLDivElement | null} */
  siteContainer: () => document.querySelector(".site-container"),
  /** @return {HTMLDivElement | null } */
  colorSchemeToggleButton: () =>
    document.querySelector(".color-scheme-toggle__button"),
};

/** close the table of contents */
function closeTOC() {
  const input = Selectors.tocInput();
  if (!input) return;
  input.checked = false;
}

window.onpopstate = () => {
  loadContent(window.location.href, false);
};

/**
 * @param {string} url
 * @param {boolean} pushState
 */
function loadContent(url, pushState = true) {
  const siteContainer = document.querySelector(".site-container");
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
    if (pushState) history.pushState({ href: link.href }, "", link.href);
    if (link.hash) {
      const anchor = document.querySelector(link.hash);
      if (anchor) anchor.scrollIntoView();
    } else {
      content.innerHTML = xhr.responseText;
      content.scrollTo({ top: 0 });
      siteContainer?.classList.remove("site-container--loading");
    }
    closeTOC();
  };
  xhr.responseType = "text";
  xhr.open("GET", url.replace(".html", "-content.html"));
  xhr.send();
}

/**
 *
 * @param {Event} e
 * @returns
 */
function touchAndClickLinkIntercept(e) {
  if (!e.target || !(e.target instanceof Element)) {
    return;
  }

  const link = e.target.closest("a");

  if (link && link.host === window.location.host) {
    const siteContainer = document.querySelector(".site-container");
    // load links to local pages into the main content area and preserve
    // the sidebar/nav in dom
    if (window.location.pathname !== link.pathname) {
      // prevents default page load
      e.preventDefault();
      loadContent(link.href);
    } else {
      if (siteContainer) siteContainer.scrollTo({ top: 0 });
    }
  }
}

document.addEventListener("click", touchAndClickLinkIntercept);
document.addEventListener("touch", touchAndClickLinkIntercept);

/**
 * @param {Event} e
 */
function onClickTOCButton(e) {
  const container = document.querySelector(".site-container");
  const input = Selectors.tocInput();

  if (container && container.scrollTop > 400) {
    container.scrollTo(0, 0);
    if (input && input.checked) {
      e.preventDefault();
    }
  }
}

const TOCToggleButton = document.querySelector(
  "#table-of-contents-toggle-button",
);
if (TOCToggleButton) {
  TOCToggleButton.addEventListener("click", onClickTOCButton);
}

if (
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches
) {
  setColorScheme("dark");
} else {
  setColorScheme("light");
}

/** @param {"light" | "dark"} colorScheme */
function setColorScheme(colorScheme) {
  const colorSchemeToggle = Selectors.colorSchemeToggleButton();

  if (!colorSchemeToggle) {
    console.error("theme toggle button not found");
    return;
  }

  if (colorScheme === "dark") {
    const sources = /** @type {NodeListOf<HTMLSourceElement>} */ (
      document.querySelectorAll('source[data-color-scheme-override="true"]')
    );
    sources.forEach((d) => {
      d.media = "(prefers-color-scheme:light)";
      delete d.dataset.forced;
    });
    document.documentElement.style.colorScheme = colorScheme;
    colorSchemeToggle.classList.add("active");
  } else if (colorScheme === "light") {
    const lightIconSources = /** @type {NodeListOf<HTMLSourceElement>} */ (
      document.querySelectorAll('source[media="(prefers-color-scheme:light)"]')
    );
    lightIconSources.forEach((d) => {
      d.removeAttribute("media");
      d.dataset.colorSchemeOverride = "true";
    });
    document.documentElement.style.colorScheme = colorScheme;
    colorSchemeToggle.classList.remove("active");
  } else {
    console.error(`unkonwn color scheme ${colorScheme}`);
  }
}

// @ts-expect-error
window.toggleColorScheme = function toggleColorScheme() {
  const colorScheme = document.documentElement.style.colorScheme;
  const colorSchemeToggle = Selectors.colorSchemeToggleButton();

  if (!colorSchemeToggle) {
    console.error("theme toggle button not found");
    return;
  }

  if (colorScheme === "light") {
    setColorScheme("dark");
  } else {
    setColorScheme("light");
  }
};
