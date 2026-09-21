#!/usr/bin/env python3
"""Dựng index.html từ các file .md nội dung.

Sửa nội dung ở file .md rồi chạy:  python3 build.py
"""
import base64, html, re, pathlib

HERE = pathlib.Path(__file__).parent

# ---------------------------------------------------------------- cấu hình
TITLE = "Dinh dưỡng cho con"
EMOJI = "🍚"

PINNED = dict(id="nghen", file="00-nghen.md", num="⚠", hero="cw",
              shape="sh-a", title="Nghẹn — làm ngay",
              lede="Phân biệt oẹ và nghẹn trong hai giây, rồi làm đúng thứ tự.")

CHAPTERS = [
    dict(id="nenmong", file="01-nen-mong.md", num="01", hero="c1", shape="sh-c",
         title="Nền móng",
         lede="Một nguyên tắc bao trùm, ba trụ, và bảy việc không được phép trong nhà."),
    dict(id="andam", file="02-an-dam.md", num="02", hero="c2", shape="sh-b",
         title="Ăn dặm",
         lede="Sáu việc trước khi bắt đầu, rồi bốn giai đoạn từ sáu đến mười tám tháng."),
    dict(id="banan", file="03-ban-an-hang-ngay.md", num="03", hero="c3", shape="sh-r",
         title="Bàn ăn hằng ngày",
         lede="Một tuổi trở đi. Chương 01 từ đây chạy mỗi ngày ba lần."),
    dict(id="mamcom", file="04-mam-com-khi-hau.md", num="04", hero="c4", shape="sh-q",
         title="Mâm cơm & khí hậu",
         lede="Mâm cơm nhà mình đã đúng sẵn. Việc còn lại là canh bốn vi chất và canh cái nóng."),
    dict(id="benngoai", file="05-khi-con-o-ben-ngoai.md", num="05", hero="c5", shape="sh-p",
         title="Khi con ở bên ngoài",
         lede="Nơi mọi thứ bố dựng trong nhà bị thử. Bố không ra luật được ở đây."),
    dict(id="kichban", file="06-kich-ban.md", num="06", hero="c6", shape="sh-s",
         title="30 kịch bản",
         lede="Mở lúc đang bí. Gõ vào ô tìm kiếm, không cần đọc từ đầu."),
    dict(id="thucpham", file="07-bang-thuc-pham.md", num="07", hero="c7", shape="sh-c",
         title="Bảng thực phẩm",
         lede="Năm mươi mốt món ở chợ mình, và bốn bảng tra nhanh."),
    dict(id="congcu", file="08-cong-cu-so.md", num="08", hero="c8", shape="sh-b",
         title="Công cụ & sổ",
         lede="Điền, đánh dấu, in ra. Chương cuối."),
]

# ---------------------------------------------------------------- markdown
def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    s = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'(?<!\w)\*([^*]+)\*(?!\w)', r'<em>\1</em>', s)
    s = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', s)
    s = s.replace('⚠', '<span class="warn-i">⚠</span>')
    return s

LAB_SAY = re.compile(r'^(Nói|Làm|Ví dụ|Câu nói)\b')
LAB_NO = re.compile(r'^(Đừng nói|Không|Tránh)\b')

def split_label(txt):
    m = re.match(r'\*\*(.+?):\*\*\s*(.*)$', txt)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return None, txt

def lab_class(lab):
    if not lab: return ''
    if LAB_NO.match(lab): return ' lab-no'
    if LAB_SAY.match(lab): return ' lab-say'
    return ''

def split_title(head):
    m = re.match(r'^\*\*(.+?)\*\*(?:\s*—\s*(.*))?$', head.strip())
    if m:
        return m.group(1).strip(), (m.group(2) or '').strip()
    return None, ''

ORDER = {'Ví dụ': 0, 'Câu nói': 0, 'Nói': 0, 'Làm': 1,
         'Đừng nói': 2, 'Tránh': 2, 'Hệ quả': 3, 'Vì sao': 3, 'Lưu ý': 4}

