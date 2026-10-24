(() => {
  'use strict';
  const cache = new Map();
  let currentId = null;
  let result = null;
  let controller;
  let timer;
  const elementId = 'gimmehours-publication-time';
  const exactDate = value => typeof value === 'string' &&
    /^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)$/.test(value) &&
    Number.isFinite(Date.parse(value)) ? value : null;

  function extract(response, id) {
    if (response?.videoDetails?.videoId !== id) return null;
    const data = response?.microformat?.playerMicroformatRenderer;
    const value = exactDate(data?.publishDate) || exactDate(data?.uploadDate);
    return value ? { value, kind: exactDate(data?.publishDate) ? 'Publikacja' : 'Przesłanie' } : null;
  }

  // Parse only JSON; never execute JavaScript fetched from a page.
  function readResponse(html) {
    const marker = /(?:var\s+ytInitialPlayerResponse\s*=|window\["ytInitialPlayerResponse"\]\s*=)/g;
    const match = marker.exec(html);
    if (!match) return null;
    const start = html.indexOf('{', marker.lastIndex);
    let depth = 0, quoted = false, escaped = false;
    for (let i = start; start >= 0 && i < html.length; i++) {
      const char = html[i];
      if (quoted) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') quoted = false;
      } else if (char === '"') quoted = true;
      else if (char === '{') depth++;
      else if (char === '}' && --depth === 0) {
        try { return JSON.parse(html.slice(start, i + 1)); } catch { return null; }
      }
    }
    return null;
  }

  function liveResponse(id) {
    const player = document.getElementById('movie_player');
    try {
      const found = extract(player?.getPlayerResponse?.(), id);
      if (found) return found;
    } catch { /* Player may be rebuilding during navigation. */ }
    return extract(window.ytInitialPlayerResponse, id);
  }

  let patched = null;

  function restoreDate() {
    if (!patched) return;
    // Restore only our own value; YouTube may already have reused this node.
    if (patched.node.textContent === patched.text) {
      patched.node.textContent = patched.original;
      if (patched.title === null) patched.node.removeAttribute('title');
      else patched.node.setAttribute('title', patched.title);
    }
    patched = null;
  }

  function render() {
    document.getElementById(elementId)?.remove(); // Remove an old 0.1 label if present.
    if (!currentId || location.pathname !== '/watch' || !result?.value) {
      restoreDate();
      return;
    }
    const metadata = document.querySelector('ytd-watch-metadata');
    const description = metadata?.querySelector('#description') ||
      document.querySelector('ytd-watch-flexy #description');
    const expander = description?.querySelector('ytd-text-inline-expander') ||
      document.querySelector('#description-inline-expander');
    const expanded = expander
      ? (expander.isExpanded === true || (expander.hasAttribute('is-expanded') &&
          expander.getAttribute('is-expanded') !== 'false'))
      : !!metadata && !metadata.hasAttribute('description-collapsed');
    if (!description || !expanded) { restoreDate(); return; }

    // Target only the existing metadata date, never dates inside the video description.
    const candidates = description.querySelectorAll(
      '#info-container yt-formatted-string span, #info-container > span, #info > span, #info > yt-formatted-string'
    );
    const node = Array.from(candidates).reverse().find(candidate =>
      !candidate.querySelector('span, yt-formatted-string') &&
      /\b(?:19|20)\d{2}\b/.test(candidate.textContent) &&
      !/wyświetle|views|watching|ogląda/i.test(candidate.textContent)
    );
    if (!node) { restoreDate(); return; }
    if (patched && (patched.node !== node || node.textContent !== patched.text)) restoreDate();
    if (!patched) patched = {
      node, original: node.textContent, title: node.getAttribute('title'), text: null
    };
    const date = new Date(result.value);
    const language = document.documentElement.lang || navigator.language || 'pl-PL';
    // Modify the native date span, retaining its existing font, weight and color.
    const text = new Intl.DateTimeFormat(language, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    }).format(date);
    patched.text = text;
    if (node.textContent !== text) node.textContent = text;
    const title = result.kind + ' · ' + Intl.DateTimeFormat().resolvedOptions().timeZone +
      ' · UTC: ' + date.toISOString();
    if (node.getAttribute('title') !== title) node.setAttribute('title', title);
  }

  async function update() {
    const id = location.pathname === '/watch' ? new URL(location.href).searchParams.get('v') : null;
    if (id === currentId) { render(); return; }
    controller?.abort();
    restoreDate();
    document.getElementById(elementId)?.remove();
    currentId = id;
    result = null;
    if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) return;
    result = cache.get(id) || liveResponse(id);
    render();
    if (result) return;
    const request = controller = new AbortController();
    const timeout = setTimeout(() => request.abort(), 12000);
    try {
      const response = await fetch(`/watch?v=${encodeURIComponent(id)}`, {
        credentials: 'same-origin', signal: request.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      if (currentId !== id || controller !== request) return;
      result = liveResponse(id) || extract(readResponse(html), id) ||
        { error: 'GimmeHours: YouTube nie udostępnił dokładnej godziny.' };
      if (result.value) {
        cache.set(id, result);
        if (cache.size > 100) cache.delete(cache.keys().next().value);
      }
    } catch (error) {
      if (currentId !== id || controller !== request) return;
      result = { error: 'GimmeHours: nie udało się odczytać godziny. Kliknij, aby ponowić.' };
    } finally {
      clearTimeout(timeout);
      if (currentId === id && controller === request) render();
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(update, 120);
  }
  document.addEventListener('yt-navigate-finish', schedule);
  window.addEventListener('popstate', schedule);
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['is-expanded', 'description-collapsed'] });
  update();
})();
