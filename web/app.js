(function () {
  'use strict';
  var DATA = window.CMDDATA || {};
  var names = Object.keys(DATA).sort(function (a, b) { return a.localeCompare(b); });

  var $list = document.getElementById('cmd-list');
  var $search = document.getElementById('search');
  var $empty = document.getElementById('empty');
  var $clear = document.getElementById('clear-btn');
  var $count = document.getElementById('cmd-count');
  var $listPage = document.getElementById('list-page');
  var $detailPage = document.getElementById('detail-page');
  var $detailTitle = document.getElementById('detail-title');
  var $detailBody = document.getElementById('detail-body');

  $count.textContent = names.length + ' 个命令';

  marked.setOptions({ gfm: true, breaks: false });

  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escAttr(s) {
    return escHtml(s).replace(/"/g, '&quot;');
  }
  function highlight(text, q) {
    if (!q) return escHtml(text);
    var idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return escHtml(text);
    return escHtml(text.slice(0, idx)) + '<mark>' + escHtml(text.slice(idx, idx + q.length)) + '</mark>' + escHtml(text.slice(idx + q.length));
  }

  var frag = document.createDocumentFragment();
  var LI_COUNT = names.length;
  var lis = new Array(LI_COUNT);
  for (var i = 0; i < LI_COUNT; i++) {
    var n = names[i];
    var li = document.createElement('li');
    li.setAttribute('data-name', n);
    li.innerHTML = '<div class="cmd-name">' + escHtml(n) + '</div><div class="cmd-desc">' + escHtml(DATA[n].d) + '</div>';
    frag.appendChild(li);
    lis[i] = li;
  }
  $list.appendChild(frag);

  $list.addEventListener('click', function (e) {
    var li = e.target.closest('li');
    if (li && li.hasAttribute('data-name')) openDetail(li.getAttribute('data-name'));
  });

  var currentQuery = '';
  function applyFilter() {
    var q = currentQuery.trim().toLowerCase();
    var shown = 0;
    for (var i = 0; i < LI_COUNT; i++) {
      var n = names[i];
      var item = DATA[n];
      var hit = !q || n.toLowerCase().indexOf(q) >= 0 || item.d.toLowerCase().indexOf(q) >= 0;
      lis[i].hidden = !hit;
      if (hit) {
        shown++;
        var nameEl = lis[i].firstChild, descEl = lis[i].lastChild;
        nameEl.innerHTML = highlight(n, q);
        descEl.innerHTML = highlight(item.d, q);
      }
    }
    $empty.hidden = shown > 0;
    $count.textContent = q ? '匹配 ' + shown + ' 个' : names.length + ' 个命令';
  }

  var t = null;
  $search.addEventListener('input', function () {
    $clear.style.display = $search.value ? 'block' : 'none';
    clearTimeout(t);
    t = setTimeout(function () { currentQuery = $search.value; applyFilter(); }, 120);
  });
  $search.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { $search.blur(); }
  });
  $clear.addEventListener('click', function () {
    $search.value = ''; currentQuery = '';
    $clear.style.display = 'none';
    applyFilter(); $search.focus();
  });
  window.resetSearch = function () {
    $search.value = ''; currentQuery = '';
    $clear.style.display = 'none';
    applyFilter();
  };
  document.getElementById('tips').addEventListener('click', function (e) {
    var chip = e.target.closest('.tip-chip');
    if (!chip) return;
    $search.value = chip.getAttribute('data-q');
    currentQuery = $search.value;
    $clear.style.display = 'block';
    applyFilter();
  });

  function openDetail(name) {
    var item = DATA[name];
    if (!item) return;
    $detailTitle.textContent = name;
    var html = marked.parse(item.md);
    // 站外链接在离线包内不可用，改为只显示文字
    html = html.replace(/<a\s[^>]*href="(https?:)?\/\/[^"]*"[^>]*>/gi, '<a href="javascript:void(0)" style="pointer-events:none">');
    $detailBody.innerHTML = html;
    $detailPage.hidden = false;
    $detailPage.scrollTop = 0;
    try { history.pushState({ cmd: name }, '', '#' + encodeURIComponent(name)); } catch (err) {}
    document.title = name + ' - Linux 命令';
  }
  function closeDetail() {
    $detailPage.hidden = true;
    document.title = 'Linux 命令大全';
    try { history.pushState({}, '', location.pathname); } catch (err) {}
  }
  document.getElementById('back-btn').addEventListener('click', closeDetail);
  window.addEventListener('popstate', function () {
    $detailPage.hidden = true;
    document.title = 'Linux 命令大全';
  });

  // 支持 index.html#ls 直接打开某命令
  var hash = decodeURIComponent((location.hash || '').slice(1));
  if (hash && DATA[hash]) openDetail(hash);
})();
