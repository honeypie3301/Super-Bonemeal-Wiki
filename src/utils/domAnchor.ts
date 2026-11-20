export interface PointerBlockAnchor {
  ap: string;
  ax: number;
  ay: number;
}

export interface SelectionAnchor {
  ap: string;
  so: number;
  eo: number;
  sp: string;
}

export interface ContentMetrics {
  center: number;
  width: number;
}

const MAX_PATH_LEN = 160;
const MAX_SNIPPET_LEN = 48;

const SEMANTIC_LEAF_BLOCKS = new Set([
  'BUTTON',
  'A',
  'SUMMARY',
  'LABEL',
  'INPUT',
  'SELECT',
  'TEXTAREA',
  'TD',
  'TH',
  'LI',
  'P',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'PRE',
  'BLOCKQUOTE',
  'FIGCAPTION',
  'IMG',
  'SVG',
  'CANVAS',
  'TR',
]);

const CONTAINER_BLOCKS = new Set([
  'SECTION',
  'ARTICLE',
  'TABLE',
  'THEAD',
  'TBODY',
  'UL',
  'OL',
  'DL',
  'FIGURE',
  'DETAILS',
  'HEADER',
  'FOOTER',
  'ASIDE',
  'DIV',
]);

function roundCoord(n: number, precision = 10000): number {
  return Math.round(n * precision) / precision;
}

function clampAnchorRatio(n: number): number {
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(-2, Math.min(3, roundCoord(n)));
}

export function sanitizePointerAnchor(raw: unknown): PointerBlockAnchor | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const obj = raw as Record<string, unknown>;
  const ap = typeof obj.ap === 'string' ? obj.ap.trim().slice(0, MAX_PATH_LEN) : '';
  const ax = Number(obj.ax);
  const ay = Number(obj.ay);
  if (!ap || !Number.isFinite(ax) || !Number.isFinite(ay)) return undefined;
  return {
    ap,
    ax: clampAnchorRatio(ax),
    ay: clampAnchorRatio(ay),
  };
}

export function sanitizeSelectionAnchor(raw: unknown): SelectionAnchor | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const obj = raw as Record<string, unknown>;
  const ap = typeof obj.ap === 'string' ? obj.ap.trim().slice(0, MAX_PATH_LEN) : '';
  const so = Math.floor(Number(obj.so));
  const eo = Math.floor(Number(obj.eo));
  const sp = typeof obj.sp === 'string' ? obj.sp.replace(/\s+/g, ' ').trim().slice(0, MAX_SNIPPET_LEN) : '';
  if (!ap || !Number.isFinite(so) || !Number.isFinite(eo) || so < 0 || eo <= so) return undefined;
  return { ap, so, eo, sp };
}

export function getMainElement(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector('main');
}

export function getContentMetrics(mainEl: HTMLElement | null): ContentMetrics {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  if (!mainEl) {
    return { center: vw / 2, width: vw };
  }
  const firstChild = mainEl.firstElementChild as HTMLElement | null;
  const target =
    firstChild && firstChild.getBoundingClientRect().width > 200
      ? firstChild
      : mainEl;
  const rect = target.getBoundingClientRect();
  const width = rect.width > 0 ? rect.width : vw;
  const center = rect.width > 0 ? rect.left + rect.width / 2 : vw / 2;
  return { center, width };
}

function isUniqueIdInside(id: string, root: HTMLElement): boolean {
  if (!id || id.length > 64 || /[:/\s]/.test(id)) return false;
  try {
    const escaped = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
      ? CSS.escape(id)
      : id.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
    const matches = root.querySelectorAll(`[id="${escaped}"]`);
    return matches.length === 1;
  } catch {
    return false;
  }
}

