function zeroPadding(num, length) {
  return ('0000000000' + num).slice(-length);
}
function minutesToTimeString(minute) {
  sign = (minute < 0 ? "-" : ""); // 7時間台の場合 -0 を表示したい.
  display_hour = zeroPadding(Math.abs(Math.trunc(minute / 60)), 2);
  display_minute = zeroPadding(Math.abs(minute % 60), 2); // 8時間を割っている場合、-を表示したくない.
  return sign + display_hour + ":" + display_minute;
};
// 下部の日々の出退勤表に「8時間を超えた労働時間」列を追加する.
function modifyTimeSheet() {
  tbody = $('#search-result .note tbody');

  var monthly_overtime_minute = 0
  // テーブルを1行ずつ回して「8時間を超えた労働時間」列を追加する.
  tbody.children().each(function() {
    var row = $(this);
    var column = row.children().last();
    var new_column = column.clone();
    var text = '';

    var date = row.children().first().text();
    switch(date) {
      case '日付': // ヘッダ.
        text = "8時間を超えた労働時間"
        break;
      case '': // 合計のはず。なんかレイアウト崩れてる.
        text = minutesToTimeString(monthly_overtime_minute);
        break;
      default:
        if (/\d{2}\/\d{2}/.test(date)) { // 毎日のデータ.
          worktime = row.children().eq(4).text(); // 労働時間.

          match = /(\d+):(\d+)/g.exec(worktime);

          // 休日は空文字なので何もなし.
          if (!match) { break; }

          departure = row.children().eq(3).text(); // 退勤時刻.
          // 当日分は確定していないので計算に含まない.
          if (departure.includes("(勤務中)")) { break; }

          [, hour, minute] = match
          minute = parseInt(minute);
          minute += parseInt(hour) * 60;
          overtime_minute = minute - 8 * 60; // 毎日8時間計算.
          monthly_overtime_minute += overtime_minute;

          text = minutesToTimeString(overtime_minute);
        }
        break;
    }

    new_column.text(text);
    new_column.appendTo(row);
  });
};

// main.
modifyTimeSheet();
