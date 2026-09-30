# -*- coding: utf-8 -*-
"""
Генератор паспортов байков (листы A4 для папки покупателя).

Как пользоваться:
    python3 passport.py            — собрать HTML в _source/html/
    python3 passport.py --pdf      — собрать HTML и распечатать в PDF (нужен Chrome/Chromium)

Все данные — в BIKES и L10N ниже. Меняешь данные там, запускаешь скрипт,
получаешь заново все 6 листов (RU/EN/KO × красный/синий). Руками HTML не правим.

Пути к фото и скриншотам — относительные, от папки _source/.
"""
import json, os, subprocess, sys, shutil
from urllib.parse import quote

HERE = os.path.dirname(os.path.abspath(__file__))
OUTH = HERE
OUTP = os.path.join(HERE, 'pdf')

# ─────────────────────────────────────────────────────────────── данные байков
BIKES = {
    'red': {
        'slug': '29AA-48928',
        'title': 'YAMAIKD',
        'price': '12 000 000 ₫',
        'plate': '29AA-489.28',
        'dir': '../../Байки в наличии/Красный автомат 29AA-48928/',
        'hero': 'реальные фото/5276219422102200304.jpg',
        'thumbs': ['реальные фото/5276219422102200306.jpg',
                   'реальные фото/5276219422102200310.jpg',
                   'реальные фото/5276219422102200312.jpg'],
        'shot': 'proverka-csgt.png',
        'rows_common': {
            'brand': 'YAMAIKD', 'model': '50', 'cc': '49', 'engine_no': '139FMB063929',
            'chassis_no': 'B2HYBB063929', 'first_reg': '03.08.2018',
        },
        'files': {'ru': 'Байк_Красный_29AA-48928', 'en': 'Bike_Red_29AA-48928', 'ko': '오토바이_빨강_29AA-48928'},
    },
    'blue': {
        'slug': '15AH-00893',
        'title': 'ESPERO 50C2',
        'price': '12 000 000 ₫',
        'plate': '15AH-008.93',
        'dir': '../../Байки в наличии/Синий Exciter 15AH-00893/',
        'hero': 'реальные фото /5271991220072817744.jpg',
        'thumbs': ['реальные фото /5271991220072817743.jpg',
                   'реальные фото /5271991220072817746.jpg',
                   'реальные фото /5271991220072817747.jpg'],
        'shot': 'proverka-csgt.png',
        'rows_common': {
            'brand': 'ESPERO', 'model': '50C2', 'cc': '50', 'engine_no': '39FMB2317980',
            'chassis_no': 'B3PEHA317980', 'first_reg': '~2017',
        },
        'files': {'ru': 'Байк_Синий_15AH-00893', 'en': 'Bike_Blue_15AH-00893', 'ko': '오토바이_파랑_15AH-00893'},
    },
}