export function encodeDomPath(el: HTMLElement, mainEl: HTMLElement): string | null {
  if (el === mainEl) return 'main';
  if (!mainEl.contains(el)) return null;

  const segments: string[] = [];
  let cur: HTMLElement | null = el;

  while (cur && cur !== mainEl) {
    if (cur.id && isUniqueIdInside(cur.id, mainEl)) {
      const prefix = `id:${cur.id}`;
      const path = segments.length > 0 ? `${prefix}/${segments.reverse().join('/')}` : prefix;
      return path.length <= MAX_PATH_LEN ? path : null;
    }

    const parent = cur.parentElement;
    if (!parent) break;
    const tag = cur.tagName.toLowerCase();
    const index = Array.prototype.indexOf.call(parent.children, cur);
    if (index < 0) return null;
    segments.push(`${tag}:${index}`);
    cur = parent;
  }

  if (cur !== mainEl) return null;
  const path = segments.length > 0 ? `main/${segments.reverse().join('/')}` : 'main';
  return path.length <= MAX_PATH_LEN ? path : null;
}

export function resolveDomPath(path: string, mainEl: HTMLElement | null): HTMLElement | null {
  if (!path || !mainEl) return null;
  if (path === 'main') return mainEl;

  const parts = path.split('/');
  const rootSeg = parts[0];
  let cur: HTMLElement | null = null;

  if (rootSeg === 'main') {
    cur = mainEl;
  } else if (rootSeg.startsWith('id:')) {
    const id = rootSeg.slice(3);
    try {
      const escaped = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(id)
        : id.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
      cur = mainEl.querySelector(`[id="${escaped}"]`) as HTMLElement | null;
    } catch {
      cur = null;
    }
  }

  if (!cur) return null;

  for (let i = 1; i < parts.length; i++) {
    const [tag, rawIdx] = parts[i].split(':');
    const idx = Number(rawIdx);
    if (!tag || !Number.isInteger(idx) || idx < 0) return null;

    const child = cur.children[idx] as HTMLElement | undefined;
    if (child && child.tagName.toLowerCase() === tag) {
      cur = child;
      continue;
    }

    // Resilient fallback if a neighboring block shifted slightly: match nearest sibling with same tag
    let foundSibling: HTMLElement | null = null;
    let bestDist = Infinity;
    for (let j = 0; j < cur.children.length; j++) {
      const cand = cur.children[j] as HTMLElement;
      if (cand.tagName.toLowerCase() === tag) {
        const dist = Math.abs(j - idx);
        if (dist < bestDist) {
          bestDist = dist;
          foundSibling = cand;
        }
      }
    }
    if (!foundSibling || bestDist > 3) return null;
    cur = foundSibling;
  }

  return cur;
}

export function findAnchorBlock(
  startEl: Element | null,
  mainEl: HTMLElement | null,
  preferTextContainer = false
): HTMLElement | null {
  if (!startEl || !mainEl || !mainEl.contains(startEl)) return null;
  let cur: HTMLElement | null =
    startEl instanceof HTMLElement ? startEl : startEl.parentElement;

  let fallbackBlock: HTMLElement | null = null;

  while (cur && cur !== mainEl) {
    if (cur.id === 'stats-modal-container' || cur.dataset.remoteCursorRoot === 'true') {
      return null;
    }
    const tag = cur.tagName;
    const rect = cur.getBoundingClientRect();

    if (rect.width >= 12 && rect.height >= 12) {
      if (preferTextContainer) {
        if (
          SEMANTIC_LEAF_BLOCKS.has(tag) ||
          (CONTAINER_BLOCKS.has(tag) && rect.height <= 900)
        ) {
          return cur;
        }
      } else {
        if (SEMANTIC_LEAF_BLOCKS.has(tag) && rect.height <= 640) {
          return cur;
        }
        if (
          !fallbackBlock &&
          (cur.dataset.anchorId || (CONTAINER_BLOCKS.has(tag) && rect.height <= 420 && rect.width <= 1100))
        ) {
          fallbackBlock = cur;
        }
      }
    }
    cur = cur.parentElement;
  }

  return fallbackBlock;
}

