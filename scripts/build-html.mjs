import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const documents = [
  'README.md',
  'docs/00_overview/README.md',
  'docs/01_electronics_basics/README.md',
  'docs/02_raspberry_pi_setup/README.md',
  'docs/03_adc_analog_input/README.md',
  'docs/04_sensors/README.md',
  'docs/05_motors/README.md',
  'docs/06_projects/README.md',
  'hardware/parts-list.md',
  'hardware/gpio-notes.md',
];

function slug(value) {
  return value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{Letter}\p{Number}\p{Mark}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function renderTable(lines) {
  const rows = lines
    .filter((line, index) => index !== 1)
    .map((line) => line.trim().slice(1, -1).split('|').map((cell) => inlineMarkdown(cell.trim())));
  const [head, ...body] = rows;
  return [
    '<table>',
    '<thead><tr>' + head.map((cell) => `<th>${cell}</th>`).join('') + '</tr></thead>',
    '<tbody>',
    ...body.map((row) => '<tr>' + row.map((cell) => `<td>${cell}</td>`).join('') + '</tr>'),
    '</tbody></table>',
  ].join('');
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let i = 0;
  let inCode = false;
  let codeLang = '';
  let codeLines = [];
  let listOpen = false;
  let orderedOpen = false;

  const closeList = () => {
    if (listOpen) {
      html.push('</ul>');
      listOpen = false;
    }
    if (orderedOpen) {
      html.push('</ol>');
      orderedOpen = false;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCode) {
        html.push(`<pre><code class="language-${escapeHtml(codeLang)}">${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        inCode = false;
        codeLang = '';
        codeLines = [];
      } else {
        closeList();
        inCode = true;
        codeLang = line.slice(3).trim();
      }
      i += 1;
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      i += 1;
      continue;
    }

    if (!line.trim()) {
      closeList();
      i += 1;
      continue;
    }

    if (line.trim() === '---') {
      closeList();
      html.push('<hr>');
      i += 1;
      continue;
    }

    if (/^\|.+\|$/.test(line) && i + 1 < lines.length && /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[i + 1])) {
      closeList();
      const tableLines = [];
      while (i < lines.length && /^\|.+\|$/.test(lines[i])) {
        tableLines.push(lines[i]);
        i += 1;
      }
      html.push(renderTable(tableLines));
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      closeList();
      const level = heading[1].length;
      const text = heading[2].trim();
      html.push(`<h${level} id="${slug(text)}">${inlineMarkdown(text)}</h${level}>`);
      i += 1;
      continue;
    }

    const unordered = /^\s*[-*]\s+(.+)$/.exec(line);
    if (unordered) {
      if (orderedOpen) {
        html.push('</ol>');
        orderedOpen = false;
      }
      if (!listOpen) {
        html.push('<ul>');
        listOpen = true;
      }
      html.push(`<li>${inlineMarkdown(unordered[1])}</li>`);
      i += 1;
      continue;
    }

    const ordered = /^\s*\d+\.\s+(.+)$/.exec(line);
    if (ordered) {
      if (listOpen) {
        html.push('</ul>');
        listOpen = false;
      }
      if (!orderedOpen) {
        html.push('<ol>');
        orderedOpen = true;
      }
      html.push(`<li>${inlineMarkdown(ordered[1])}</li>`);
      i += 1;
      continue;
    }

    if (line.startsWith('>')) {
      closeList();
      const quotes = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quotes.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      html.push(`<blockquote>${quotes.map(inlineMarkdown).join('<br>')}</blockquote>`);
      continue;
    }

    closeList();
    const paragraph = [line.trim()];
    while (
      i + 1 < lines.length &&
      lines[i + 1].trim() &&
      !/^(#{1,6})\s+/.test(lines[i + 1]) &&
      !/^\s*[-*]\s+/.test(lines[i + 1]) &&
      !/^\s*\d+\.\s+/.test(lines[i + 1]) &&
      !lines[i + 1].startsWith('```') &&
      !lines[i + 1].startsWith('>') &&
      !/^\|.+\|$/.test(lines[i + 1])
    ) {
      i += 1;
      paragraph.push(lines[i].trim());
    }
    html.push(`<p>${paragraph.map(inlineMarkdown).join('<br>')}</p>`);
    i += 1;
  }

  closeList();
  return html.join('\n');
}

function getTitle(markdown, fallback) {
  const found = markdown.match(/^#\s+(.+)$/m);
  return found ? found[1].trim() : fallback;
}

function getSections(markdown) {
  const sections = [...markdown.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim());
  return sections.length > 0 ? sections : [getTitle(markdown, '完了')];
}

const pages = documents.map((path, index) => {
  const markdown = readFileSync(join(root, path), 'utf8');
  const title = getTitle(markdown, path);
  return {
    id: `page-${index}`,
    title,
    path,
    sections: getSections(markdown).map((title, sectionIndex) => ({
      id: `page-${index}-section-${sectionIndex}`,
      title,
    })),
    html: markdownToHtml(markdown),
    text: markdown.replace(/```[\s\S]*?```/g, '').replace(/[^\p{Letter}\p{Number}\s]/gu, ' '),
  };
});

const output = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Raspberry Pi 5 Analog Device Tutorial</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5f7f8;
      --panel: #ffffff;
      --ink: #172026;
      --muted: #61717c;
      --line: #dce3e7;
      --green: #1e8a5a;
      --green-dark: #146c47;
      --teal: #0f6f77;
      --amber: #b06000;
      --red: #b23b3b;
      --shadow: 0 16px 36px rgba(23, 32, 38, 0.09);
    }

    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.65;
    }

    a { color: var(--teal); }
    button, input { font: inherit; }
    button { cursor: pointer; }

    .app {
      min-height: 100vh;
      display: grid;
      grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
    }

    .sidebar {
      position: sticky;
      top: 0;
      height: 100vh;
      overflow: auto;
      border-right: 1px solid var(--line);
      background: #fbfcfc;
      padding: 22px 18px;
    }

    .brand {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 20px;
    }

    .brand-mark {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      background:
        linear-gradient(135deg, rgba(30, 138, 90, 0.16), transparent 58%),
        #e7f2ed;
      border: 1px solid #c5ded2;
      display: grid;
      place-items: center;
      color: var(--green-dark);
      font-weight: 800;
    }

    .brand h1 {
      margin: 0;
      font-size: 17px;
      line-height: 1.25;
      letter-spacing: 0;
    }

    .brand p {
      margin: 2px 0 0;
      color: var(--muted);
      font-size: 12px;
    }

    .progress-card {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      padding: 14px;
      margin-bottom: 16px;
    }

    .progress-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 10px;
    }

    .progress-row strong { font-size: 24px; }
    .progress-row span { color: var(--muted); font-size: 13px; }

    .bar {
      height: 10px;
      border-radius: 999px;
      background: #e3e9ec;
      overflow: hidden;
    }

    .bar-fill {
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, var(--green), var(--teal));
      transition: width 180ms ease;
    }

    .stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 12px;
    }

    .stat {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 8px 10px;
      background: #f8fafb;
    }

    .stat b { display: block; font-size: 18px; line-height: 1.2; }
    .stat span { color: var(--muted); font-size: 12px; }

    .search {
      width: 100%;
      height: 38px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 0 12px;
      background: #fff;
      color: var(--ink);
      margin-bottom: 12px;
    }

    .nav {
      display: grid;
      gap: 6px;
      margin-bottom: 16px;
    }

    .nav button {
      width: 100%;
      border: 1px solid transparent;
      border-radius: 8px;
      background: transparent;
      color: var(--ink);
      display: grid;
      grid-template-columns: 24px 1fr auto;
      align-items: center;
      gap: 8px;
      padding: 8px;
      text-align: left;
    }

    .nav button:hover,
    .nav button.active {
      background: #eef6f2;
      border-color: #c9e2d6;
    }

    .nav-index {
      width: 24px;
      height: 24px;
      border-radius: 999px;
      background: #dfe8ec;
      color: #3b4b54;
      display: grid;
      place-items: center;
      font-size: 12px;
      font-weight: 700;
    }

    .nav-title {
      min-width: 0;
      font-size: 13px;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }

    .nav-progress {
      color: var(--muted);
      font-size: 12px;
      white-space: nowrap;
    }

    .sidebar-actions {
      display: flex;
      gap: 8px;
    }

    .ghost-button,
    .primary-button {
      min-height: 38px;
      border-radius: 8px;
      border: 1px solid var(--line);
      padding: 0 12px;
      background: #fff;
      color: var(--ink);
    }

    .primary-button {
      border-color: var(--green);
      background: var(--green);
      color: #fff;
      font-weight: 700;
    }

    .primary-button:hover { background: var(--green-dark); }
    .ghost-button:hover { border-color: #b9c7ce; background: #f8fafb; }

    main {
      min-width: 0;
      padding: 30px clamp(18px, 4vw, 56px) 56px;
    }

    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(250px, 360px);
      gap: 28px;
      align-items: stretch;
      margin-bottom: 24px;
    }

    .hero-copy h2 {
      margin: 0 0 10px;
      font-size: clamp(28px, 4vw, 46px);
      line-height: 1.12;
      letter-spacing: 0;
    }

    .hero-copy p {
      margin: 0;
      max-width: 760px;
      color: var(--muted);
      font-size: 16px;
    }

    .circuit-panel {
      min-height: 220px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background:
        radial-gradient(circle at 16px 16px, rgba(15, 111, 119, 0.28) 0 2px, transparent 3px) 0 0 / 32px 32px,
        linear-gradient(135deg, #ffffff, #edf5f2);
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow);
    }

    .trace {
      position: absolute;
      height: 3px;
      background: var(--green);
      transform-origin: left center;
      opacity: 0.9;
    }

    .trace.t1 { width: 72%; left: 14%; top: 35%; }
    .trace.t2 { width: 42%; left: 28%; top: 58%; transform: rotate(28deg); }
    .trace.t3 { width: 46%; left: 18%; top: 72%; transform: rotate(-22deg); background: var(--amber); }

    .chip {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 104px;
      height: 76px;
      transform: translate(-50%, -50%);
      border-radius: 8px;
      background: #20323a;
      box-shadow: 0 14px 26px rgba(23, 32, 38, 0.22);
      color: #e9f6f1;
      display: grid;
      place-items: center;
      font-weight: 800;
      letter-spacing: 0;
    }

    .pin {
      position: absolute;
      width: 8px;
      height: 18px;
      background: #c8d1d6;
      border-radius: 2px;
    }

    .p1 { left: calc(50% - 64px); top: calc(50% - 28px); }
    .p2 { left: calc(50% - 64px); top: calc(50% + 10px); }
    .p3 { left: calc(50% + 56px); top: calc(50% - 28px); }
    .p4 { left: calc(50% + 56px); top: calc(50% + 10px); }

    .workspace {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(250px, 340px);
      gap: 22px;
      align-items: start;
    }

    .reader,
    .tasks {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      box-shadow: var(--shadow);
    }

    .reader-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--line);
      padding: 16px 18px;
    }

    .reader-header h3 {
      margin: 0;
      font-size: 18px;
      line-height: 1.3;
    }

    .reader-header p {
      margin: 2px 0 0;
      color: var(--muted);
      font-size: 12px;
    }

    .content {
      padding: 8px 22px 24px;
    }

    .content h1,
    .content h2,
    .content h3 {
      letter-spacing: 0;
      line-height: 1.25;
    }

    .content h1 { font-size: 30px; margin: 24px 0 12px; }
    .content h2 { font-size: 22px; margin: 28px 0 10px; }
    .content h3 { font-size: 18px; margin: 20px 0 8px; }
    .content p { margin: 10px 0; }
    .content ul,
    .content ol { padding-left: 22px; }
    .content li { margin: 5px 0; }

    .content pre {
      overflow: auto;
      border-radius: 8px;
      background: #16242b;
      color: #e8f1f4;
      padding: 14px;
      line-height: 1.5;
    }

    .content code {
      border-radius: 6px;
      background: #edf2f4;
      padding: 2px 5px;
      font-family: "SFMono-Regular", Consolas, monospace;
      font-size: 0.92em;
    }

    .content pre code {
      background: transparent;
      padding: 0;
      color: inherit;
    }

    .content table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 14px;
    }

    .content th,
    .content td {
      border: 1px solid var(--line);
      padding: 8px 10px;
      vertical-align: top;
    }

    .content th {
      background: #eef3f5;
      text-align: left;
    }

    blockquote {
      margin: 14px 0;
      padding: 10px 14px;
      border-left: 4px solid var(--amber);
      background: #fff8ed;
      color: #55370d;
    }

    .tasks {
      position: sticky;
      top: 22px;
      padding: 16px;
    }

    .tasks h3 {
      margin: 0 0 4px;
      font-size: 17px;
    }

    .tasks p {
      margin: 0 0 12px;
      color: var(--muted);
      font-size: 13px;
    }

    .checklist {
      display: grid;
      gap: 8px;
    }

    .check-item {
      display: grid;
      grid-template-columns: 22px 1fr;
      gap: 8px;
      align-items: start;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 9px;
      background: #fbfcfc;
    }

    .check-item input {
      width: 18px;
      height: 18px;
      margin: 3px 0 0;
      accent-color: var(--green);
    }

    .check-item span {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .empty {
      display: none;
      border: 1px dashed var(--line);
      border-radius: 8px;
      padding: 18px;
      color: var(--muted);
      text-align: center;
      background: #fff;
    }

    .completion {
      display: inline-flex;
      align-items: center;
      min-height: 30px;
      border-radius: 999px;
      background: #eef6f2;
      color: var(--green-dark);
      padding: 0 10px;
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
    }

    .danger {
      color: var(--red);
      border-color: #e9c6c6;
    }

    @media (max-width: 960px) {
      .app { grid-template-columns: 1fr; }
      .sidebar {
        position: static;
        height: auto;
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }
      .hero,
      .workspace { grid-template-columns: 1fr; }
      .tasks { position: static; }
    }

    @media (max-width: 560px) {
      main { padding: 22px 14px 36px; }
      .reader-header { align-items: flex-start; flex-direction: column; }
      .sidebar-actions { flex-direction: column; }
      .ghost-button,
      .primary-button { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">ADC</div>
        <div>
          <h1>Raspberry Pi 5 Analog Device Tutorial</h1>
          <p>Markdown reader with progress</p>
        </div>
      </div>

      <section class="progress-card" aria-label="全体進捗">
        <div class="progress-row">
          <strong id="overallPercent">0%</strong>
          <span id="overallCount">0 / 0 sections</span>
        </div>
        <div class="bar" aria-hidden="true"><div class="bar-fill" id="overallBar"></div></div>
        <div class="stats">
          <div class="stat"><b id="donePages">0</b><span>完了した章</span></div>
          <div class="stat"><b id="remainingSections">0</b><span>残りの節</span></div>
        </div>
      </section>

      <input class="search" id="searchInput" type="search" placeholder="章や本文を検索" aria-label="章や本文を検索">
      <nav class="nav" id="nav"></nav>
      <div class="sidebar-actions">
        <button class="ghost-button" id="markAllCurrent" type="button">表示中を完了</button>
        <button class="ghost-button danger" id="resetProgress" type="button">進捗をリセット</button>
      </div>
    </aside>

    <main>
      <section class="hero">
        <div class="hero-copy">
          <h2>教材の読み進めを、その場で確認する。</h2>
          <p>README と各章の Markdown を HTML 化し、章ごとの完了状態をブラウザに保存します。</p>
        </div>
        <div class="circuit-panel" aria-hidden="true">
          <div class="trace t1"></div>
          <div class="trace t2"></div>
          <div class="trace t3"></div>
          <div class="pin p1"></div>
          <div class="pin p2"></div>
          <div class="pin p3"></div>
          <div class="pin p4"></div>
          <div class="chip">GPIO</div>
        </div>
      </section>

      <div class="workspace">
        <article class="reader">
          <header class="reader-header">
            <div>
              <h3 id="pageTitle"></h3>
              <p id="pagePath"></p>
            </div>
            <span class="completion" id="pageCompletion">0%</span>
          </header>
          <div class="content" id="content"></div>
          <div class="empty" id="emptyState">検索条件に合う章がありません。</div>
        </article>

        <aside class="tasks">
          <h3>この章の進捗</h3>
          <p>読み終えた節にチェックを入れると、左の進捗に反映されます。</p>
          <div class="checklist" id="checklist"></div>
        </aside>
      </div>
    </main>
  </div>

  <script>
    const pages = ${JSON.stringify(pages)};
    const storageKey = 'raspi-analog-progress-v1';
    let currentPageId = pages[0].id;
    let progress = loadProgress();

    const nav = document.getElementById('nav');
    const content = document.getElementById('content');
    const pageTitle = document.getElementById('pageTitle');
    const pagePath = document.getElementById('pagePath');
    const checklist = document.getElementById('checklist');
    const searchInput = document.getElementById('searchInput');
    const emptyState = document.getElementById('emptyState');

    function loadProgress() {
      try {
        return JSON.parse(localStorage.getItem(storageKey)) || {};
      } catch {
        return {};
      }
    }

    function saveProgress() {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    }

    function isDone(id) {
      return Boolean(progress[id]);
    }

    function setDone(id, value) {
      if (value) {
        progress[id] = true;
      } else {
        delete progress[id];
      }
      saveProgress();
      render();
    }

    function pageStats(page) {
      const total = page.sections.length;
      const done = page.sections.filter((section) => isDone(section.id)).length;
      return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
    }

    function allSections() {
      return pages.flatMap((page) => page.sections);
    }

    function renderOverall() {
      const sections = allSections();
      const done = sections.filter((section) => isDone(section.id)).length;
      const percent = sections.length === 0 ? 0 : Math.round((done / sections.length) * 100);
      const donePageCount = pages.filter((page) => pageStats(page).percent === 100).length;
      document.getElementById('overallPercent').textContent = percent + '%';
      document.getElementById('overallCount').textContent = done + ' / ' + sections.length + ' sections';
      document.getElementById('overallBar').style.width = percent + '%';
      document.getElementById('donePages').textContent = donePageCount;
      document.getElementById('remainingSections').textContent = sections.length - done;
    }

    function filteredPages() {
      const query = searchInput.value.trim().toLowerCase();
      if (!query) return pages;
      return pages.filter((page) => {
        const haystack = [page.title, page.path, page.text, ...page.sections.map((section) => section.title)]
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    function renderNav() {
      const visible = filteredPages();
      if (!visible.some((page) => page.id === currentPageId) && visible[0]) {
        currentPageId = visible[0].id;
      }
      nav.innerHTML = visible.map((page, index) => {
        const stats = pageStats(page);
        return '<button type="button" class="' + (page.id === currentPageId ? 'active' : '') + '" data-page="' + page.id + '">' +
          '<span class="nav-index">' + (index + 1) + '</span>' +
          '<span class="nav-title">' + page.title + '</span>' +
          '<span class="nav-progress">' + stats.done + '/' + stats.total + '</span>' +
        '</button>';
      }).join('');
      emptyState.style.display = visible.length === 0 ? 'block' : 'none';
      content.style.display = visible.length === 0 ? 'none' : 'block';
    }

    function renderPage() {
      const page = pages.find((item) => item.id === currentPageId) || pages[0];
      const stats = pageStats(page);
      pageTitle.textContent = page.title;
      pagePath.textContent = page.path;
      document.getElementById('pageCompletion').textContent = stats.percent + '% complete';
      content.innerHTML = page.html;
      checklist.innerHTML = page.sections.map((section) => {
        return '<label class="check-item">' +
          '<input type="checkbox" data-section="' + section.id + '"' + (isDone(section.id) ? ' checked' : '') + '>' +
          '<span>' + section.title + '</span>' +
        '</label>';
      }).join('');
    }

    function render() {
      renderOverall();
      renderNav();
      renderPage();
    }

    nav.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-page]');
      if (!button) return;
      currentPageId = button.dataset.page;
      render();
    });

    checklist.addEventListener('change', (event) => {
      const input = event.target.closest('input[data-section]');
      if (!input) return;
      setDone(input.dataset.section, input.checked);
    });

    searchInput.addEventListener('input', render);

    document.getElementById('markAllCurrent').addEventListener('click', () => {
      const page = pages.find((item) => item.id === currentPageId);
      if (!page) return;
      const stats = pageStats(page);
      const next = stats.percent !== 100;
      page.sections.forEach((section) => {
        if (next) {
          progress[section.id] = true;
        } else {
          delete progress[section.id];
        }
      });
      saveProgress();
      render();
    });

    document.getElementById('resetProgress').addEventListener('click', () => {
      if (!confirm('保存されている進捗をリセットしますか？')) return;
      progress = {};
      saveProgress();
      render();
    });

    render();
  </script>
</body>
</html>
`;

writeFileSync(join(root, 'index.html'), output);
console.log(`Generated ${relative(process.cwd(), join(root, 'index.html'))}`);