def render_list(items):
    o, li, sub = ['<ul>'], False, False
    for d, txt in items:
        if d == 0:
            if sub: o.append('</ul>'); sub = False
            if li: o.append('</li>')
            o.append('<li>' + inline(txt)); li = True
        else:
            if not li: o.append('<li>'); li = True
            if not sub: o.append('<ul class="sub">'); sub = True
            lab, _ = split_label(txt)
            cls = (lab_class(lab).strip() or 'plain')
            if txt.strip().startswith('✕'):
                cls = 'no'
            o.append('<li class="' + cls + '">' + inline(txt) + '</li>')
    if sub: o.append('</ul>')
    if li: o.append('</li>')
    o.append('</ul>')
    return ''.join(o)

def render_rows(items):
    """Hàng bung ra: tiêu đề + việc cần làm; mở ra có Ví dụ · Đừng nói · Hệ quả."""
    groups = []
    for d, txt in items:
        if d == 0:
            groups.append([txt, []])
        elif groups:
            groups[-1][1].append(txt)
    o = ['<ul class="rows">']
    for head, kids in groups:
        title, action = split_title(head)
        if title is None:
            lab, rest = split_label(head)
            if lab:
                o.append('<li class="r--flat' + lab_class(lab) + '">'
                         '<span class="lab">' + inline(lab) + '</span>'
                         '<span class="ra">' + inline(rest) + '</span></li>')
            else:
                o.append('<li class="r--flat"><span class="ra">' + inline(head) + '</span></li>')
            continue
        ra = ('<span class="ra">' + inline(action) + '</span>') if action else ''
        if not kids:
            o.append('<li class="r--flat"><span class="rt">' + inline(title) + '</span>' + ra + '</li>')
            continue
        rows = []
        for k in kids:
            kl, kr = split_label(k)
            rows.append((ORDER.get(kl, 9), kl or 'Ghi chú', kr))
        if not action:
            for idx, (_, kl, kr) in enumerate(rows):
                if kl == 'Làm':
                    action = kr
                    ra = '<span class="ra">' + inline(action) + '</span>'
                    rows.pop(idx)
                    break
        rows.sort(key=lambda x: x[0])
        o.append('<li><details class="r"><summary><span class="rt">' + inline(title) + '</span>'
                 + ra + '</summary><div class="rmore">')
        for _, kl, kr in rows:
            cls = (lab_class(kl) or '').replace('lab-', '').strip()
            o.append('<p class="' + cls + '"><b>' + inline(kl) + '</b>' + inline(kr) + '</p>')
        o.append('</div></details></li>')
    o.append('</ul>')
    return ''.join(o)

