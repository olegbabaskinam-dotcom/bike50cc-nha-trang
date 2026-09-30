/**
 * БАЙКИ 50cc — УЧЁТ ПРОДАЖ (v5)
 * ------------------------------------------------------------------
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
    .addItem('⚙️ Настроить/обновить таблицу','setupBikeSales').addToUi();
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
