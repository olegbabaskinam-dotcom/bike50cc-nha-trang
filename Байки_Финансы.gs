/**
 * БАЙКИ 50cc — УЧЁТ ПРОДАЖ (v6)
 * ------------------------------------------------------------------
 * Новое в v6: СВЯЗЬ С БУХГАЛТЕРИЕЙ (🏍 Байки). Бухгалтерия читает список байков и пишет ТОЛЬКО:
 *   закуп → G «Закуп» и B «Дата покупки» (если пусто); продажа → L «Цена продажи» и C «Дата продажи» (если пусто).
 *   Байк узнаётся по госномеру в F «Байк». Ничего не удаляется, onEdit нет.
 *   Первый раз: меню 🏍 Байки → «🔗 Связь с бухгалтерией» (покажет токен) → Deploy → New deployment → Web app.
 * Новое в v5: после «Мойки» — K «Всего» (себестоимость, авто) → L «Цена продажи» → M «Чистая прибыль» (авто),
 *   скрытые колонки раскрываются, старые выпадашки в D убираются. Связано с «Отчётами».
 * v4: Дата покупки / Дата продажи / Дней в продаже (считается сам).
 * Старые данные (формат v3) переносятся автоматически при запуске setupBikeSales.
 *
 * УСТАНОВКА:
 *   1) Таблица → Расширения → Apps Script.
 *   2) Удали всё, вставь ВЕСЬ этот файл, Сохрани.
 *   3) Сверху выбери setupBikeSales → ▶ Run.
 *
 * Колонки «Продажи»:
 *   A №(авто) | B Дата покупки | C Дата продажи | D Дней в продаже(авто)
 *   E Контакт | F Байк | G Закуп | H Доставка | I ТО | J Мойка
 *   K Всего(авто) = G+H+I+J | L Цена продажи | M Чистая прибыль(авто) = L − K
 * ------------------------------------------------------------------
 */

var SHEET='Продажи', LIST='Байки', REP='Отчёты';
var HROW=3, DSTART=4, NROWS=500, COLS=13;
var MONEY='#,##0" ₫"';
var INK='#1B1712', ACCENT='#C8321E';
var HEADERS=['№','Дата покупки','Дата продажи','Дней в продаже','Контакт','Байк','Закуп','Доставка','ТО','Мойка','Всего','Цена продажи','Чистая прибыль'];
var BIKES=['🔴 Красный · YAMAIKD · 29AA-489.28','🔵 Синий · ESPERO 50C2 · 15AH-008.93'];
var MONTHS=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

function onOpen(){
  SpreadsheetApp.getUi().createMenu('🏍 Байки')
    .addItem('⚙️ Настроить/обновить таблицу','setupBikeSales')
    .addItem('🔗 Связь с бухгалтерией (токен)','setupBuhLink').addToUi();
}