# ---------------------------------------------------------------- khối :::
def render_block(head, inner):
    parts = [x.strip() for x in head.split('|')]
    spec = parts[0].split()
    kind = spec[0]

    if kind == 'grp':
        tone = spec[1] if len(spec) > 1 else 'y'
        title = parts[1] if len(parts) > 1 else ''
        return ('<div class="grp grp--' + tone + '"><div class="grp-h">' + inline(title)
                + '</div>' + md(inner, rows=True) + '</div>')

    if kind == 'tl':
        return '<div class="tl">' + md(inner) + '</div>'

    if kind == 'stage':
        age = ' '.join(spec[1:])
        sub = parts[1] if len(parts) > 1 else ''
        stage_n = parts[2] if len(parts) > 2 else ''
        attr = ' data-stage="' + html.escape(stage_n, quote=True) + '"' if stage_n else ''
        return ('<div class="tl-i"' + attr + '><div class="tl-age"><b>' + inline(age) + '</b>'
                + ('<span>' + inline(sub) + '</span>' if sub else '')
                + '</div><div class="tl-card">' + md(inner) + '</div></div>')

    if kind == 'part':
        letter = spec[1] if len(spec) > 1 else ''
        name = parts[1] if len(parts) > 1 else ''
        age = parts[2] if len(parts) > 2 else ''
        note = parts[3] if len(parts) > 3 else ''
        return ('<div class="part" id="part-' + letter.lower() + '"><span class="part-k">Phần '
                + inline(letter) + '</span><b>' + inline(name) + '</b>'
                + ('<span class="part-age">' + inline(age) + '</span>' if age else '')
                + ('<p>' + inline(note) + '</p>' if note else '') + '</div>')

    if kind == 'tip':
        return '<p class="tip">' + md(inner).replace('<p>', '').replace('</p>', ' ') + '</p>'

    if kind == 'sos':
        return '<div class="sos">' + md(inner) + '</div>'

    if kind == 'card':
        title = parts[1] if len(parts) > 1 else ''
        return ('<div class="card">' + ('<h4>' + inline(title) + '</h4>' if title else '')
                + md(inner) + '</div>')

    if kind == 'figs':
        out = ['<div class="figs">']
        for ln in inner:
            t = ln.strip()
            if not t.startswith('- '):
                continue
            bits = [x.strip() for x in t[2:].split('|')]
            name, cap = bits[0], (bits[1] if len(bits) > 1 else '')
            f = HERE / 'img' / (name + '.png')
            if not f.exists():
                continue
            b64 = base64.b64encode(f.read_bytes()).decode('ascii')
            out.append('<figure class="fig"><img alt="" loading="lazy" '
                       'src="data:image/png;base64,' + b64 + '">'
                       '<figcaption>' + inline(cap) + '</figcaption></figure>')
        out.append('</div>')
        return ''.join(out)

    if kind == 'rows':
        return md(inner, rows=True)

    if kind == 'widget':
        return WIDGETS.get(spec[1], '')

    if kind == 'filter':
        return FILTERS.get(spec[1], '')

    return md(inner)

def md(lines, rows=False):
    out, i = [], 0
    while i < len(lines):
        ln = lines[i]
        s = ln.strip()
        if not s:
            i += 1; continue
        if s.startswith(':::') and s != ':::':
            head = s[3:].strip()
            depth, j, inner = 1, i + 1, []
            while j < len(lines):
                t = lines[j].strip()
                if t.startswith(':::') and t != ':::':
                    depth += 1
                elif t == ':::':
                    depth -= 1
                    if depth == 0: break
                inner.append(lines[j]); j += 1
            i = j + 1
            out.append(render_block(head, inner))
            continue
        if s == '---':
            out.append('<hr>'); i += 1; continue
        if s.startswith('#'):
            lvl = len(s) - len(s.lstrip('#'))
            txt = s.lstrip('#').strip()
            tag = 'h3' if lvl <= 2 else 'h4'
            out.append('<%s>%s</%s>' % (tag, inline(txt), tag)); i += 1; continue
        if s.startswith('|'):
            tbl = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                tbl.append(lines[i].strip()); i += 1
            cells = lambda r: [c.strip() for c in r.strip('|').split('|')]
            head = cells(tbl[0])
            body = [cells(r) for r in tbl[2:]]
            def cell(c):
                # nhiều ý trong một ô → gạch đầu dòng
                if '·' in c and c.count('·') >= 1 and len(c) > 60:
                    bits = [b.strip() for b in c.split('·')]
                    return '<ul class="cl">' + ''.join('<li>' + inline(b) + '</li>' for b in bits) + '</ul>'
                return inline(c)
            h = ''.join('<th>%s</th>' % inline(c) for c in head)
            b = ''.join('<tr>' + ''.join('<td>%s</td>' % cell(c) for c in r) + '</tr>' for r in body)
            extra = ' dd' if any('✅' in c for c in head) else ''
            out.append('<div class="tw%s"><table><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>' % (extra, h, b))
            continue
        if s.startswith('> '):
            q = []
            while i < len(lines) and lines[i].strip().startswith('> '):
                q.append(lines[i].strip()[2:]); i += 1
            out.append('<blockquote><p>' + '<br>'.join(inline(x) for x in q) + '</p></blockquote>')
            continue
        if s.startswith('- '):
            items = []
            while i < len(lines):
                raw = lines[i]
                st = raw.strip()
                if st.startswith('- '):
                    items.append([1 if raw.startswith('  ') else 0, st[2:]])
                    i += 1
                elif st and raw.startswith(' ') and items:
                    items[-1][1] += ' ' + st
                    i += 1
                else:
                    break
            out.append(render_rows(items) if rows else render_list(items))
            continue
        p = []
        while i < len(lines) and lines[i].strip() and not re.match(r'^\s*(#|\||>|- |---|:::)', lines[i]):
            p.append(lines[i].strip()); i += 1
        txt = ' '.join(p)
        m = re.match(r'^\*?Cơ sở:\s*(.*?)\*?$', txt)
        if m:
            out.append('<details class="src"><summary>Cơ sở</summary><p>' + inline(m.group(1)) + '</p></details>')
            continue
        out.append('<p>%s</p>' % inline(txt))
    return '\n'.join(out)

