// Manga2Animate user study backend (Google Apps Script web app).
//
// GET  ?action=assign&n=10&pid=<participant>   -> { assignment_id, trials: [{case, a, b}] }
// GET  ?action=stats                            -> per-cell / per-case / per-pair answer counts
// POST { type: "trial" | "final", rows: [...] } -> upserts one row per (participant_id, trial_index)
//
// Sheets (created on first use):
//   responses    one row per answered trial (winner method code per criterion)
//   assignments  one row per handed-out assignment, used to avoid giving the same cells to
//                participants who are answering at the same time
//
// Keep METHODS / CASES / the shared sampler block identical to index.js.

// Results go to this Google Sheet (works whether or not the script is bound to it).
var SPREADSHEET_ID = "1W9q-TqZeZf4pcF-QyC_WcSM2PnGF8LQa6E9UY67s3EI";

var METHODS = ["ours", "animaker", "vimax", "storymem", "mangadirect"];
var CASES = [
  "elf2", "elf3", "goblin", "mado", "dualjustice1", "lovehina", "kick", "dualjustice2",
  "burari", "lovehina_vol01", "paradon", "rent_a_girlfriend", "baseball", "tadaima",
  "slap_shot_girls", "lovehina_vol14", "hisoka_returns", "hakura_refrain", "aoni_rakurai", "iseoji"
];
var CRITERIA = ["fidelity", "story", "coherence", "aesthetics", "overall"];

// An assignment that has not been answered counts as "in progress" for this long.
var PENDING_TTL_MINUTES = 60;
var MAX_TRIALS = 20; // no case repeats within one participant

var RESPONSE_HEADERS = [
  "key", "received_at", "participant_id", "username", "lang", "study_version",
  "assignment_id", "assignment_source", "trial_index", "num_trials", "case", "video_a", "video_b"
].concat(CRITERIA).concat(["seconds_on_trial", "final"]);
var ASSIGNMENT_HEADERS = ["assignment_id", "created_at", "participant_id", "study_version", "trials_json"];

/* ------------------------------------------------------------------ entry points */

function doGet(e) {
  var params = (e && e.parameter) || {};
  var action = params.action || "stats";
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (action === "assign") {
      var n = Math.max(1, Math.min(MAX_TRIALS, parseInt(params.n, 10) || 20));
      return json_(assign_(n, params.pid || "", params.version || ""));
    }
    if (action === "stats") {
      return json_(stats_());
    }
    return json_({ error: "unknown action" });
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  var payload = JSON.parse(e.postData.contents);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = sheet_("responses", RESPONSE_HEADERS);
    var keyCol = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), 1).getValues();
    var rowOfKey = {};
    for (var i = 1; i < keyCol.length; i++) rowOfKey[keyCol[i][0]] = i + 1;

    var now = new Date().toISOString();
    var isFinal = payload.type === "final";
    (payload.rows || []).forEach(function (row) {
      if (!row.participant_id || !row.trial_index) return;
      var complete = CRITERIA.every(function (c) { return row[c]; });
      if (!complete) return;
      var key = row.participant_id + "#" + row.trial_index;
      var values = RESPONSE_HEADERS.map(function (h) {
        if (h === "key") return key;
        if (h === "received_at") return now;
        if (h === "final") return isFinal ? "yes" : "";
        return row[h] === undefined ? "" : row[h];
      });
      if (rowOfKey[key]) {
        sheet.getRange(rowOfKey[key], 1, 1, values.length).setValues([values]);
      } else {
        sheet.appendRow(values);
        rowOfKey[key] = sheet.getLastRow();
      }
    });
    return json_({ status: "ok" });
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------------ assignment */

function assign_(n, pid, version) {
  var counts = currentCounts_(true);
  var trials = sampleTrials_(n, counts);
  var id = Utilities.getUuid();
  sheet_("assignments", ASSIGNMENT_HEADERS).appendRow([
    id, new Date().toISOString(), pid, version, JSON.stringify(trials)
  ]);
  return { assignment_id: id, trials: trials };
}

// counts[cellKey] = answered trials + trials handed out recently and not answered yet.
function currentCounts_(includePending) {
  var counts = {};
  var answered = {};
  var responses = sheet_("responses", RESPONSE_HEADERS);
  var data = responses.getDataRange().getValues();
  var col = indexOf_(data[0]);
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[col.case]) continue;
    add_(counts, cellKey_(r[col.case], r[col.video_a], r[col.video_b]), 1);
    answered[r[col.assignment_id] + "#" + r[col.trial_index]] = true;
  }
  if (!includePending) return counts;

  var cutoff = Date.now() - PENDING_TTL_MINUTES * 60 * 1000;
  var assignments = sheet_("assignments", ASSIGNMENT_HEADERS).getDataRange().getValues();
  for (var j = assignments.length - 1; j >= 1; j--) {
    var created = new Date(assignments[j][1]).getTime();
    if (!(created >= cutoff)) break; // rows are appended in time order
    var trials = JSON.parse(assignments[j][4] || "[]");
    for (var k = 0; k < trials.length; k++) {
      if (answered[assignments[j][0] + "#" + (k + 1)]) continue;
      add_(counts, cellKey_(trials[k]["case"], trials[k].a, trials[k].b), 1);
    }
  }
  return counts;
}