function setupBikeSales(){
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetLocale('ru_RU');
  var sh=ss.getSheetByName(SHEET)||ss.insertSheet(SHEET);

  // ---- сохранить введённые данные (с переносом со старого формата v3) ----
  var isOld = (String(sh.getRange(HROW,3).getValue()).trim()==='Контакт'); // v3: C = Контакт
  var isV5 = (String(sh.getRange(HROW,11).getValue()).trim()==='Всего');   // новый формат: K = Всего
  var keepDates=[], keepRest=[], keepSale=[];
  var last=sh.getLastRow();
  if(last>=DSTART){
    var n=last-DSTART+1;
    if(isOld){
      var old=sh.getRange(DSTART,2,n,8).getValues(); // B..I старого формата
      for(var i=0;i<n;i++){
        keepDates.push([old[i][0],'']);                 // Дата покупки, Дата продажи(пусто)
        keepRest.push(old[i].slice(1,7));               // Контакт..Мойка (6)
        keepSale.push([old[i][7]]);                     // Продажа
      }
    }else{
      keepDates=sh.getRange(DSTART,2,n,2).getValues();  // B,C
      keepRest =sh.getRange(DSTART,5,n,6).getValues();  // E..J
      keepSale =sh.getRange(DSTART,isV5?12:11,n,1).getValues(); // цена продажи: L (v5) или K (v4)
    }
  }

  sh.clear(); sh.clearFormats();
  var mr=sh.getMaxRows(), mc=sh.getMaxColumns();
  if(mc<COLS){ sh.insertColumnsAfter(mc, COLS-mc); mc=sh.getMaxColumns(); }
  if(mr<DSTART+NROWS-1){ sh.insertRowsAfter(mr, DSTART+NROWS-1-mr); mr=sh.getMaxRows(); }
  sh.showColumns(1, mc);                               // раскрыть скрытые K, L
  sh.getRange(1,1,mr,mc).breakApart();
  sh.getRange(1,1,mr,mc).clearDataValidations();       // убрать старые выпадашки (D и др.)
  sh.setHiddenGridlines(true);

  var W=[55,105,105,105,175,250,105,105,85,85,125,125,140];
  for(var w=0;w<W.length;w++) sh.setColumnWidth(w+1,W[w]);

  sh.getRange('A1').setValue('ПРОДАЖИ БАЙКОВ 50cc').setFontSize(15).setFontWeight('bold').setFontColor(INK);
  sh.getRange('A2').setValue('Вписывай даты, расходы и цену продажи. №, «Дней в продаже», «Всего» и «Чистая прибыль» считаются сами.')
    .setFontSize(9).setFontColor('#8A7F76');

  sh.getRange(HROW,1,1,COLS).setValues([HEADERS])
    .setFontWeight('bold').setFontColor('#fff').setBackground(INK)
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  sh.setRowHeight(HROW,30);
  sh.setFrozenRows(HROW);

  // ---- восстановить данные ----
  if(keepDates.length) sh.getRange(DSTART,2,keepDates.length,2).setValues(keepDates);
  if(keepRest.length)  sh.getRange(DSTART,5,keepRest.length,6).setValues(keepRest);
  if(keepSale.length)  sh.getRange(DSTART,12,keepSale.length,1).setValues(keepSale);

  // ---- формулы: A (№), D (дней в продаже), K (всего), M (чистая прибыль) ----
  var af=[], df=[], kf=[], mf=[];
  for(var r=DSTART;r<DSTART+NROWS;r++){
    af.push(['=IF(COUNTA($B'+r+':$C'+r+';$E'+r+':$J'+r+';$L'+r+')=0;"";ROW()-'+HROW+')']);
    df.push(['=IF($B'+r+'="";"";IF($C'+r+'="";TODAY()-$B'+r+';$C'+r+'-$B'+r+'))']);
    kf.push(['=IF(COUNT($G'+r+':$J'+r+')=0;"";N($G'+r+')+N($H'+r+')+N($I'+r+')+N($J'+r+'))']);
    mf.push(['=IF($L'+r+'="";"";N($L'+r+')-N($K'+r+'))']);
  }
  sh.getRange(DSTART,1,NROWS,1).setFormulas(af);
  sh.getRange(DSTART,4,NROWS,1).setFormulas(df);
  sh.getRange(DSTART,11,NROWS,1).setFormulas(kf);
  sh.getRange(DSTART,13,NROWS,1).setFormulas(mf);

  // ---- форматы ----
  sh.getRange(DSTART,1,NROWS,1).setHorizontalAlignment('center');
  sh.getRange(DSTART,2,NROWS,2).setNumberFormat('dd.mm.yyyy');           // B,C даты
  sh.getRange(DSTART,4,NROWS,1).setNumberFormat('0').setHorizontalAlignment('center').setFontColor('#6E645B'); // D дни
  sh.getRange(DSTART,7,NROWS,7).setNumberFormat(MONEY);                  // G..M деньги
  sh.getRange(DSTART,11,NROWS,1).setFontWeight('bold').setFontColor(INK).setBackground('#F4EFEA'); // K Всего
  sh.getRange(DSTART,13,NROWS,1).setFontWeight('bold').setFontColor('#0B6B3A');                   // M прибыль
  sh.getRange(DSTART,1,NROWS,COLS).setBorder(true,true,true,true,true,true,'#EAE1D8',SpreadsheetApp.BorderStyle.SOLID);

  // ---- выпадашка «Байк» (теперь колонка F) ----
  ensureBikes_();
  sh.getRange(DSTART,6,NROWS,1).setDataValidation(bikeRule_());

  ensureReports_();
  ss.setActiveSheet(sh);
  ss.toast('Готово: Мойка → Всего → Цена продажи → Чистая прибыль. Отчёты обновлены.','🏍 Байки',6);
}

