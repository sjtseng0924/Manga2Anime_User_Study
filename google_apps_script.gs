function doPost(e) {
  var payload = JSON.parse(e.postData.contents);
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var timestamp = payload.timestamp || new Date().toISOString();

  appendRows(spreadsheet, "part1", [
    "timestamp",
    "username",
    "anime",
    "character_identity",
    "manga_plot",
    "visual_quality",
    "overall_performance"
  ], payload.part1 || [], timestamp);

  appendRows(spreadsheet, "part2", [
    "timestamp",
    "username",
    "anime",
    "character_identity",
    "manga_plot",
    "absence_ai_hallucination",
    "visual_comfort_consistency",
    "overall_performance"
  ], payload.part2 || [], timestamp);

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function appendRows(spreadsheet, sheetName, headers, rows, timestamp) {
  var sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
  ensureHeaders(sheet, headers);

  rows.forEach(function(row) {
    sheet.appendRow(headers.map(function(header) {
      if (header === "timestamp") return timestamp;
      return row[header] || "";
    }));
  });
}

function ensureHeaders(sheet, headers) {
  var current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var hasHeaders = current.some(function(value) {
    return value !== "";
  });

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }

  var needsUpdate = headers.some(function(header, index) {
    return current[index] !== header;
  });

  if (needsUpdate) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}
