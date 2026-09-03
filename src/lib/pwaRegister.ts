// Single guarded service-worker registration wrapper.
// Registers /sw.js ONLY in the real production app — never in dev,
// Lovable preview, iframes, or when ?sw=off is present.

const REFUSED_HOSTS = [
  /^id-preview--/,
  /^preview--/,
  /(^|\.)lovableproject\.com$/,
  /(^|\.)lovableproject-dev\.com$/,
  /(^|\.)beta\.lovable\.dev$/,
];

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === 'undefined') return true;
  if (window.self !== window.top) return true; // inside an iframe
  const host = window.location.hostname;
  if (REFUSED_HOSTS.some((re) => re.test(host))) return true;
  if (new URLSearchParams(window.location.search).get('sw') === 'off') return true;
  return false;
}

async function unregisterAppServiceWorkers() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      registrations
        .filter((reg) => {
          const script =
            reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || '';
          return script.endsWith('/sw.js');
        })
        .map((reg) => reg.unregister()),
    );
  } catch {
    // ignore — cleanup is best effort
  }
}

export async function registerAppServiceWorker() {
  if (isRefusedContext()) {
    // Make sure stale app SWs never serve this preview/dev context.
    void unregisterAppServiceWorkers();
    return;
  }
  if (!('serviceWorker' in navigator)) return;
  try {
    const { registerSW } = await import('virtual:pwa-register');
    registerSW({ immediate: true });
  } catch {
    // ignore
  }
}