# ---------------------------------------------------------------- kịch bản
def build_scenarios(body):
    intro = re.split(r'(?m)^# Nhóm', body)[0]
    out = [md(intro.split('\n'))]
    out.append('<div class="scen-list" id="scenlist">')
    for blk in re.split(r'\n(?=# Nhóm )', body):
        m = re.match(r'# (Nhóm ([A-H])[^\n]*)', blk)
        if not m:
            continue
        gname, gkey = m.group(1), m.group(2)
        out.append('<h3 class="scen-g" data-group="%s">%s</h3>' % (gkey, inline(gname)))
        for it in re.split(r'\n(?=## )', blk)[1:]:
            lines = it.strip().split('\n')
            head = lines[0][3:].strip()
            code, title = head.split('·', 1)
            code, title = code.strip(), title.strip()
            rest = lines[1:]
            age = ''
            if rest and re.match(r'^\*[^*].*\*$', rest[0].strip()):
                age = rest[0].strip().strip('*').strip()
                rest = rest[1:]
            why = ''
            if rest and rest[-1].strip().startswith('> '):
                why = rest[-1].strip()[2:]
                why = re.sub(r'^\*\*Vì sao:\*\*\s*', '', why)
                rest = rest[:-1]
            inner = md(rest)
            txt = html.escape(strip_md(' '.join([code, title, age] + rest)).lower(), quote=True)
            out.append(
                '<details class="scen" data-group="%s" data-age="%s" data-text="%s">'
                '<summary><span class="scode">%s</span><span class="stitle">%s</span>'
                '<span class="sage">%s</span></summary>'
                '<div class="sbody">%s%s</div></details>'
                % (gkey, html.escape(age, quote=True), txt, inline(code), inline(title),
                   inline(age), inner,
                   ('<span class="why"><b>Vì sao</b>' + inline(why) + '</span>') if why else ''))
    out.append('</div>')
    return '\n'.join(out)

def strip_md(s):
    return re.sub(r'[*`>#\[\]]', ' ', s)

# ---------------------------------------------------------------- thực phẩm
FOOD_FIELDS = ['Giàu', 'Theo tuổi', 'Mùa', 'Lưu ý']

def build_foods(body):
    """07 — phần ::: foods ... ::: dựng thành thẻ lọc được."""
    out = []
    for blk in re.split(r'\n(?=# )', body):
        m = re.match(r'# (.+)', blk)
        if not m:
            out.append(md(blk.split('\n'))); continue
        gname = m.group(1).strip()
        if not gname.startswith('Nhóm '):
            out.append(md(blk.split('\n'))); continue
        label = gname[5:].strip()
        key = label.split('·')[0].strip()
        out.append('<h3 class="food-g" data-group="%s">%s</h3><div class="foods">' % (html.escape(key, quote=True), inline(label)))
        for it in re.split(r'\n(?=## )', blk)[1:]:
            lines = [x for x in it.strip().split('\n') if x.strip()]
            head = lines[0][3:].strip()
            bits = [b.strip() for b in head.split('·')]
            name = bits[0]
            frm = bits[1] if len(bits) > 1 else ''
            rows = []
            for ln in lines[1:]:
                mm = re.match(r'^-\s*\*\*(.+?)\*\*\s*—\s*(.*)$', ln.strip())
                if mm:
                    rows.append((mm.group(1).strip(), mm.group(2).strip()))
            txt = html.escape(strip_md(head + ' ' + ' '.join(v for _, v in rows)).lower(), quote=True)
            months = ''
            for k, v in rows:
                if k == 'Mùa':
                    months = v
            body_html = ''.join(
                '<p><b>%s</b>%s</p>' % (inline(k), inline(v)) for k, v in rows)
            out.append(
                '<details class="food" data-group="%s" data-from="%s" data-text="%s">'
                '<summary><span class="fname">%s</span><span class="ffrom">%s</span></summary>'
                '<div class="fbody">%s</div></details>'
                % (html.escape(key, quote=True), html.escape(frm, quote=True), txt,
                   inline(name), inline(frm), body_html))
        out.append('</div>')
    return '\n'.join(out)

