/**
 * InsidCode Handcrafted Service Worker (Next.js 15 App Router Compatible)
 *
 * Provides instant app shell and static asset caching.
 *
 * STRICT SECURITY & PRIVACY INVARIANTS:
 *  - NEVER intercepts or caches:
 *      * /api/auth/*
 *      * /api/submit
 *      * /api/execute*
 *      * /api/duel*
 *      * /api/admin*
 *      * /api/user*
 *      * /api/notifications*
 *      * /api/problems/*\/user-state
 *      * Any non-GET request
 *      * Any response with 'Set-Cookie' header
 *      * Any response with 3xx redirect to /login
 *  - All user state, personal stats, and code drafts reside ONLY in IndexedDB (deviceCache.ts).
 */

const SW_VERSION = "v1.4.2";
const CACHE_STATIC = `insidcode-static-${SW_VERSION}`;
const CACHE_SHELL = `insidcode-shell-${SW_VERSION}`;
const CACHE_MONACO = `insidcode-monaco-${SW_VERSION}`;

// Pre-cached critical assets for instant shell
const PRECACHE_SHELL = [
  "/",
  "/problems",
  "/leaderboard",
  "/icon.svg",
];

// Kill-switch check
const KILL_SWITCH_ENDPOINT = "/api/sw-disabled";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => {
      return cache.addAll(PRECACHE_SHELL).catch(() => {
        // Continue even if an asset fails to precache
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (
            key !== CACHE_STATIC &&
            key !== CACHE_SHELL &&
            key !== CACHE_MONACO
          ) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

/**
 * Validates whether a request should be excluded from service worker interception.
 */
function shouldBypassRequest(request, url) {
  // 1. Only intercept GET requests
  if (request.method !== "GET") return true;

  const pathname = url.pathname;

  // 2. Strict sensitive and per-user endpoint exclusions
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/submit") ||
    pathname.startsWith("/api/execute") ||
    pathname.startsWith("/api/duel") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/user") ||
    pathname.startsWith("/api/notifications") ||
    pathname.includes("/user-state") ||
    pathname === KILL_SWITCH_ENDPOINT
  ) {
    return true;
  }

  // 3. Browser extension or chrome URLs
  if (!url.protocol.startsWith("http")) return true;

  return false;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Bypass excluded requests
  if (shouldBypassRequest(request, url)) {
    return;
  }

  // Strategy 1: Cache-First for versioned immutable static assets & Monaco
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.hostname.includes("cdn.jsdelivr.net") ||
    url.pathname.includes("/vs/") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png")
  ) {
    const targetCache = url.hostname.includes("cdn.jsdelivr.net") || url.pathname.includes("/vs/")
      ? CACHE_MONACO
      : CACHE_STATIC;

    event.respondWith(
      caches.open(targetCache).then((cache) => {
        return cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((networkRes) => {
            if (networkRes.ok && networkRes.type !== "opaque" && !networkRes.headers.has("Set-Cookie")) {
              cache.put(request, networkRes.clone());
            } else if (networkRes.ok && networkRes.type === "opaque") {
              // CDN opaque responses (e.g. Monaco CDN)
              cache.put(request, networkRes.clone());
            }
            return networkRes;
          });
        });
      })
    );
    return;
  }

  // Strategy 2: Stale-While-Revalidate for public GET APIs and HTML Shell
  if (
    request.mode === "navigate" ||
    url.pathname === "/api/problems" ||
    (url.pathname.startsWith("/api/problems/") && !url.pathname.includes("/user-state")) ||
    url.pathname === "/api/leaderboard"
  ) {
    event.respondWith(
      caches.open(CACHE_SHELL).then((cache) => {
        return cache.match(request).then((cached) => {
          const fetchPromise = fetch(request)
            .then((networkRes) => {
              // Never cache responses that set cookies or redirect to login
              if (
                networkRes.ok &&
                !networkRes.headers.has("Set-Cookie") &&
                !networkRes.redirected
              ) {
                cache.put(request, networkRes.clone());
              }
              return networkRes;
            })
            .catch(() => {
              // If network fails and no cache exists, return offline fallback if navigate
              return cached;
            });

          return cached || fetchPromise;
        });
      })
    );
    return;
  }
});

// Support kill-switch or update messages from client
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data === "UNREGISTER_KILL_SWITCH") {
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => caches.delete(name)));
    }).then(() => {
      self.registration.unregister();
    });
  }
});
