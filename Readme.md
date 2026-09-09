## User Study Template (Sortable + Google Apps Script)

This is a customized User Study template that features drag-and-drop ranking based on Yes/No evaluation of generation results.

### Features
1. Displays a **Reference Image/Video** alongside multiple **Candidate Images/Videos**.
2. Requires the user to first evaluate each candidate using **Yes/No** selection.
3. Once marked as "Yes", the candidate dynamically drops into a Rank List where the user can drag and drop to rank their preferences.
4. Auto-calculates ranking:
   - "Yes" candidates are ranked 1 to K based on drag-and-drop order.
   - "No" candidates are assigned a rank of K + 1.
5. Saves all interaction state so the user can freely go PREV / NEXT without losing their answers.
6. Submits data seamlessly to your Google Sheets using a hidden Google Apps Script (GAS) API.

---

### Step 1: Deploy Google Apps Script (GAS)

To capture the data automatically into Google Sheets without exposing your credentials, follow these steps:

1. Open your Google Drive, click **New**, and create a new **Google Sheets** document. Name it for your User Study.
2. In the top nav menu, click **Extensions > Apps Script**.
3. Replace the default `myFunction()` code with the following code to receive JSON:

```javascript
// Google Apps Script - doPost endpoint
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Parse the JSON data sent from index.js
  var data = JSON.parse(e.postData.contents);
  var username = data.username;
  var timestamp = data.timestamp;

  // We are putting timestamp & username in the first two columns
  var rowData = [timestamp, username];

  // Modify this array according to your num_tasks and candidate 'value' names in index.html
  // Currently, the default values are "codef", "medm", "ours" and tasks are 1 to 15.
  // We recommend you auto-parse the keys like so to make it dynamic:
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // If the sheet is completely empty, you might want to write headers dynamically!
  if (headers.length <= 1) { // It means empty sheet or close to it
    var newHeaders = ["Timestamp", "Username"];
    for (var key in data) {
      if (key !== "username" && key !== "timestamp") {
        newHeaders.push(key);
      }
    }
    sheet.appendRow(newHeaders);
    headers = newHeaders;
  }

  // Map the received data to the correct column dynamically based on headers
  for (var i = 2; i < headers.length; i++) {
    var keyName = headers[i];
    rowData.push(data[keyName] === undefined ? "" : data[keyName]);
  }

  // Append data row
  sheet.appendRow(rowData);

  return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
}
```

4. Click the **Save** (disk icon).
5. Click **Deploy > New Deployment** in the top right.
6. Click the gear icon next to "Select type" and choose **Web app**.
7. In the settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Click **Deploy**. (Google will ask you to authorize access to your Google Account. You may see a "Google hasn't verified this app" warning. Click 'Advanced' and proceed to your script).
9. Copy the **Web app URL**.

### Step 2: Configure the Frontend

1. Open `index.html`.
2. Locate the following line (around line 43):
   ```javascript
   const GAS_API_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";
   ```
3. Paste the URL you copied from Step 1.

### Step 3: Modify Your Data Pipeline

The frontend data is populated dynamically.

In `index.html`, locate the `data_list` generation block (around line 52):
```javascript
for(let i=1; i<=15; i++) {
    data_list.push({
        "name": `${i}`,
        "input": `data/${i}/original_fps15.mp4`, // Reference
        "data": [ // Candidates
            { "url": `data/${i}/codef_fps15.mp4`, "value": "codef", ... },
            { "url": `data/${i}/medm_fps15.mp4`, "value": "medm", ... },
            { "url": `data/${i}/ours_fps15.mp4`, "value": "ours", ... },
        ]
    });
}
```

Change `value` strings to whatever short codes you want to register in your Google Sheets column headers (e.g. `ours`, `baselineA`).
If you need `<image>`, adjust `element_type` variable to `"image"`.

Enjoy collecting your customized ranking data!
