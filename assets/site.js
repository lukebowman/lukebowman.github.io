const tablist = document.querySelector(".work-tabs");
if (tablist) {
  const tabs = [...tablist.querySelectorAll("button")];
  const panels = tabs.map((tab) =>
    document.getElementById(tab.getAttribute("aria-controls")),
  );
  const compact = matchMedia("(max-width: 800px)");

  function select(selected, focus = false) {
    tabs.forEach((tab, index) => {
      const active = index === selected;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[index].toggleAttribute("inert", !active);
    });
    if (focus) tabs[selected].focus();
  }

  function orient() {
    tablist.setAttribute(
      "aria-orientation",
      compact.matches ? "horizontal" : "vertical",
    );
  }

  tablist.setAttribute("role", "tablist");
  tablist.setAttribute("aria-labelledby", "work-title");
  tabs.forEach((tab, index) => {
    tab.setAttribute("role", "tab");
    panels[index].setAttribute("role", "tabpanel");
    panels[index].setAttribute("aria-labelledby", tab.id);
    panels[index].tabIndex = 0;
    tab.addEventListener("click", () => select(index));
    tab.addEventListener("keydown", (event) => {
      const next = compact.matches ? "ArrowRight" : "ArrowDown";
      const previous = compact.matches ? "ArrowLeft" : "ArrowUp";
      let target;
      if (event.key === next) target = (index + 1) % tabs.length;
      if (event.key === previous)
        target = (index + tabs.length - 1) % tabs.length;
      if (event.key === "Home") target = 0;
      if (event.key === "End") target = tabs.length - 1;
      if (target === undefined) return;
      event.preventDefault();
      select(target, true);
    });
  });
  orient();
  compact.addEventListener("change", orient);

  // Expose any project reached through its section fragment.
  function selectFragment() {
    const index = panels.findIndex((panel) => `#${panel.id}` === location.hash);
    if (index >= 0) select(index);
  }
  select(0);
  selectFragment();
  addEventListener("hashchange", selectFragment);
  tablist.hidden = false;
}

const dialog = document.querySelector(".sample-viewer");
if (typeof dialog?.showModal === "function") {
  const title = dialog.querySelector("h2");
  const original = dialog.querySelector(".sample-original");
  const description = dialog.querySelector(".sample-description-link");
  const media = dialog.querySelector(".sample-media");
  const error = dialog.querySelector(".sample-error");
  let opener,
    backdropPress = false;
  document.querySelectorAll("a[data-sample]").forEach((link) => {
    link.setAttribute("aria-haspopup", "dialog");
    link.addEventListener("click", (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      opener = link;
      const label = link.dataset.title || link.textContent.trim();
      title.textContent = label;
      error.hidden = true;
      backdropPress = false;
      const overview = link.dataset.overview
        ? document.getElementById(link.dataset.overview)
        : null;
      const source = overview?.querySelector(".sample-source");
      const summary = overview?.querySelector(".sample-summary");
      original.href = source?.href || link.href;
      original.target = "_blank";
      original.rel = "noopener noreferrer";
      original.textContent = source || link.dataset.sample
        ? "Open original PDF (new tab)"
        : "Open full-size image (new tab)";
      description.hidden = !link.dataset.description;
      if (link.dataset.description) description.href = link.dataset.description;
      else description.removeAttribute("href");
      if (summary && source) {
        media.replaceChildren(summary.cloneNode(true));
      } else {
        const image = document.createElement("img");
        image.alt = link.dataset.alt || label;
        image.referrerPolicy = "no-referrer";
        image.addEventListener("error", () => {
          if (!image.isConnected) return;
          image.remove();
          error.hidden = false;
        });
        image.src = link.dataset.sample || link.href;
        media.replaceChildren(image);
      }
      dialog.showModal();
    });
  });
  description.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    // Follow the description in the same tab instead of returning to the opener.
    opener = null;
    dialog.close();
  });
  dialog.addEventListener("pointerdown", (event) => {
    backdropPress = event.target === dialog;
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog && backdropPress) dialog.close();
    backdropPress = false;
  });
  dialog.addEventListener("close", () => {
    if (dialog.open) return;
    media.replaceChildren();
    opener?.focus({ preventScroll: true });
  });
}
