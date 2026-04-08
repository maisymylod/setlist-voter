// Paste this into Google Sheets > Extensions > Apps Script
// Then Deploy > New deployment > Web app > Anyone can access

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  var voter = data.voter;
  var girl = data.girl;
  var ranks = data.ranks;

  // Check if voter already has a row — update it
  var rows = sheet.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === voter) {
      sheet.getRange(i + 1, 2).setValue(girl);
      for (var j = 0; j < ranks.length; j++) {
        sheet.getRange(i + 1, 3 + j).setValue(ranks[j]);
      }
      sheet.getRange(i + 1, 13).setValue(new Date().toISOString());
      found = true;
      break;
    }
  }

  if (!found) {
    // Add header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Voter', 'Girl Song',
        'Rank 1', 'Rank 2', 'Rank 3', 'Rank 4', 'Rank 5',
        'Rank 6', 'Rank 7', 'Rank 8', 'Rank 9', 'Rank 10',
        'Submitted'
      ]);
    }
    var row = [voter, girl];
    for (var j = 0; j < ranks.length; j++) {
      row.push(ranks[j]);
    }
    row.push(new Date().toISOString());
    sheet.appendRow(row);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  var result = {};

  // Skip header row (index 0)
  for (var i = 1; i < rows.length; i++) {
    var voter = rows[i][0];
    if (!voter) continue;
    var girl = rows[i][1];
    var ranks = [];
    for (var j = 2; j < 12; j++) {
      ranks.push(rows[i][j]);
    }
    result[voter] = { girl: girl, ranks: ranks };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
