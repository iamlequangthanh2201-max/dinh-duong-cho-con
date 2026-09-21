/* Dinh dưỡng cho con — điều hướng, bộ lọc, ba cuốn sổ.
   Không gọi ra mạng. Dữ liệu nằm trong localStorage của trình duyệt này. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var qsa = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem('dd.' + k); return v ? JSON.parse(v) : d; }
      catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem('dd.' + k, JSON.stringify(v)); } catch (e) {}
      push(k, v);
    }
  };
  /* Khi trang chạy như một Artifact thì đồng bộ thêm lên server,
     để mở ở máy khác vẫn thấy. Không có thì chỉ dùng localStorage. */
  var DB = null, RELOAD = [], timers = {};
  function push(k, v) {
    if (!DB) return;
    clearTimeout(timers[k]);
    timers[k] = setTimeout(function () {
      try { DB.doc('data/' + k).set({ v: v, at: Date.now() }); } catch (e) {}
    }, 800);
  }
  /* bỏ dấu để tìm kiếm gõ không dấu vẫn ra */
  function fold(s) {
    return String(s).toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd');
  }

  /* ================= điều hướng ================= */
  var SECS = qsa('main section');
  var navOl = $('chnav'), side = $('side'), scrim = $('scrim'), burger = $('burger'),
      nowEl = $('now'), ofEl = $('of'), pager = $('pager');
  var MAP = {}, cur = null, spy = null;

  /* nhãn phân cách trong mục lục chương 02 */
  var DIVIDERS = {
    'Sáu việc của bố mẹ': 'Trước khi ăn dặm · 0–6 tháng',
    'Bốn giai đoạn': 'Trong khi ăn dặm · 6–18 tháng'
  };

  SECS.forEach(function (sec, si) {
    var picks = [];
    qsa('h3', sec).forEach(function (el, hi) {
      if (el.classList.contains('scen-g') || el.classList.contains('food-g')) return;
      var lab = el.textContent.replace(/\s+/g, ' ').trim();
      if (!lab) return;
      var id = sec.id + '--' + hi;
      el.id = id; el.classList.add('anchor');
      picks.push({ id: id, label: lab });
    });
    MAP[sec.id] = { sec: sec, idx: si, title: sec.dataset.title || sec.id, picks: picks };
  });

  navOl.innerHTML = SECS.map(function (sec, i) {
    var m = MAP[sec.id];
    var pinned = sec.id === 'nghen';
    var subs = m.picks.map(function (p) {
      var d = DIVIDERS[p.label]
        ? '<li class="divider">' + esc(DIVIDERS[p.label]) + '</li>' : '';
      return d + '<li><a href="#' + p.id + '" data-jump="' + p.id + '">' + esc(p.label) + '</a></li>';
    }).join('');
    return '<li data-sec="' + sec.id + '">' +
      '<button type="button" class="ch-btn" data-go="' + sec.id + '" aria-current="false">' +
      '<span class="n">' + (pinned ? '⚠' : pad(i)) + '</span><span>' + esc(m.title) + '</span></button>' +
      (subs && !pinned ? '<ul class="sub-list">' + subs + '</ul>' : '') + '</li>';
  }).join('');

  function watch(sec) {
    if (spy) spy.disconnect();
    var as = qsa('.anchor', sec);
    if (!as.length || !window.IntersectionObserver) return;
    spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        qsa('.sub-list a', navOl).forEach(function (l) { l.classList.remove('on'); });
        var hit = navOl.querySelector('.sub-list a[data-jump="' + e.target.id + '"]');
        if (hit) hit.classList.add('on');
      });
    }, { rootMargin: '-12% 0px -74% 0px', threshold: 0 });
    as.forEach(function (a) { spy.observe(a); });
  }

  function buildPager(i) {
    var p = SECS[i - 1], n = SECS[i + 1];
    pager.innerHTML =
      (p ? '<button class="pg" type="button" data-go="' + p.id + '"><small>Trước</small><b>' + esc(MAP[p.id].title) + '</b></button>' : '<span></span>') +
      (n ? '<button class="pg pg--next" type="button" data-go="' + n.id + '"><small>Tiếp</small><b>' + esc(MAP[n.id].title) + '</b></button>' : '<span></span>');
  }

  function show(id, anchor, push) {
    var m = MAP[id]; if (!m) return;
    if (cur !== id) {
      SECS.forEach(function (s) { s.classList.toggle('live', s.id === id); });
      qsa('li', navOl).forEach(function (li) {
        if (!li.hasAttribute('data-sec')) return;
        var on = li.getAttribute('data-sec') === id;
        li.classList.toggle('on', on);
        li.querySelector('.ch-btn').setAttribute('aria-current', on ? 'true' : 'false');
      });
      nowEl.textContent = m.title;
      ofEl.textContent = (m.idx === 0 ? '⚠' : pad(m.idx)) + ' / ' + pad(SECS.length - 1);
      buildPager(m.idx); watch(m.sec); cur = id;
    }
    if (push !== false) { try { history.replaceState(null, '', '#' + (anchor || id)); } catch (e) {} }
    var t = anchor ? document.getElementById(anchor) : null;
    if (t) {
      var off = (innerWidth < 900 ? 66 : 14);
      var y = t.getBoundingClientRect().top + scrollY - off;
      scrollTo(0, y);
    } else { scrollTo(0, 0); }
  }

  function closeSide() { side.classList.remove('open'); if (scrim) scrim.classList.remove('on'); burger.setAttribute('aria-expanded', 'false'); }

  document.addEventListener('click', function (e) {
    var go = e.target.closest('[data-go]');
    if (go) { show(go.getAttribute('data-go')); closeSide(); return; }
    var jump = e.target.closest('[data-jump]');
    if (jump) {
      e.preventDefault();
      var id = jump.getAttribute('data-jump');
      show(id.split('--')[0], id); closeSide(); return;
    }
  });
  burger.addEventListener('click', function () {
    var open = side.classList.toggle('open');
    if (scrim) scrim.classList.toggle('on', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  if ($('sidex')) $('sidex').addEventListener('click', closeSide);
  if (scrim) scrim.addEventListener('click', closeSide);

  /* ================= bộ lọc giai đoạn — chương 02 ================= */
  (function () {
    var box = $('stagebox'); if (!box) return;
    var nowEl2 = $('stage-now');
    var NAMES = { 1: '5–6 tháng · TẬP NUỐT', 2: '7–8 tháng · TẬP NHÁ',
                  3: '9–11 tháng · TẬP NHAI', 4: '12–18 tháng · ĂN CÙNG MÂM' };
    function apply(st) {
      qsa('.chip', box).forEach(function (c) {
        c.classList.toggle('on', !!st && c.getAttribute('data-stage') === String(st));
      });
      qsa('[data-stage]', document).forEach(function (el) {
        if (el.classList.contains('chip')) return;
        var s = +el.getAttribute('data-stage');
        el.hidden = !!st && s !== st && s !== st + 1;
        el.classList.toggle('now', !!st && s === st);
        el.classList.toggle('dim', !!st && s === st + 1);
      });
      nowEl2.innerHTML = st
        ? 'Đang xem: <b>' + esc(NAMES[st]) + '</b>' + (NAMES[st + 1] ? ' — và mốc kế tiếp ở dưới.' : '')
        : 'Đang xem tất cả bốn giai đoạn. Chưa chắc con ở đâu thì chọn theo <b>việc con làm được</b> — chính xác hơn theo tuổi.';
      store.set('stage', st || 0);
    }
    qsa('.chip', box).forEach(function (c) {
      c.addEventListener('click', function () {
        var s = +c.getAttribute('data-stage');
        apply(c.classList.contains('on') ? 0 : s);
      });
    });
    $('stage-all').addEventListener('click', function () { apply(0); });
    apply(store.get('stage', 0));
  })();

  /* ================= tìm kiếm kịch bản ================= */
  (function () {
    var box = $('scenbox'); if (!box) return;
    var q = $('scen-q'), count = $('scen-count');
    var items = qsa('.scen'), groups = qsa('.scen-g');
    var g = '';
    var empty = document.createElement('p');
    empty.className = 'empty'; empty.hidden = true;
    empty.textContent = 'Không có kết quả. Thử một từ ngắn hơn — “nhè”, “rau”, “bà”.';
    $('scenlist').appendChild(empty);
    function run() {
      var t = fold(q.value.trim()), n = 0;
      items.forEach(function (el) {
        var ok = (!g || el.getAttribute('data-group') === g) &&
                 (!t || fold(el.getAttribute('data-text')).indexOf(t) > -1);
        el.hidden = !ok; if (ok) n++;
        if (!ok) el.open = false;
      });
      groups.forEach(function (h) {
        var key = h.getAttribute('data-group');
        h.hidden = !items.some(function (el) {
          return !el.hidden && el.getAttribute('data-group') === key;
        });
      });
      empty.hidden = n > 0;
      count.textContent = n + '/' + items.length;
    }
    q.addEventListener('input', run);
    qsa('.chip', box).forEach(function (c) {
      c.addEventListener('click', function () {
        g = c.getAttribute('data-g') || '';
        qsa('.chip', box).forEach(function (x) { x.classList.toggle('on', x === c); });
        run();
      });
    });
    run();
  })();

  /* ================= tìm kiếm thực phẩm ================= */
  (function () {
    var box = $('foodbox'); if (!box) return;
    var q = $('food-q'), count = $('food-count');
    var items = qsa('.food'), groups = qsa('.food-g');
    var g = '', age = '';
    function run() {
      var t = fold(q.value.trim()), n = 0;
      items.forEach(function (el) {
        var okA = true;
        if (age) {
          var m = (el.getAttribute('data-from') || '').match(/(\d+)/);
          okA = m ? (+m[1] <= +age) : true;
        }
        var ok = (!g || el.getAttribute('data-group') === g) && okA &&
                 (!t || fold(el.getAttribute('data-text')).indexOf(t) > -1);
        el.hidden = !ok; if (ok) n++;
        if (!ok) el.open = false;
      });
      groups.forEach(function (h) {
        var key = h.getAttribute('data-group');
        var wrap = h.nextElementSibling;
        var any = items.some(function (el) { return !el.hidden && el.getAttribute('data-group') === key; });
        h.hidden = !any; if (wrap && wrap.classList.contains('foods')) wrap.hidden = !any;
      });
      count.textContent = n + '/' + items.length;
    }
    q.addEventListener('input', run);
    qsa('.chip', box).forEach(function (c) {
      c.addEventListener('click', function () {
        var row = c.parentNode;
        if (c.hasAttribute('data-fg')) g = c.getAttribute('data-fg');
        else age = c.getAttribute('data-fa');
        qsa('.chip', row).forEach(function (x) { x.classList.toggle('on', x === c); });
        run();
      });
    });
    run();
  })();

  /* ================= sổ họp nền — 26 câu ================= */
  var QUESTIONS = [
    ['A', 'Mỗi người tự viết, không đọc của nhau',
      'Viết xong cả năm câu rồi mới đọc cho nhau nghe. Người kia chỉ nghe — không hỏi, không phản biện, không an ủi. Đổi vai. Xong hai lượt mới bàn.', true, [
      ['A1', 'Bữa cơm nhà tôi hồi nhỏ là chỗ vui hay chỗ căng — ai ngồi cùng, ai ép ai, ăn hết bát có phải là chuyện ngoan không?'],
      ['A2', 'Tôi còn nhớ câu nói nào về chuyện ăn hoặc về cơ thể tôi — ai nói, lúc mấy tuổi, giờ nghĩ lại thấy gì?'],
      ['A3', 'Nhà tôi có dùng đồ ăn để dỗ, để thưởng, để phạt không — và tôi bây giờ còn làm thế với chính mình không?'],
      ['A4', 'Tôi sợ nhất điều gì về chuyện ăn của con — con gầy, con biếng, con béo, hay người khác nhìn vào? Nỗi sợ đó từ đâu ra?'],
      ['A5', 'Khi con từ chối ăn, phản ứng đầu tiên trong người tôi sẽ là gì — lo, giận, hay thấy bị chối bỏ? Và có điều gì về chuyện này tôi chưa từng nói với người kia?']
    ]],
    ['B', 'Đọc cho nhau, rồi chốt', '', false, [
      ['B1', 'Nghe xong, điều gì ở người kia làm tôi bất ngờ nhất? Chỗ nào hai nhà mình khác nhau rõ nhất?'],
      ['B2', 'Nhà mình có đồng ý câu chia việc không — bố mẹ quyết ăn gì, khi nào, ở đâu; con quyết ăn bao nhiêu và có ăn hay không? Và trong bảng ranh giới chương 01, có điều nào hai người chưa thật sự đồng ý?'],
      ['B3', 'Bất đồng giữa bữa thì ai quyết — và người kia góp ý vào lúc nào, bằng câu gì?']
    ]],
    ['C', 'Bữa của mẹ — hai người nói với nhau', '', false, [
      ['C1', 'Sáu tuần đầu ai nấu bữa cho mẹ — bữa trưa ngày bố đi làm thì ai lo, đặt lúc mấy giờ để không rơi vào lúc con khóc?'],
      ['C2', 'Nhà mình định kiêng những gì sau sinh — ai bảo phải kiêng, cái nào có lý do y tế thật, cái nào là lời truyền?'],
      ['C3', 'Mẹ đang thèm gì mà không dám ăn?']
    ]],
    ['D', 'Hỏi bác sĩ ở lần khám sau sinh', '', false, [
      ['D1', 'Mẹ đang cho bú cần bổ sung gì và trong bao lâu — sắt, canxi, vitamin D?'],
      ['D2', 'Có món nào mẹ thật sự phải kiêng vì tình trạng của mẹ không, hay không có món nào?']
    ]],
    ['E', 'Vitamin D — hỏi bác sĩ nhi',
      'Ghi lại đây. Đây là tờ giấy bố đưa ra khi có người trong nhà giục mua cốm ăn ngon.', false, [
      ['E1', 'Con uống vitamin D từ tuần thứ mấy, liều bao nhiêu, tới khi nào thì dừng — bú mẹ và bú công thức có khác nhau không?'],
      ['E2', 'Nhỏ vào đâu, trước hay sau bú, quên một ngày thì có bù không?'],
      ['E3', 'Dấu hiệu nào là thừa, cần dừng và gọi bác sĩ?'],
      ['E4', 'Ngoài vitamin D, tuổi này con có cần bổ sung gì khác không — nếu không thì xin bác sĩ xác nhận là không; và khi nào thì nên xét nghiệm vi chất chứ không đoán?']
    ]],
    ['F', 'Một câu với ông bà — hỏi trước khi xin',
      'Hỏi để ông bà kể trước. Người vừa được hỏi thì dễ nghe hơn người bị dặn. Rồi mới nói câu xin — đúng hai điều, một lần.', false, [
      ['F1', '“Hồi bố mẹ nuôi chúng con, chuyện ăn uống vất vả nhất là gì ạ — hồi đó cho ăn dặm từ mấy tháng, bằng món gì ạ?”'],
      ['F2', '“Bố mẹ thấy cháu bây giờ ăn thế nào là đủ ạ?”']
    ]],
    ['G', 'Luật mua sắm', '', false, [
      ['G1', 'Món này dùng được mấy tháng, mượn được của ai, và không có nó thì bữa ăn của con hỏng ở chỗ nào?'],
      ['G2', 'Tôi đang mua vì cần, hay vì vừa thấy nhà ai đó có — nếu bỏ thì tiền chuyển sang đâu?'],
      ['G3', 'Ba cột: MUA (kèm ngân sách trần) · MƯỢN (kèm tên người sẽ hỏi) · BỎ (kèm lý do, để ba tháng sau không mua lại)']
    ]],
    ['H', 'Dựng bếp và chia ca', '', false, [
      ['H1', 'Chỗ ăn cố định của con đặt ở đâu trong nhà?'],
      ['H2', 'Bữa sáng, trưa, tối — ai chịu trách nhiệm từng bữa, và ngày bố về muộn thì đổi sang ai?'],
      ['H3', 'Người không phụ trách bữa đó được làm gì, không được làm gì, và góp ý vào lúc nào trong ngày?'],
      ['H4', 'Ghi chép để ở đâu, ai ghi, hai người xem lại lúc nào cuối tuần — ghi món mới và phản ứng, không ghi gram']
    ]]
  ];

  (function () {
    var host = $('hopnen'); if (!host) return;
    var data = store.get('hopnen', {});
    var html = ['<h4>Sổ họp nền — 26 câu</h4>',
      '<p>Gõ tới đâu lưu tới đó, trong trình duyệt này. Mở lại lúc nào cũng thấy, sửa thoải mái.</p>'];
    QUESTIONS.forEach(function (g) {
      html.push('<div class="qgrp"><h5>Nhóm ' + g[0] + ' · ' + esc(g[1]) + '</h5>');
      if (g[2]) html.push('<p>' + esc(g[2]) + '</p>');
      g[4].forEach(function (q) {
        html.push('<div class="q"><label for="hn-' + q[0] + '"><span class="code">' + q[0] + '</span>' + esc(q[1]) + '</label>');
        if (g[3]) {
          html.push('<div class="two">' +
            '<div><span class="who">Bố</span><textarea id="hn-' + q[0] + '" data-k="' + q[0] + '.bo"></textarea></div>' +
            '<div><span class="who">Mẹ</span><textarea data-k="' + q[0] + '.me"></textarea></div></div>');
        } else {
          html.push('<textarea id="hn-' + q[0] + '" data-k="' + q[0] + '"></textarea>');
        }
        html.push('</div>');
      });
      html.push('</div>');
    });
    html.push('<div class="tools" style="margin-top:16px">' +
      '<button class="btn" id="hn-copy" type="button">Sao chép dạng Markdown</button>' +
      '<button class="btn btn--q" id="hn-print" type="button">In</button>' +
      '<span class="jstat" id="hn-stat"></span></div>');
    host.innerHTML = html.join('');

    RELOAD.push(function () {
      data = store.get('hopnen', {});
      qsa('textarea', host).forEach(function (t) {
        t.value = data[t.getAttribute('data-k')] || '';
      });
    });
    qsa('textarea', host).forEach(function (t) {
      var k = t.getAttribute('data-k');
      t.value = data[k] || '';
      t.addEventListener('input', function () {
        data[k] = t.value; store.set('hopnen', data);
        $('hn-stat').textContent = 'Đã lưu ' + new Date().toLocaleTimeString('vi-VN');
      });
    });
    $('hn-copy').addEventListener('click', function () {
      var out = ['# Sổ họp nền — ' + new Date().toLocaleDateString('vi-VN'), ''];
      QUESTIONS.forEach(function (g) {
        out.push('## Nhóm ' + g[0] + ' · ' + g[1], '');
        g[4].forEach(function (q) {
          out.push('**' + q[0] + '.** ' + q[1], '');
          if (g[3]) {
            out.push('- **Bố:** ' + (data[q[0] + '.bo'] || '—'));
            out.push('- **Mẹ:** ' + (data[q[0] + '.me'] || '—'), '');
          } else {
            out.push((data[q[0]] || '—'), '');
          }
        });
      });
      var txt = out.join('\n');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(txt).then(function () {
          $('hn-stat').textContent = 'Đã sao chép — dán vào repo riêng của anh.';
        });
      }
    });
    $('hn-print').addEventListener('click', function () { print(); });
  })();

  /* ================= sổ mốc ================= */
  var MOC = [
    ['Trước ăn dặm · 0–6 tháng', [
      ['Một buổi họp nền', 'hai người, một tối, chốt ba thứ lên giấy'],
      ['Bữa của mẹ đã có người lo', 'sáu tuần đầu, bố chịu trách nhiệm'],
      ['Đã hỏi bác sĩ về vitamin D', 'ghi liều vào sổ họp nền'],
      ['Đã nói một câu với ông bà', 'đúng hai điều, một lần'],
      ['Đã viết luật mua sắm ba cột', 'mua · mượn · bỏ'],
      ['Đã dựng chỗ ăn cố định và chia ca', 'ghế có chỗ tì chân']
    ]],
    ['Ăn dặm · 6–18 tháng', [
      ['Giai đoạn 1 — con nuốt gọn, không đẩy lưỡi', 'sang độ thô lợn cợn'],
      ['Giai đoạn 2 — miệng con mấp máy khi ăn', 'sang miếng mềm, bắt đầu bốc tay'],
      ['Giai đoạn 3 — con nhai thấy rõ, tự bốc được', 'sang miếng cắt, ăn cùng mâm'],
      ['Giai đoạn 4 — con ngồi hết bữa cùng mọi người', 'xong phần ăn dặm']
    ]],
    ['Việc con làm trong bếp', [
      ['1–2 tuổi — bỏ rau vào rổ, bê bát của mình', ''],
      ['3–4 tuổi — nhặt rau, vo gạo, bày bát đũa', ''],
      ['5–6 tuổi — đập trứng, đong đo, dọn bàn', ''],
      ['7–9 tuổi — dùng dao nhỏ có giám sát, nấu một món', ''],
      ['10–12 tuổi — tự làm một bữa sáng cho cả nhà, mỗi tuần một lần', 'đích của chương 03']
    ]],
    ['Một lần cho xong', [
      ['Bố đã đi học một buổi sơ cứu hóc dị vật', 'quan trọng nhất trong cả quyển'],
      ['Đã rà tủ lạnh và hộp cơm trước mùa nóng', 'luật hai giờ'],
      ['Đã cho con uống vitamin A ở trạm y tế', 'tháng 6 và tháng 12'],
      ['Đã tẩy giun định kỳ', 'từ 2 tuổi']
    ]]
  ];

  (function () {
    var host = $('moc'); if (!host) return;
    var done = store.get('moc', {});
    var total = MOC.reduce(function (n, g) { return n + g[1].length; }, 0);
    function render() {
      var n = Object.keys(done).filter(function (k) { return done[k]; }).length;
      var html = ['<h4>Sổ mốc của con</h4>',
        '<p>Mốc không phải để khen. Mốc là thứ mở thêm quyền tự quản cho con.</p>',
        '<div class="bar"><i style="width:' + Math.round(n / total * 100) + '%"></i></div>',
        '<span class="jstat">' + n + ' / ' + total + ' mốc</span>'];
      MOC.forEach(function (g, gi) {
        var c = g[1].filter(function (_, i) { return done[gi + '.' + i]; }).length;
        html.push('<details class="stage"' + (c < g[1].length ? ' open' : '') + '><summary>' +
          esc(g[0]) + '<span class="cnt">' + c + '/' + g[1].length + '</span></summary><ul class="ck">');
        g[1].forEach(function (m, i) {
          var k = gi + '.' + i;
          html.push('<li><button type="button" data-k="' + k + '" aria-pressed="' + (done[k] ? 'true' : 'false') + '">' +
            '<span class="box"></span><span><span class="t">' + esc(m[0]) + '</span>' +
            (m[1] ? '<span class="w">' + esc(m[1]) + '</span>' : '') + '</span></button></li>');
        });
        html.push('</ul></details>');
      });
      host.innerHTML = html.join('');
      qsa('button[data-k]', host).forEach(function (b) {
        b.addEventListener('click', function () {
          var k = b.getAttribute('data-k');
          done[k] = !done[k]; store.set('moc', done); render();
        });
      });
    }
    RELOAD.push(function () { done = store.get('moc', {}); render(); });
    render();
  })();

  /* ================= sổ tăng trưởng ================= */
  (function () {
    var host = $('grow'); if (!host) return;
    var log = store.get('grow', []);
    function render() {
      log.sort(function (a, b) { return a.d < b.d ? -1 : 1; });
      var html = ['<h4>Sổ tăng trưởng</h4>',
        '<p>Nhập <b>ba tháng một lần</b>, không nhập hằng tuần. Nhìn đường đi lên, không nhìn một điểm. ' +
        'Không mở sổ này trước mặt con.</p>',
        '<div class="li-row fld fld--2">' +
        '<div><label for="g-d">Ngày <span>dạng 2027-03-01</span></label><input type="text" id="g-d" placeholder="2027-03-01"></div>' +
        '<div><label for="g-w">Cân nặng · kg</label><input type="text" id="g-w" inputmode="decimal" placeholder="9.2"></div>' +
        '<div><label for="g-h">Chiều cao · cm</label><input type="text" id="g-h" inputmode="decimal" placeholder="74"></div>' +
        '<div style="align-self:end"><button class="btn" id="g-add" type="button">Ghi vào sổ</button></div></div>'];

      if (log.length) {
        html.push('<div class="gwrap"><table><thead><tr><th>Ngày</th><th>Cân · kg</th><th>Cao · cm</th><th>So với lần trước</th><th></th></tr></thead><tbody>');
        log.forEach(function (r, i) {
          var prev = log[i - 1], dw = '—';
          if (prev) {
            var d = (r.w - prev.w);
            dw = (d > 0 ? '+' : '') + d.toFixed(1) + ' kg';
          }
          html.push('<tr><td>' + esc(r.d) + '</td><td>' + r.w + '</td><td>' + (r.h || '—') + '</td><td>' + dw +
            '</td><td><button data-del="' + i + '" style="border:0;background:none;color:#B29E98;cursor:pointer">×</button></td></tr>');
        });
        html.push('</tbody></table></div>');

        /* cảnh báo: sụt cân, hoặc đi ngang quá ba tháng */
        var last = log[log.length - 1], warn = [];
        for (var i = 1; i < log.length; i++) {
          if (log[i].w < log[i - 1].w) warn.push('Có lần sụt cân: ' + log[i - 1].d + ' → ' + log[i].d + '.');
        }
        if (log.length >= 2) {
          var a = log[log.length - 2];
          var months = (new Date(last.d) - new Date(a.d)) / 2629800000;
          if (months >= 3 && Math.abs(last.w - a.w) < 0.15) {
            warn.push('Cân gần như đứng yên trong ' + months.toFixed(0) + ' tháng.');
          }
        }
        if (warn.length) {
          html.push('<div class="alert"><b>Đi khám.</b> ' + warn.join(' ') +
            ' Đây là lúc cần bác sĩ — không phải lúc con bỏ một bữa.</div>');
        }
      } else {
        html.push('<p class="jstat">Chưa có số nào. Ghi lần đầu vào sổ để bắt đầu.</p>');
      }
      html.push('<p class="jstat" style="margin-top:12px">Sổ này vẽ đường đi của chính con, ' +
        'không vẽ vạch chuẩn WHO — vạch chuẩn thì xem ở sổ tiêm chủng hoặc hỏi bác sĩ lúc khám.</p>');
      host.innerHTML = html.join('');

      $('g-add').addEventListener('click', function () {
        var d = $('g-d').value.trim(), w = parseFloat($('g-w').value), h = parseFloat($('g-h').value);
        if (!d || !(w > 0)) return;
        log.push({ d: d, w: w, h: h > 0 ? h : null });
        store.set('grow', log); render();
      });
      qsa('[data-del]', host).forEach(function (b) {
        b.addEventListener('click', function () {
          log.splice(+b.getAttribute('data-del'), 1); store.set('grow', log); render();
        });
      });
    }
    RELOAD.push(function () { log = store.get('grow', []); render(); });
    render();
  })();

  /* ================= đồng bộ server, nếu có ================= */
  (function () {
    if (!(window.claude && typeof claude.use === 'function')) return;
    claude.use('db').then(function (db) {
      if (!db) return;
      DB = db;
      var keys = ['hopnen', 'moc', 'grow'];
      Promise.all(keys.map(function (k) {
        return db.doc('data/' + k).get().then(function (d) {
          if (d && d.v !== undefined && d.v !== null) {
            try { localStorage.setItem('dd.' + k, JSON.stringify(d.v)); } catch (e) {}
            return true;
          }
        }, function () {});
      })).then(function (hits) {
        if (hits.some(Boolean)) RELOAD.forEach(function (f) { f(); });
      });
    }, function () {});
  })();

  /* ================= khởi động ================= */
  var h = (location.hash || '').replace('#', '');
  if (h && MAP[h.split('--')[0]]) show(h.split('--')[0], h.indexOf('--') > -1 ? h : null, false);
  else show(SECS[1] ? SECS[1].id : SECS[0].id, null, false);
})();