# ───────────────────────────────────────────────────────── тексты по языкам
L10N = {
    'ru': {
        'doc': 'ПАСПОРТ БАЙКА', 'price': 'ЦЕНА', 'data': 'ДАННЫЕ ПО ДОКУМЕНТАМ',
        'about': 'О МОДЕЛИ', 'check': 'ПРОВЕРКА', 'maint': 'ОБСЛУЖИВАНИЕ',
        'k_brand': 'Марка (Nhãn hiệu)', 'k_model': 'Модель (Số loại)', 'k_cc': 'Объём (Dung tích)',
        'k_color': 'Цвет (Màu sơn)', 'k_plate': 'Гос-номер (Biển số)', 'k_engine': '№ двигателя',
        'k_chassis': '№ рамы', 'k_first': 'Первая регистрация', 'k_place': 'Место', 'k_type': 'Тип',
        'mileage': 'ПРОБЕГ СЕЙЧАС', 'handover': 'ДАТА ВЫДАЧИ', 'at': 'при', 'km': 'км', 'date': 'дата:',
        'check_text': 'Штрафы (phạt nguội) — по официальной базе ГАИ Вьетнама (CSGT / VNeTraffic) '
                      'по гос-номеру. Не в угоне — оригинал cà vẹt + совпадение номеров рамы и двигателя.',
        'shot_ph': 'СКРИНШОТ ПРОВЕРКИ ГАИ<br>ПО НОМЕРУ · {plate}',
        'footer': 'Честно · документы · подготовка',
        'red': {'sub': 'Автомат 49сс · для спокойной ежедневной езды', 'color': 'Đỏ (красный)',
                'place': 'Ханой', 'type': 'скутер-автомат',
                'about': '49-кубовый автоматический ретро-скутер. Марка по документам — YAMAIKD. '
                         'Год по первой регистрации — 2018.',
                'oil': 'Замена масла — <b>каждые 1000 км</b> (автомат, без передач)'},
        'blue': {'sub': 'xe số 50cc · бренд DETECH · для опытных', 'color': 'Xanh (синий)',
                 'place': 'Хайфон', 'type': 'xe số — полу-механика, 4 передачи',
                 'about': 'ESPERO — вьетнамский бренд завода DETECH Motor (с 1999, сборка Hưng Yên, Euro 3). '
                          'Модель 50C2 — xe số «Exciter-стайл» для категории 50cc без прав. '
                          'Год по первой регистрации — 2017.',
                 'oil': 'Замена масла — <b>каждые 1500 км</b> (полу-механика (xe số))'},
    },
    'en': {
        'doc': 'VEHICLE PASSPORT', 'price': 'PRICE', 'data': 'REGISTRATION DATA',
        'about': 'ABOUT THE MODEL', 'check': 'VERIFICATION', 'maint': 'MAINTENANCE',
        'k_brand': 'Brand (Nhãn hiệu)', 'k_model': 'Model (Số loại)', 'k_cc': 'Engine (Dung tích)',
        'k_color': 'Color (Màu sơn)', 'k_plate': 'Plate (Biển số)', 'k_engine': 'Engine No.',
        'k_chassis': 'Chassis No.', 'k_first': 'First registration', 'k_place': 'Registered in', 'k_type': 'Type',
        'mileage': 'MILEAGE NOW', 'handover': 'HANDOVER DATE', 'at': 'at', 'km': 'km', 'date': 'date:',
        'check_text': 'Fines (phạt nguội) — via Vietnam Traffic Police database (CSGT / VNeTraffic) by plate. '
                      'Not stolen — original cà vẹt + matching chassis & engine numbers.',
        'shot_ph': 'OFFICIAL PLATE-CHECK SCREENSHOT ·<br>{plate}',
        'footer': 'Honest · papers · prepared',
        'red': {'sub': '49cc automatic · for calm everyday riding', 'color': 'Đỏ (red)',
                'place': 'Hanoi', 'type': 'automatic scooter',
                'about': '49cc automatic retro scooter. Brand per registration — YAMAIKD. '
                         'Year by first registration — 2018.',
                'oil': 'Oil change — <b>every 1000 km</b> (automatic, no gears)'},
        'blue': {'sub': '50cc xe số · DETECH brand · for experienced riders', 'color': 'Xanh (blue)',
                 'place': 'Hai Phong', 'type': 'xe số — semi-manual, 4-speed',
                 'about': 'ESPERO is a Vietnamese brand by DETECH Motor (since 1999, assembled in Hưng Yên, '
                          'Euro 3). Model 50C2 is an "Exciter-style" xe số for the no-license 50cc class. '
                          'Year by first registration — 2017.',
                 'oil': 'Oil change — <b>every 1500 km</b> (semi-manual (xe số))'},
    },
    'ko': {
        'doc': '차량 정보', 'price': '가격', 'data': '등록증 정보',
        'about': '모델 정보', 'check': '조회', 'maint': '정비',
        'k_brand': '브랜드 (Nhãn hiệu)', 'k_model': '모델 (Số loại)', 'k_cc': '배기량 (Dung tích)',
        'k_color': '색상 (Màu sơn)', 'k_plate': '번호판 (Biển số)', 'k_engine': '엔진번호',
        'k_chassis': '차대번호', 'k_first': '최초 등록', 'k_place': '등록지', 'k_type': '종류',
        'mileage': '현재 주행거리', 'handover': '인도일', 'at': '', 'km': 'km', 'date': '날짜:',
        'check_text': '위반(phạt nguội) — 베트남 교통경찰 DB(CSGT / VNeTraffic)에서 번호판 조회. '
                      '도난 아님 — 원본 cà vẹt + 차대·엔진 번호 대조.',
        'shot_ph': '공식 번호판 조회 스크린샷 ·<br>{plate}',
        'footer': '정직 · 서류 · 정비완료',
        'red': {'sub': '49cc 오토매틱 · 편안한 일상 주행', 'color': 'Đỏ (빨강)',
                'place': '하노이', 'type': '자동 스쿠터',
                'about': '49cc 자동 레트로 스쿠터. 등록증상 브랜드 — YAMAIKD. 최초 등록 — 2018년.',
                'oil': '엔진오일 교체 — <b>1000 km마다</b> (오토매틱, 변속 없음)'},
        'blue': {'sub': '50cc xe số · DETECH · 숙련자용', 'color': 'Xanh (파랑)',
                 'place': '하이퐁', 'type': 'xe số — 반자동 4단',
                 'about': 'ESPERO는 DETECH Motor의 베트남 브랜드입니다(1999년~, Hưng Yên 조립, Euro 3). '
                          '50C2 모델은 무면허 50cc 등급용 "Exciter 스타일" xe số. 최초 등록 — 2017년.',
                 'oil': '엔진오일 교체 — <b>1500 km마다</b> (반자동(xe số))'},
    },
}