export function capturePointerAnchor(
  clientX: number,
  clientY: number,
  eventTarget: HTMLElement | null,
  mainEl: HTMLElement | null
): PointerBlockAnchor | undefined {
  if (!mainEl) return undefined;
  let candidate: Element | null = eventTarget;

  if (!candidate || !mainEl.contains(candidate)) {
    const hit = typeof document !== 'undefined' ? document.elementFromPoint(clientX, clientY) : null;
    if (hit && mainEl.contains(hit)) {
      candidate = hit;
    }
  }

  const block = findAnchorBlock(candidate, mainEl, false);
  if (!block) return undefined;

  const rect = block.getBoundingClientRect();
  if (rect.width < 8 || rect.height < 8) return undefined;

  const ap = encodeDomPath(block, mainEl);
  if (!ap) return undefined;

  return {
    ap,
    ax: clampAnchorRatio((clientX - rect.left) / rect.width),
    ay: clampAnchorRatio((clientY - rect.top) / rect.height),
  };
}

export function resolveAnchorRect(
  ap: string,
  mainEl: HTMLElement | null,
  cache?: Map<string, DOMRect | null>
): DOMRect | null {
  if (!ap || !mainEl) return null;
  if (cache && cache.has(ap)) {
    return cache.get(ap) || null;
  }
  const el = resolveDomPath(ap, mainEl);
  let rect: DOMRect | null = null;
  if (el) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      rect = r;
    }
  }
  if (cache) {
    cache.set(ap, rect);
  }
  return rect;
}

export function resolveAnchorToScreen(
  anchor: { ap?: string; ax?: number; ay?: number },
  mainEl: HTMLElement | null,
  cache?: Map<string, DOMRect | null>
): { x: number; y: number; rect: DOMRect } | null {
  if (!anchor.ap || typeof anchor.ax !== 'number' || typeof anchor.ay !== 'number') {
    return null;
  }
  const rect = resolveAnchorRect(anchor.ap, mainEl, cache);
  if (!rect) return null;
  return {
    x: rect.left + anchor.ax * rect.width,
    y: rect.top + anchor.ay * rect.height,
    rect,
  };
}

function collectTextNodes(root: HTMLElement): Text[] {
  const nodes: Text[] = [];
  if (typeof document === 'undefined') return nodes;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node.nodeValue && node.nodeValue.length > 0) {
      nodes.push(node as Text);
    }
    node = walker.nextNode();
  }
  return nodes;
}

export function captureSelectionAnchor(
  range: Range,
  selectedText: string,
  mainEl: HTMLElement | null
): SelectionAnchor | undefined {
  if (!mainEl || !mainEl.contains(range.commonAncestorContainer)) return undefined;

  const commonEl =
    range.commonAncestorContainer instanceof HTMLElement
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement;

  const block = findAnchorBlock(commonEl, mainEl, true) || commonEl;
  if (!block || !mainEl.contains(block) || block === mainEl) return undefined;

  const ap = encodeDomPath(block, mainEl);
  if (!ap) return undefined;

  const textNodes = collectTextNodes(block);
  if (textNodes.length === 0) return undefined;

  let so = -1;
  let eo = -1;
  let cursor = 0;

  for (const tn of textNodes) {
    const len = tn.nodeValue?.length || 0;
    if (tn === range.startContainer) {
      so = cursor + Math.min(len, Math.max(0, range.startOffset));
    }
    if (tn === range.endContainer) {
      eo = cursor + Math.min(len, Math.max(0, range.endOffset));
    }
    cursor += len;
  }

  // Handle element-boundary range endpoints inside the block
  if (so < 0 || eo < 0) {
    try {
      const preRange = document.createRange();
      preRange.selectNodeContents(block);
      preRange.setEnd(range.startContainer, range.startOffset);
      so = preRange.toString().length;

      const endRange = document.createRange();
      endRange.selectNodeContents(block);
      endRange.setEnd(range.endContainer, range.endOffset);
      eo = endRange.toString().length;
    } catch {
      return undefined;
    }
  }

  if (so < 0 || eo <= so) return undefined;

  return {
    ap,
    so,
    eo,
    sp: selectedText.replace(/\s+/g, ' ').trim().slice(0, MAX_SNIPPET_LEN),
  };
}

