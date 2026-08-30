/* Northvale Advisory — main interactions */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function qsa(sel, ctx) {
    return Array.from((ctx || document).querySelectorAll(sel));
  }

  /* ——— Loader ——— */
  function initLoader() {
    const loader = qs(".page-loader");
    if (!loader) {
      document.body.classList.add("is-ready");
      return;
    }

    document.body.classList.add("is-loading");

    const minDuration = prefersReducedMotion ? 0 : 750;
    const start = performance.now();

    function finish() {
      const elapsed = performance.now() - start;
      const wait = Math.max(0, minDuration - elapsed);

      setTimeout(function () {
        loader.classList.add("is-done");
        document.body.classList.remove("is-loading");
        document.body.classList.add("is-ready");
        setTimeout(function () {
          loader.setAttribute("aria-hidden", "true");
        }, 550);
      }, wait);
    }

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
    }
  }

  /* ——— Scroll progress ——— */
  function initScrollProgress() {
    const bar = qs(".scroll-progress");
    if (!bar) return;

    function update() {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const height = doc.scrollHeight - doc.clientHeight;
      const pct = height > 0 ? (scrollTop / height) * 100 : 0;
      bar.style.width = pct + "%";
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ——— Header ——— */
  function initHeader() {
    const header = qs(".site-header");
    if (!header) return;

    function onScroll() {
      header.classList.toggle("is-scrolled", window.scrollY > 20);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const path = window.location.pathname.split("/").pop() || "index.html";
    const current = path === "" ? "index.html" : path;

    qsa(".nav-link, .nav-mobile a").forEach(function (link) {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("http")) return;
      const file = href.split("#")[0].split("/").pop() || "index.html";
      if (file === current) {
        link.classList.add("is-active");
      }
    });

    qsa(".footer-nav a").forEach(function (link) {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("http")) return;
      const file = href.split("#")[0].split("/").pop() || "index.html";
      if (file === current) {
        link.classList.add("is-active");
      }
    });
  }

  /* ——— Mobile menu ——— */
  function initMobileMenu() {
    const toggle = qs(".menu-toggle");
    const menu = qs(".nav-mobile");
    if (!toggle || !menu) return;

    function setOpen(open) {
      toggle.classList.toggle("is-open", open);
      menu.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.setAttribute("aria-hidden", open ? "false" : "true");
      document.body.style.overflow = open ? "hidden" : "";
    }

    toggle.addEventListener("click", function () {
      setOpen(!menu.classList.contains("is-open"));
    });

    qsa("a", menu).forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* ——— Scroll animations ——— */
  function observeReveal(elements, options) {
    if (!elements.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      options || { threshold: 0.12, rootMargin: "0px 0px -32px 0px" }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initScrollAnimations() {
    observeReveal(qsa(".reveal, .reveal-up, .reveal-left, .reveal-clip, .reveal-scale, .image-reveal"));
    observeReveal(qsa(".stagger-children"), {
      threshold: 0.1,
      rootMargin: "0px 0px -24px 0px",
    });
    observeReveal(qsa(".metric"), { threshold: 0.3 });
  }

  /* ——— Counter animations ——— */
  function initCounterAnimations() {
    const counters = qsa("[data-count]");
    if (!counters.length) return;

    counters.forEach(function (el) {
      el.textContent = "—";
    });

    function animateValue(el) {
      const target = parseFloat(el.getAttribute("data-count"));
      const prefix = el.getAttribute("data-prefix") || "";
      const suffix = el.getAttribute("data-suffix") || "";
      const decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      const duration = prefersReducedMotion ? 0 : 1200;
      const start = performance.now();

      el.classList.add("is-counted");

      function frame(now) {
        const t = duration === 0 ? 1 : Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const value = target * eased;
        el.textContent =
          prefix +
          (decimals > 0
            ? value.toFixed(decimals)
            : Math.floor(value).toLocaleString("en-IN")) +
          suffix;
        if (t < 1) requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
    }

    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateValue);
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateValue(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );

    counters.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ——— Services accordion (mobile) + hover ——— */
  function initServiceRows() {
    const rows = qsa(".service-row");
    if (!rows.length) return;

    rows.forEach(function (row) {
      row.addEventListener("click", function () {
        const isOpen = row.classList.contains("is-open");
        rows.forEach(function (r) {
          r.classList.remove("is-open");
          r.setAttribute("aria-expanded", "false");
        });
        if (!isOpen) {
          row.classList.add("is-open");
          row.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  /* ——— Contact form ——— */
  function initContactForm() {
    const form = qs("#contact-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const btn = qs('button[type="submit"]', form);
      const original = btn.textContent;
      btn.textContent = "Message sent";
      btn.disabled = true;
      form.reset();
      setTimeout(function () {
        btn.textContent = original;
        btn.disabled = false;
      }, 2800);
    });
  }

  /* ——— Hover / microinteractions ——— */
  function initHoverInteractions() {
    qsa(".btn-magnetic").forEach(function (btn) {
      if (prefersReducedMotion) return;

      btn.addEventListener("mousemove", function (e) {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform =
          "translate(" + x * 0.06 + "px, " + y * 0.06 + "px)";
      });

      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "";
      });
    });
  }

  function init() {
    initLoader();
    initScrollProgress();
    initHeader();
    initMobileMenu();
    initScrollAnimations();
    initCounterAnimations();
    initServiceRows();
    initContactForm();
    initHoverInteractions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