# ---------------------------------------------------------------- bộ lọc
FILTERS = {}

FILTERS['stage'] = '''
<div class="searchbox" id="stagebox">
 <b class="sb-h">Con đang ở đâu?</b>
 <div class="chips"><span class="ck-l">Theo tuổi</span>
  <button type="button" class="chip" data-stage="1">5–6 tháng</button>
  <button type="button" class="chip" data-stage="2">7–8 tháng</button>
  <button type="button" class="chip" data-stage="3">9–11 tháng</button>
  <button type="button" class="chip" data-stage="4">12–18 tháng</button>
 </div>
 <div class="chips"><span class="ck-l">Theo việc</span>
  <button type="button" class="chip" data-stage="1">Mới tập nuốt</button>
  <button type="button" class="chip" data-stage="2">Nhá được đồ lợn cợn</button>
  <button type="button" class="chip" data-stage="3">Nhai được, bốc được</button>
  <button type="button" class="chip" data-stage="4">Ăn được miếng cắt</button>
 </div>
 <div class="sb-foot"><span class="hint" id="stage-now">Đang xem tất cả bốn giai đoạn.</span>
  <button type="button" class="btn btn--q" id="stage-all">Xem tất cả</button></div>
</div>'''

FILTERS['scen'] = '''
<div class="searchbox" id="scenbox">
 <div class="tools">
  <div class="search"><input type="text" id="scen-q" placeholder="Gõ tình huống…" autocomplete="off"></div>
  <span class="count" id="scen-count"></span>
 </div>
 <div class="chips"><span class="ck-l">Nhóm</span>
  <button type="button" class="chip on" data-g="">Tất cả</button>
  <button type="button" class="chip" data-g="A">A · Ở bàn ăn</button>
  <button type="button" class="chip" data-g="B">B · Món và vị</button>
  <button type="button" class="chip" data-g="C">C · Ăn vặt</button>
  <button type="button" class="chip" data-g="D">D · Ăn dặm</button>
  <button type="button" class="chip" data-g="E">E · Người lớn khác</button>
  <button type="button" class="chip" data-g="F">F · Cơ thể</button>
  <button type="button" class="chip" data-g="G">G · Ở ngoài</button>
  <button type="button" class="chip" data-g="H">H · Ốm</button>
 </div>
 <span class="hint">Gõ vài chữ là được — <b>nhè</b>, <b>cơm trắng</b>, <b>bà ép</b>, <b>gầy</b>.
  Không có dấu vẫn ra. Không thấy gì thì thử một từ ngắn hơn.</span>
</div>'''