CSS = """
@page { size: A4; margin: 0; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { margin:0; padding:0; }
body { font-family: "Helvetica Neue", Helvetica, Arial, "Noto Sans CJK KR", sans-serif;
       color:#1B1B1B; background:#FBF8F5; }
.page { width:210mm; height:297mm; display:flex; flex-direction:column; background:#FBF8F5; }
.hdr { background:#141414; color:#fff; height:14.7mm; padding:0 12mm;
       display:flex; align-items:center; justify-content:space-between; }
.hdr .brand { font-weight:800; font-size:11.5pt; letter-spacing:.4pt; }
.hdr .doc { font-size:7.5pt; letter-spacing:2.2pt; color:#CDC6C0; }
.rule { height:1.4mm; background:#E8502A; }
.main { flex:1; padding:8mm 12mm 0; }
.top { display:flex; justify-content:space-between; align-items:flex-start; gap:8mm; }
h1 { margin:0; font-size:25pt; font-weight:800; letter-spacing:-.3pt; line-height:1.05; }
.sub { color:#8B817A; font-size:9pt; margin-top:2mm; }
.price { background:#E8502A; color:#fff; border-radius:3mm; padding:4mm 8mm 4.5mm;
         text-align:center; min-width:50mm; }
.price .lab { font-size:6.5pt; letter-spacing:2pt; opacity:.9; }
.price .val { font-size:17pt; font-weight:800; margin-top:1.5mm; white-space:nowrap; }
.cols { display:flex; gap:8mm; margin-top:6mm; }
.left { width:78mm; flex:none; }
.right { flex:1; min-width:0; }
.hero { width:78mm; height:86mm; object-fit:cover; border-radius:2mm; display:block; }
.thumbs { display:flex; gap:4.2mm; margin-top:3.5mm; }
.thumbs img { width:23mm; height:25mm; object-fit:cover; border-radius:1.5mm; }
h2 { color:#D6472A; font-size:8pt; letter-spacing:1.7pt; font-weight:800;
     margin:7mm 0 3mm; padding-bottom:2mm; border-bottom:.3mm solid #E9E1DB; }
.left h2 { border-bottom:none; padding-bottom:0; margin-bottom:2.5mm; }
.note { font-size:8.5pt; line-height:1.55; margin:0; color:#3A352F; }
.shot { margin-top:4mm; border-radius:2mm; overflow:hidden; }
.shot img { width:100%; display:block; border-radius:2mm; }
.shot.empty { border:.4mm dashed #D9CDC4; background:#F4ECE5; height:33mm;
              display:flex; align-items:center; justify-content:center; text-align:center;
              color:#B5A79D; font-size:7pt; letter-spacing:1pt; line-height:1.7; }
table { width:100%; border-collapse:collapse; font-size:9pt; }
td { padding:2.7mm 0; border-bottom:.25mm solid #EFE8E3; vertical-align:top; }
tr:last-child td { border-bottom:none; }
td.k { color:#8B817A; width:47%; }
td.v { font-weight:700; }
.about { border-left:1.1mm solid #E8502A; background:#fff; padding:3.5mm 4.5mm;
         font-size:8.5pt; line-height:1.6; border-radius:0 2mm 2mm 0; }
.oil { font-size:9pt; margin:0 0 3.5mm; }
.two { display:flex; gap:4mm; }
.fld { flex:1; border:.3mm solid #E9E1DB; border-radius:2mm; padding:3mm 3.5mm 3.5mm; background:#fff; }
.fld .lab { font-size:6.5pt; letter-spacing:1.5pt; color:#8B817A; }
.fld .line { border-bottom:.25mm dotted #C6BCB4; margin-top:4mm; }
.rows { margin-top:3.5mm; border:.3mm solid #E9E1DB; border-radius:2mm; background:#fff; overflow:hidden; }
.row { display:flex; align-items:center; gap:3mm; padding:2.7mm 3.5mm;
       border-bottom:.25mm solid #EFE8E3; font-size:8.5pt; }
.row:last-child { border-bottom:none; }
.cb { width:3.2mm; height:3.2mm; border:.3mm solid #C6BCB4; border-radius:.7mm; flex:none; }
.row .a { flex:1; }
.row .b { flex:1; }
.dot { display:inline-block; min-width:16mm; border-bottom:.25mm dotted #C6BCB4; }
.ftr { background:#141414; color:#CDC6C0; height:12.7mm; padding:0 12mm;
       display:flex; align-items:center; justify-content:space-between; font-size:7.5pt; }
.ftr .site { color:#fff; font-weight:700; letter-spacing:.6pt; }
"""