// ---- shared sampler (ES5; identical copy in index.js and google_apps_script.gs) ----
// counts: { "<case>|<m1>|<m2>": n } with m1 < m2 (answered + pending). Returns n trials {case, a, b}.
// Each method pair is used floor(n/P) or ceil(n/P) times (extra uses go to the least-filled pairs),
// no case repeats (n <= number of cases), and the case <-> pair-slot matching minimises the summed
// counts exactly (Hungarian algorithm), so the least-filled cells are always served first.
function sampleAssignment(n, counts, cases, methods) {
  var sorted = methods.slice().sort(), pairs = [], i, j;
  for (i = 0; i < sorted.length; i++) for (j = i + 1; j < sorted.length; j++) pairs.push([sorted[i], sorted[j]]);
  n = Math.max(1, Math.min(n, cases.length));
  function cnt(c, p) { return counts[c + "|" + p[0] + "|" + p[1]] || 0; }
  var pairOrder = pairs.map(function (p) {
    var s = 0; cases.forEach(function (c) { s += cnt(c, p); }); return { p: p, s: s + Math.random() * 1e-3 };
  }).sort(function (x, y) { return x.s - y.s; });
  var slots = [];
  for (i = 0; i < n; i++) slots.push(pairOrder[i % pairs.length].p);
  // square cost matrix: rows = cases, columns = pair slots + zero-cost dummies for unused cases
  var size = cases.length, cost = [];
  for (i = 0; i < size; i++) {
    cost.push([]);
    for (j = 0; j < size; j++) cost[i].push(j < n ? cnt(cases[i], slots[j]) + Math.random() * 1e-3 : 0);
  }
  var match = hungarian(cost), picked = [];
  for (i = 0; i < size; i++) {
    if (match[i] >= n) continue;
    var p = slots[match[i]], flip = Math.random() < 0.5;
    picked.push({ "case": cases[i], a: flip ? p[1] : p[0], b: flip ? p[0] : p[1] });
  }
  for (i = picked.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    var tmp = picked[i]; picked[i] = picked[j]; picked[j] = tmp;
  }
  return picked;
}

// Min-cost perfect matching on a square matrix; returns column index per row.
function hungarian(a) {
  var n = a.length, INF = 1e18, u = [], v = [], p = [], way = [], i, j;
  for (i = 0; i <= n; i++) { u.push(0); v.push(0); p.push(0); way.push(0); }
  for (i = 1; i <= n; i++) {
    p[0] = i;
    var j0 = 0, minv = [], used = [];
    for (j = 0; j <= n; j++) { minv.push(INF); used.push(false); }
    do {
      used[j0] = true;
      var i0 = p[j0], delta = INF, j1 = 0;
      for (j = 1; j <= n; j++) {
        if (used[j]) continue;
        var cur = a[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (j = 0; j <= n; j++) {
        if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else { minv[j] -= delta; }
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do { var jw = way[j0]; p[j0] = p[jw]; j0 = jw; } while (j0);
  }
  var rowToCol = [];
  for (j = 1; j <= n; j++) rowToCol[p[j] - 1] = j - 1;
  return rowToCol;
}
// ---- end shared sampler ----

function sampleTrials_(n, counts) {
  return sampleAssignment(n, counts, CASES, METHODS);
}

/* ------------------------------------------------------------------ stats */

function stats_() {
  var answered = currentCounts_(false);
  var withPending = currentCounts_(true);
  var pairs = methodPairs_();
  var byCase = {}, byPair = {}, cells = [];
  CASES.forEach(function (c) {
    pairs.forEach(function (p) {
      var k = c + "|" + p[0] + "|" + p[1];
      var a = answered[k] || 0;
      cells.push({ cell: k, answered: a, pending: (withPending[k] || 0) - a });
      byCase[c] = (byCase[c] || 0) + a;
      byPair[p.join(" vs ")] = (byPair[p.join(" vs ")] || 0) + a;
    });
  });
  var values = cells.map(function (x) { return x.answered; });
  return {
    total_answered: values.reduce(function (s, v) { return s + v; }, 0),
    min_per_cell: Math.min.apply(null, values),
    max_per_cell: Math.max.apply(null, values),
    by_case: byCase,
    by_pair: byPair,
    cells: cells
  };
}

/* ------------------------------------------------------------------ helpers */

function methodPairs_() {
  var sorted = METHODS.slice().sort();
  var pairs = [];
  for (var i = 0; i < sorted.length; i++)
    for (var j = i + 1; j < sorted.length; j++) pairs.push([sorted[i], sorted[j]]);
  return pairs;
}

function cellKey_(c, a, b) {
  return a < b ? c + "|" + a + "|" + b : c + "|" + b + "|" + a;
}

function compare_(x, y) {
  for (var i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

function add_(obj, key, v) { obj[key] = (obj[key] || 0) + v; }

function indexOf_(headerRow) {
  var col = {};
  headerRow.forEach(function (h, i) { col[h] = i; });
  return col;
}

function sheet_(name, headers) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