FILTERS['food'] = '''
<div class="searchbox" id="foodbox">
 <div class="tools">
  <div class="search"><input type="text" id="food-q" placeholder="Gõ tên món…" autocomplete="off"></div>
  <span class="count" id="food-count"></span>
 </div>
 <div class="chips"><span class="ck-l">Nhóm</span>
  <button type="button" class="chip on" data-fg="">Tất cả</button>
  <button type="button" class="chip" data-fg="Đạm động vật">Đạm động vật</button>
  <button type="button" class="chip" data-fg="Đạm thực vật">Đạm thực vật</button>
  <button type="button" class="chip" data-fg="Rau">Rau</button>
  <button type="button" class="chip" data-fg="Quả">Quả</button>
  <button type="button" class="chip" data-fg="Tinh bột">Tinh bột</button>
  <button type="button" class="chip" data-fg="Sữa">Sữa</button>
 </div>
 <div class="chips"><span class="ck-l">Con ăn được</span>
  <button type="button" class="chip on" data-fa="">Mọi tuổi</button>
  <button type="button" class="chip" data-fa="6">Từ 6 tháng</button>
  <button type="button" class="chip" data-fa="7">Từ 7 tháng</button>
  <button type="button" class="chip" data-fa="9">Từ 9 tháng</button>
  <button type="button" class="chip" data-fa="12">Từ 12 tháng</button>
 </div>
</div>'''

# ---------------------------------------------------------------- widget
WIDGETS = {}
WIDGETS['form'] = ''    # nạp từ app.js lúc chạy
WIDGETS['moc'] = '<div class="card" id="moc"></div>'
WIDGETS['grow'] = '<div class="card" id="grow"></div>'
WIDGETS['hopnen'] = '<div class="card" id="hopnen"></div>'

# ---------------------------------------------------------------- dựng
def chapter_html(ch, body):
    if ch['id'] == 'kichban':
        inner = build_scenarios(body)
    elif ch['id'] == 'thucpham':
        inner = build_foods(body)
    else:
        inner = md(body.split('\n'))
    num = ('Chương ' + ch['num']) if ch['num'] not in ('⚠',) else 'Khẩn'
    return ('<section id="%s" data-title="%s">\n'
            '<header class="chero %s"><span class="cshape %s" aria-hidden="true"></span>'
            '<span class="pnum">%s</span><h2>%s</h2>'
            '<p class="lede">%s</p></header>\n%s\n</section>'
            % (ch['id'], html.escape(ch['title'], quote=True), ch['hero'], ch['shape'],
               num, inline(ch['title']), inline(ch['lede']), inner))

def read(name):
    p = HERE / name
    if not p.exists():
        return '*(chưa có nội dung)*'
    txt = p.read_text(encoding='utf-8')
    return re.sub(r'^#\s+[^\n]*\n', '', txt, count=1)

def main():
    css = (HERE / 'styles.css').read_text(encoding='utf-8')
    js = (HERE / 'app.js').read_text(encoding='utf-8')
    secs = [chapter_html(PINNED, read(PINNED['file']))]
    for ch in CHAPTERS:
        secs.append(chapter_html(ch, read(ch['file'])))
    out = f'''<title>{TITLE}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
{css}
</style>
<div class="app">
  <header class="topbar">
    <button class="burger" id="burger" type="button" aria-expanded="false" aria-controls="side"><i aria-hidden="true"></i><span>Mục lục</span></button>
    <span class="now" id="now">&nbsp;</span>
    <span class="of" id="of">&nbsp;</span>
  </header>
  <aside class="side" id="side" aria-label="Mục lục">
    <div class="side-head">
      <b><span class="bmoji" aria-hidden="true">{EMOJI}</span>{TITLE}</b>
      <button class="side-x" id="sidex" type="button" aria-label="Đóng mục lục">&times;</button>
    </div>
    <nav class="side-nav"><ol id="chnav"></ol></nav>
  </aside>
  <div class="scrim" id="scrim"></div>
  <main class="doc">
    <div class="doc-in">
{chr(10).join(secs)}
      <nav class="pager" id="pager"></nav>
      <footer>Quyển này không thay bác sĩ. Mọi dấu hiệu bất thường thì đi khám —
      các mốc “đi khám khi” nằm ở cuối chương 02, 03 và trong nhóm H của chương 06.</footer>
    </div>
  </main>
</div>
<script>
{js}
</script>'''
    (HERE / 'index.html').write_text(out, encoding='utf-8')
    print('index.html · %.1f KB' % (len(out.encode('utf-8')) / 1024))

if __name__ == '__main__':
    main()
