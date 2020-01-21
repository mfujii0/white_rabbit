function zeroPadding(num, length) {
  return ('0000000000' + num).slice(-length);
}
function minutesToTimeString(minute) {
  sign = (minute < 0 ? "-" : ""); // 7時間台の場合 -0 を表示したい.
  display_hour = zeroPadding(Math.abs(Math.trunc(minute / 60)), 2);
  display_minute = zeroPadding(Math.abs(minute % 60), 2); // 8時間を割っている場合、-を表示したくない.
  return sign + display_hour + ":" + display_minute;
};
// 12:34 型の表示を分換算する.
function stringToMinutes(time_string) {
  match = /(\d+):(\d+)/g.exec(time_string);
  [, hour, minute] = match
  minute = parseInt(minute);
  return minute + parseInt(hour) * 60;
}
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

          // 休日は空文字なので何もなし.
          if (/^\s*$/.test(worktime)) { break; }

          departure = row.children().eq(3).text(); // 退勤時刻.
          // 当日分は確定していないので計算に含まない.
          if (departure.includes("(勤務中)")) { break; }

          overtime_minute = stringToMinutes(worktime) - 8 * 60; // 毎日8時間計算.
          monthly_overtime_minute += overtime_minute;

          text = minutesToTimeString(overtime_minute);
        }
        break;
    }

    new_column.text(text);
    new_column.appendTo(row);
  });

  // 計算したものを外のテーブルで使いたい.
  return monthly_overtime_minute;
};

// 労働時間合計表に行を追加する.
function modifyWorkingTimeSheet(monthly_overtime_minute) {
  tbody = $('.infotpl table:nth-of-type(3) tbody');
  // 所定過不足計
  // diff = $('.infotpl table:nth-of-type(3) tbody tr:last-child td').text();

  // 所定労働日数
  scheduled_working_days = $('.infotpl table:first-of-type tbody tr:last-child td').text();
  scheduled_working_days = parseInt(scheduled_working_days);
  // 実働日数
  worked_days = $('.infotpl table:nth-of-type(2) tbody tr:first-child td').text();
  worked_days = parseInt(worked_days);
  // 欠勤日数
  absenced_days = $('.infotpl table:nth-of-type(2) tbody tr:last-child td').text();
  absenced_days = parseInt(absenced_days);
  // 残り実働日数
  remain_working_days = scheduled_working_days - worked_days - absenced_days
  // 月規定労働時間
  scheduled_working_minutes = $('.infotpl table:nth-of-type(3) tbody tr:nth-child(2) td').text();
  scheduled_working_minutes = stringToMinutes(scheduled_working_minutes);
  // 実労働時間
  worked_minutes = $('.infotpl table:nth-of-type(3) tbody tr:first-child td').text();
  worked_minutes = stringToMinutes(worked_minutes);

  tbody.append(
    $("<tr></tr>")
      .append($("<th></th>").text("残り実働日数"))
      .append($("<td></td>").text(remain_working_days + " 日"))
  );
  // 8時間を超えた労働時間
  tbody.append(
    $("<tr></tr>")
      .attr("tooltip", "今月の実労働時間 - 勤務日数 * 8時間") // tooltip.css で定義されてたので流用.
      .append($("<th></th>").text("8時間を超えた労働時間"))
      .append($("<td></td>").text(minutesToTimeString(monthly_overtime_minute)))
  );
  // 45時間まであと
  overtime_margin = (scheduled_working_minutes + 45 * 60) - (worked_minutes + remain_working_days * 8 * 60);
  tr = $("<tr></tr>")
    .attr("tooltip", "(月規定労働時間 + 45時間) - (実労働時間 + 残り実働日数 * 8時間)")
    .append($("<th></th>").text("毎日8時間働いた場合、45時間まであと"))
    .append($("<td></td>").text(minutesToTimeString(overtime_margin)))
  tbody.append(tr);
}

// main.
var monthly_overtime_minute = modifyTimeSheet();
modifyWorkingTimeSheet(monthly_overtime_minute);