export interface ResolvedHighlightRect {
  left: number;
  docTop: number;
  w: number;
  h: number;
}

function mergeClientRects(rawRects: DOMRect[], scrollY: number): ResolvedHighlightRect[] {
  const filtered = rawRects.filter((r) => r.width >= 2 && r.height >= 2);
  if (filtered.length === 0) return [];

  const merged: Array<{ left: number; top: number; right: number; bottom: number }> = [];
  for (const r of filtered) {
    const prev = merged[merged.length - 1];
    if (
      prev &&
      Math.abs(prev.top - r.top) < 4 &&
      Math.abs(prev.bottom - r.bottom) < 6 &&
      r.left <= prev.right + 4 &&
      r.right >= prev.left - 4
    ) {
      prev.left = Math.min(prev.left, r.left);
      prev.top = Math.min(prev.top, r.top);
      prev.right = Math.max(prev.right, r.right);
      prev.bottom = Math.max(prev.bottom, r.bottom);
    } else {
      merged.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
    }
  }

  return merged.slice(0, 32).map((m) => ({
    left: Math.round(m.left * 10) / 10,
    docTop: Math.round((m.top + scrollY) * 10) / 10,
    w: Math.round((m.right - m.left) * 10) / 10,
    h: Math.round((m.bottom - m.top) * 10) / 10,
  }));
}

function buildRangeFromOffsets(textNodes: Text[], so: number, eo: number): Range | null {
  if (typeof document === 'undefined' || textNodes.length === 0 || eo <= so) return null;

  let startNode: Text | null = null;
  let startOff = 0;
  let endNode: Text | null = null;
  let endOff = 0;
  let cursor = 0;

  for (const tn of textNodes) {
    const len = tn.nodeValue?.length || 0;
    const nextCursor = cursor + len;
    if (!startNode && so <= nextCursor && so >= cursor) {
      startNode = tn;
      startOff = so - cursor;
    }
    if (!endNode && eo <= nextCursor && eo >= cursor) {
      endNode = tn;
      endOff = eo - cursor;
    }
    cursor = nextCursor;
    if (startNode && endNode) break;
  }

  if (!startNode || !endNode) return null;

  try {
    const r = document.createRange();
    r.setStart(startNode, startOff);
    r.setEnd(endNode, endOff);
    return r;
  } catch {
    return null;
  }
}

export function resolveSelectionAnchorToRects(
  anchor: SelectionAnchor | undefined,
  selText: string | undefined,
  mainEl: HTMLElement | null,
  scrollY: number
): ResolvedHighlightRect[] | null {
  if (!anchor || !mainEl) return null;
  const block = resolveDomPath(anchor.ap, mainEl);
  if (!block) return null;

  const textNodes = collectTextNodes(block);
  if (textNodes.length === 0) return null;

  const directRange = buildRangeFromOffsets(textNodes, anchor.so, anchor.eo);
  if (directRange) {
    const extracted = directRange.toString().replace(/\s+/g, ' ').trim();
    const expected = (anchor.sp || selText || '').replace(/\s+/g, ' ').trim();
    if (!expected || extracted.startsWith(expected.slice(0, 12)) || expected.startsWith(extracted.slice(0, 12))) {
      const rects = mergeClientRects(Array.from(directRange.getClientRects()), scrollY);
      if (rects.length > 0) return rects;
    }
  }

  // Fallback: locate matching substring inside the block text if offsets drifted
  const query = (selText || anchor.sp || '').replace(/\s+/g, ' ').trim();
  if (query.length >= 2) {
    const fullText = textNodes.map((n) => n.nodeValue || '').join('');
    const idx = fullText.indexOf(query);
    if (idx >= 0) {
      const matchedRange = buildRangeFromOffsets(textNodes, idx, idx + query.length);
      if (matchedRange) {
        const rects = mergeClientRects(Array.from(matchedRange.getClientRects()), scrollY);
        if (rects.length > 0) return rects;
      }
    }
  }

  return null;
}
