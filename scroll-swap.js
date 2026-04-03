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

  function applySwapImage(swap, nextState) {
    const image = getSwapImage(swap);
    if (!image) return;

    const nextSrc = nextState === "after" ? image.dataset.afterSrc : image.dataset.beforeSrc;
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
    if (!swap.dataset.swapState) {
      swap.dataset.swapState = "before";
    }

    const image = getSwapImage(swap);
    if (!image) return;

    preloadSource(image.dataset.beforeSrc);
    preloadSource(image.dataset.afterSrc);
    applySwapImage(swap, swap.dataset.swapState);
  });

  let ticking = false;

  function updateSwaps() {
    const triggerLine = window.innerHeight * 0.58;

    swaps.forEach((swap) => {
      const track = getSwapTrack(swap);
      if (!track) return;

      const nextState = track.getBoundingClientRect().top <= triggerLine ? "after" : "before";

      if ((swap.dataset.swapState || "before") !== nextState) {
        swap.dataset.swapState = nextState;
        applySwapImage(swap, nextState);
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