function bikeRule_(){
  var ss=SpreadsheetApp.getActiveSpreadsheet(), lst=ss.getSheetByName(LIST);
  if(lst) return SpreadsheetApp.newDataValidation().requireValueInRange(lst.getRange('A2:A1000'),true).setAllowInvalid(true).build();
  return SpreadsheetApp.newDataValidation().requireValueInList(BIKES,true).setAllowInvalid(true).build();
}

function ensureBikes_(){
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var lst=ss.getSheetByName(LIST)||ss.insertSheet(LIST);
  if(lst.getRange('A1').getValue()!=='Байк'){
    lst.getRange('A1').setValue('Байк').setFontWeight('bold').setFontColor('#fff').setBackground(INK);
    lst.setColumnWidth(1,320); lst.setFrozenRows(1); lst.setHiddenGridlines(true);
    lst.getRange('C1').setValue('← дописывай новые байки в столбец A — появятся в выпадашке «Байк»')
      .setFontColor('#8A7F76').setFontSize(9);
  }
  if(lst.getLastRow()<2) lst.getRange(2,1,BIKES.length,1).setValues(BIKES.map(function(b){return [b];}));
}

function ensureReports_(){
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var rp=ss.getSheetByName(REP)||ss.insertSheet(REP);
  rp.clear(); rp.clearFormats();
  rp.getRange(1,1,rp.getMaxRows(),rp.getMaxColumns()).breakApart();
  rp.setHiddenGridlines(true);
  rp.setColumnWidth(1,210); rp.setColumnWidth(2,150); rp.setColumnWidth(3,150); rp.setColumnWidth(4,150);

  var P="'"+SHEET+"'!";
  rp.getRange('A1').setValue('ОТЧЁТЫ · БАЙКИ 50cc').setFontSize(15).setFontWeight('bold').setFontColor(INK);

  rp.getRange('A3').setValue('ИТОГО').setFontWeight('bold').setFontColor(ACCENT).setFontSize(11);
  var kpi=[
    ['Продано байков','=COUNT('+P+'L'+DSTART+':L1000)','0'],
    ['Сумма продаж','=SUM('+P+'L'+DSTART+':L1000)',MONEY],
    ['Всего вложено (все байки)','=SUM('+P+'K'+DSTART+':K1000)',MONEY],
    ['Чистая прибыль','=SUM('+P+'M'+DSTART+':M1000)',MONEY],
    ['Средний чек (продажа)','=IFERROR(B5/B4;0)',MONEY],
    ['Средняя прибыль с байка','=IFERROR(B7/B4;0)',MONEY],
    ['Средняя маржа','=IFERROR(B7/B5;0)','0.0%'],
    ['Себестоимость 1 проданного','=IFERROR((B5-B7)/B4;0)',MONEY],
    ['Средний срок продажи, дней','=IFERROR(AVERAGEIFS('+P+'D'+DSTART+':D1000;'+P+'C'+DSTART+':C1000;"<>");0)','0.0']
  ];
  for(var a=0;a<kpi.length;a++){
    var row=4+a;
    rp.getRange(row,1).setValue(kpi[a][0]).setFontColor('#6E645B');
    rp.getRange(row,2).setFormula(kpi[a][1]).setNumberFormat(kpi[a][2]).setFontWeight('bold').setFontColor(INK);
  }
  rp.getRange(4,1,kpi.length,2).setBorder(true,true,true,true,true,true,'#EAE1D8',SpreadsheetApp.BorderStyle.SOLID);

  // ПО МЕСЯЦАМ — по ДАТЕ ПРОДАЖИ (колонка C)
  var base=4+kpi.length+2;
  rp.getRange(base-1,1).setValue('ПО МЕСЯЦАМ (по дате продажи)').setFontWeight('bold').setFontColor(ACCENT).setFontSize(11);
  rp.getRange(base,1,1,4).setValues([['Месяц','Продано','Сумма продаж','Чистая прибыль']])
    .setFontWeight('bold').setFontColor('#fff').setBackground(INK).setHorizontalAlignment('center');
  var now=new Date(), yy=now.getFullYear(), mm=now.getMonth();
  for(var k=0;k<6;k++){
    var y=yy, m=mm+k; while(m>11){m-=12;y++;}
    var ny=y, nm=m+1; if(nm>11){nm=0;ny++;}
    var s='DATE('+y+';'+(m+1)+';1)', e='DATE('+ny+';'+(nm+1)+';1)';
    var rr=base+1+k;
    var cC=P+'C'+DSTART+':C1000';
    rp.getRange(rr,1).setValue(MONTHS[m]+' '+y);
    rp.getRange(rr,2).setFormula('=COUNTIFS('+cC+';">="&'+s+';'+cC+';"<"&'+e+')').setNumberFormat('0').setHorizontalAlignment('center');
    rp.getRange(rr,3).setFormula('=SUMIFS('+P+'L'+DSTART+':L1000;'+cC+';">="&'+s+';'+cC+';"<"&'+e+')').setNumberFormat(MONEY);
    rp.getRange(rr,4).setFormula('=SUMIFS('+P+'M'+DSTART+':M1000;'+cC+';">="&'+s+';'+cC+';"<"&'+e+')').setNumberFormat(MONEY).setFontWeight('bold').setFontColor('#0B6B3A');
    rp.getRange(rr,1,1,4).setBorder(true,true,true,true,true,true,'#EAE1D8',SpreadsheetApp.BorderStyle.SOLID);
  }
}

