(function () {
  const swaps = Array.from(document.querySelectorAll("[data-scroll-swap]"));
  if (!swaps.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const preloadCache = new Set();

  function getSwapImage(swap) {
    return swap.querySelector(".scroll-swap__image");
  }

  function getSwapTrack(swap) {
    return swap.querySelector(".scroll-swap__track");
  }

  function preloadSource(src) {
    if (!src || preloadCache.has(src)) return;
    const preloader = new Image();
    preloader.src = src;
    preloadCache.add(src);
  }

  function getSwapSources(image) {
    const sources = image.dataset.swapSrcs
      ? image.dataset.swapSrcs.split(",").map((src) => src.trim()).filter(Boolean)
      : [];

    if (sources.length) return sources;

    return [image.dataset.beforeSrc, image.dataset.afterSrc].filter(Boolean);
  }

  function getInitialSwapIndex(swap, sources) {
    const requestedIndex = Number.parseInt(swap.dataset.swapIndex, 10);

    if (Number.isInteger(requestedIndex)) {
      return Math.min(Math.max(requestedIndex, 0), sources.length - 1);
    }

    if (swap.dataset.swapState === "after") {
      return Math.min(1, sources.length - 1);
    }

    return 0;
  }

  function applySwapImage(swap, nextIndex) {
    const image = getSwapImage(swap);
    if (!image) return;

    const sources = getSwapSources(image);
    if (!sources.length) return;

    const clampedIndex = Math.min(Math.max(nextIndex, 0), sources.length - 1);
    const nextSrc = sources[clampedIndex];
    swap.dataset.swapIndex = String(clampedIndex);
    swap.dataset.swapState = clampedIndex === 0 ? "before" : "after";

    if (!nextSrc || image.getAttribute("src") === nextSrc) return;

    if (prefersReducedMotion.matches) {
      image.setAttribute("src", nextSrc);
      return;
    }

    let settled = false;

    function finishSwap() {
      if (settled) return;
      settled = true;
      image.classList.remove("is-swapping");
      image.removeEventListener("load", handleLoad);
      image.removeEventListener("error", handleLoad);
    }

    function handleLoad() {
      requestAnimationFrame(finishSwap);
    }

    image.classList.add("is-swapping");
    image.addEventListener("load", handleLoad, { once: true });
    image.addEventListener("error", handleLoad, { once: true });
    image.setAttribute("src", nextSrc);

    if (image.complete) {
      handleLoad();
    }
  }

  swaps.forEach((swap) => {
    const image = getSwapImage(swap);
    if (!image) return;

    const sources = getSwapSources(image);
    sources.forEach(preloadSource);
    applySwapImage(swap, getInitialSwapIndex(swap, sources));
  });

  let ticking = false;

  function updateSwaps() {
    const triggerLine = window.innerHeight * 0.58;

    swaps.forEach((swap) => {
      const track = getSwapTrack(swap);
      if (!track) return;

      const image = getSwapImage(swap);
      if (!image) return;

      const sources = getSwapSources(image);
      if (!sources.length) return;

      const trackRect = track.getBoundingClientRect();
      const trackProgress = Math.min(Math.max((triggerLine - trackRect.top) / trackRect.height, 0), 0.999);
      const nextIndex = trackRect.top <= triggerLine
        ? Math.min(Math.floor(trackProgress * (sources.length - 1)) + 1, sources.length - 1)
        : 0;

      if (Number.parseInt(swap.dataset.swapIndex, 10) !== nextIndex) {
        applySwapImage(swap, nextIndex);
      }
    });

    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateSwaps);
  }

  requestUpdate();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
})();