TPL = """<!doctype html>
<html lang="{lang}"><head><meta charset="utf-8">
<title>{title} · {plate}</title>
<style>{css}</style></head>
<body><div class="page">
  <div class="hdr"><div class="brand">BIKE50CC·NHA TRANG</div><div class="doc">{t_doc}</div></div>
  <div class="rule"></div>
  <div class="main">
    <div class="top">
      <div><h1>{title}</h1><div class="sub">{sub}</div></div>
      <div class="price"><div class="lab">{t_price}</div><div class="val">{price}</div></div>
    </div>
    <div class="cols">
      <div class="left">
        <img class="hero" src="{hero}">
        <div class="thumbs">{thumbs}</div>
        <h2>{t_check}</h2>
        <p class="note">{check_text}</p>
        {shot}
      </div>
      <div class="right">
        <h2>{t_data}</h2>
        <table>{rows}</table>
        <h2>{t_about}</h2>
        <div class="about">{about}</div>
        <h2>{t_maint}</h2>
        <p class="oil">{oil}</p>
        <div class="two">
          <div class="fld"><div class="lab">{t_mileage}</div><div class="line"></div></div>
          <div class="fld"><div class="lab">{t_handover}</div><div class="line"></div></div>
        </div>
        <div class="rows">{service_rows}</div>
      </div>
    </div>
  </div>
  <div class="ftr"><div class="site">bike50cc-nha-trang.asia</div><div>{footer}</div></div>
</div></body></html>
"""


def build(bike_key, lang):
    b = BIKES[bike_key]
    t = L10N[lang]
    s = t[bike_key]
    c = b['rows_common']

    rows = ''
    for k, v in [('k_brand', c['brand']), ('k_model', c['model']), ('k_cc', c['cc'] + ' ' + ('см³' if lang == 'ru' else 'cc')),
                 ('k_color', s['color']), ('k_plate', b['plate']), ('k_engine', c['engine_no']),
                 ('k_chassis', c['chassis_no']), ('k_first', c['first_reg']),
                 ('k_place', s['place']), ('k_type', s['type'])]:
        rows += '<tr><td class="k">%s</td><td class="v">%s</td></tr>' % (t[k], v)

    service = ''
    for _ in range(4):
        service += ('<div class="row"><div class="cb"></div><div class="a">%s <span class="dot"></span> %s</div>'
                    '<div class="b">%s <span class="dot"></span></div></div>') % (t['at'], t['km'], t['date'])

    thumbs = ''.join('<img src="%s">' % quote(b['dir'] + p) for p in b['thumbs'])

    shot_path = os.path.join(HERE, b['dir'] + b['shot'])
    if os.path.exists(shot_path):
        shot = '<div class="shot"><img src="%s"></div>' % quote(b['dir'] + b['shot'])
    else:
        shot = '<div class="shot empty">%s</div>' % t['shot_ph'].format(plate=b['plate'])

    return TPL.format(lang=lang, css=CSS, title=b['title'], plate=b['plate'], price=b['price'],
                      sub=s['sub'], hero=quote(b['dir'] + b['hero']), thumbs=thumbs, shot=shot,
                      rows=rows, about=s['about'], oil=s['oil'], service_rows=service,
                      t_doc=t['doc'], t_price=t['price'], t_data=t['data'], t_about=t['about'],
                      t_check=t['check'], t_maint=t['maint'], t_mileage=t['mileage'],
                      t_handover=t['handover'], check_text=t['check_text'], footer=t['footer'])


def chrome():
    for p in ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
              '/Applications/Chromium.app/Contents/MacOS/Chromium',
              shutil.which('chromium'), shutil.which('chromium-browser'),
              shutil.which('google-chrome'), '/opt/pw-browsers/chromium-1194/chrome-linux/chrome']:
        if p and os.path.exists(p):
            return p
    return None


if __name__ == '__main__':
    os.makedirs(OUTH, exist_ok=True)
    made = []
    for bk in BIKES:
        for lang in ('ru', 'en', 'ko'):
            name = BIKES[bk]['files'][lang] + '.html'
            path = os.path.join(OUTH, name)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(build(bk, lang))
            made.append((bk, lang, path))
            print('HTML', name)

    if '--pdf' in sys.argv:
        exe = chrome()
        if not exe:
            sys.exit('Chrome/Chromium не найден — PDF не собран. HTML готов, печатай из браузера.')
        os.makedirs(OUTP, exist_ok=True)
        for bk, lang, path in made:
            out = os.path.join(OUTP, lang.upper(), BIKES[bk]['files'][lang] + '.pdf')
            os.makedirs(os.path.dirname(out), exist_ok=True)
            subprocess.run([exe, '--headless', '--disable-gpu', '--no-sandbox',
                            '--no-pdf-header-footer', '--virtual-time-budget=8000', '--allow-file-access-from-files', '--print-to-pdf=' + out,
                            'file://' + path], check=True,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print('PDF ', out)