// ================== 🔗 СВЯЗЬ С БУХГАЛТЕРИЕЙ (v6) ==================
// Веб-вход для бухгалтерии (Cloudflare Worker buhproxy). Защита — секретный токен в свойствах скрипта (в коде его НЕТ).
// Бухгалтерия: GET ?token=… → список байков; POST {token,action,…} → записать закуп/продажу в строку байка.
// Пишем ТОЛЬКО в пустые ячейки G/B (закуп) и L/C (продажа). Отмена в бухгалтерии очищает только то, что бухгалтерия сама записала.

function setupBuhLink(){
  var p=PropertiesService.getScriptProperties();
  var t=p.getProperty('BUH_TOKEN');
  if(!t){ t='bk_'+Utilities.getUuid().replace(/-/g,''); p.setProperty('BUH_TOKEN',t); }
  Logger.log(t);
  SpreadsheetApp.getUi().alert('🔗 Токен для бухгалтерии',
    'Скопируй и вставь в Cloudflare → buhproxy → Settings → Variables → BIKE_TOKEN:\n\n'+t+
    '\n\nДальше: Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone) → скопируй ссылку /exec в BIKE_SYNC_URL.',
    SpreadsheetApp.getUi().ButtonSet.OK);
}
function buhOut_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function buhTokOk_(t){ var s=PropertiesService.getScriptProperties().getProperty('BUH_TOKEN'); return !!s && String(t||'')===s; }
function buhNum_(v){ if(typeof v==='number') return v; var s=String(v==null?'':v).replace(/[^\d.,-]/g,'').replace(',','.'); var n=parseFloat(s); return isNaN(n)?0:n; }
// Ключ байка = госномер из «Байк» (29AA-489.28 → 29AA48928). Нет номера — само название.
function bikeKey_(name){
  var s=String(name||'').toUpperCase();
  var m=s.match(/\d{2}\s*[A-Z]{1,2}\d?\s*-?\s*\d{3}\.?\d{2}/);
  return m ? m[0].replace(/[\s.\-]/g,'') : s.replace(/\s+/g,' ').trim();
}
function bikeRows_(){
  var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET); if(!sh) return [];
  var last=sh.getLastRow(); if(last<DSTART) return [];
  var n=last-DSTART+1;
  var v=sh.getRange(DSTART,1,n,COLS).getValues(), d=sh.getRange(DSTART,1,n,COLS).getDisplayValues();
  var out=[], seen={};
  for(var i=0;i<n;i++){
    var name=String(v[i][5]||'').trim(); if(!name) continue;
    var k=bikeKey_(name); seen[k]=(seen[k]||0)+1; if(seen[k]>1) k=k+'#'+seen[k];
    out.push({row:DSTART+i, key:k, name:name, buyDate:d[i][1], saleDate:d[i][2], days:(v[i][3]===''?null:buhNum_(v[i][3])), contact:d[i][4],
      buy:buhNum_(v[i][6]), deliv:buhNum_(v[i][7]), to:buhNum_(v[i][8]), wash:buhNum_(v[i][9]),
      total:buhNum_(v[i][10]), sale:buhNum_(v[i][11]), profit:(v[i][12]===''?null:buhNum_(v[i][12]))});
  }
  return out;
}
function doGet(e){
  if(!buhTokOk_(e&&e.parameter&&e.parameter.token)) return buhOut_({ok:false,error:'token'});
  return buhOut_({ok:true, bikes:bikeRows_()});
}
function buhDate_(ymd){ var m=String(ymd||'').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m? new Date(+m[1],+m[2]-1,+m[3]) : new Date(); }
function doPost(e){
  var b={}; try{ b=JSON.parse(e.postData.contents); }catch(x){ return buhOut_({ok:false,error:'bad json'}); }
  if(!buhTokOk_(b.token)) return buhOut_({ok:false,error:'token'});
  var lock=LockService.getScriptLock(); lock.waitLock(20000);
  try{
    var bike=null; bikeRows_().forEach(function(x){ if(x.key===b.key) bike=x; });
    if(!bike) return buhOut_({ok:false,error:'Байк не найден в таблице'});
    var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET), r=bike.row, amt=Math.round(buhNum_(b.amount));
    // колонки: B=2 дата покупки, C=3 дата продажи, G=7 закуп, L=12 цена продажи
    var AC = (b.action==='setBuy'||b.action==='clearBuy') ? {money:7, date:2, cur:bike.buy, label:'закуп'} : {money:12, date:3, cur:bike.sale, label:'цена продажи'};
    var res={ok:true, wroteMoney:false, wroteDate:false};
    if(b.action==='setBuy' || b.action==='setSale'){
      if(AC.cur>0 && Math.round(AC.cur)!==amt && b.action==='setSale') return buhOut_({ok:false,error:'В таблице уже стоит цена продажи '+bike.sale});
      if(String(sh.getRange(r,AC.money).getValue())===''){ sh.getRange(r,AC.money).setValue(amt); res.wroteMoney=true; }
      if(String(sh.getRange(r,AC.date).getValue())===''){ sh.getRange(r,AC.date).setValue(buhDate_(b.date)); res.wroteDate=true; }
    } else if(b.action==='clearBuy' || b.action==='clearSale'){
      if(b.wroteMoney && Math.round(buhNum_(sh.getRange(r,AC.money).getValue()))===amt){ sh.getRange(r,AC.money).clearContent(); res.wroteMoney=true; }
      if(b.wroteDate){ sh.getRange(r,AC.date).clearContent(); res.wroteDate=true; }
    } else return buhOut_({ok:false,error:'unknown action'});
    SpreadsheetApp.flush();
    bikeRows_().forEach(function(x){ if(x.key===b.key) res.bike=x; });
    return buhOut_(res);
  } finally { lock.releaseLock(); }
}
