// ============================================================
// Aquire Website — Form Submission Handler
// Google Apps Script Web App
// Deploy as: Execute as Me, Anyone can access
// ============================================================

const SHEET_ID   = "15VXAF49L4Hs7bRZeI99TIkElAWxV27NAK4_W6sz-kR0";
const NOTIFY_TO  = "info@aquiredata.com";
const SHEET_NAME = "Submissions";

// ── Bootstrap sheet headers on first run ──────────────────
function setupSheet() {
  const ss     = SpreadsheetApp.openById(SHEET_ID);
  let   sheet  = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    const headers = [
      "Timestamp",
      "Form Type",
      "First Name",
      "Last Name",
      "Email",
      "Organization",
      "Cloud Platform",
      "Monthly Spend",
      "Message / Challenge",
      "Source Page"
    ];
    const headerRow = sheet.getRange(1, 1, 1, headers.length);
    headerRow.setValues([headers]);
    headerRow.setFontWeight("bold");
    headerRow.setBackground("#0c1a2e");
    headerRow.setFontColor("#35dfe7");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 180);  // Timestamp
    sheet.setColumnWidth(2, 120);  // Form Type
    sheet.setColumnWidth(3, 120);  // First Name
    sheet.setColumnWidth(4, 120);  // Last Name
    sheet.setColumnWidth(5, 220);  // Email
    sheet.setColumnWidth(6, 200);  // Organization
    sheet.setColumnWidth(7, 160);  // Cloud Platform
    sheet.setColumnWidth(8, 140);  // Monthly Spend
    sheet.setColumnWidth(9, 320);  // Message
    sheet.setColumnWidth(10, 120); // Source Page
  }
  return sheet;
}

// ── Handle POST from website forms ────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    return handleSubmission(data);
  } catch(err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ── Handle GET (fallback for JSONP / testing) ──────────────
function doGet(e) {
  if (e.parameter && e.parameter.data) {
    try {
      const data = JSON.parse(decodeURIComponent(e.parameter.data));
      return handleSubmission(data);
    } catch(err) {
      return jsonResponse({ success: false, error: err.toString() });
    }
  }
  return jsonResponse({ success: true, message: "Aquire form endpoint is live." });
}

function handleSubmission(data) {
  const sheet = setupSheet();
  const now   = new Date();

  // Append row to sheet
  sheet.appendRow([
    Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"),
    data.formType    || "Contact",
    data.firstName   || "",
    data.lastName    || "",
    data.email       || "",
    data.org         || "",
    data.platform    || "",
    data.spend       || "",
    data.message     || "",
    data.sourcePage  || ""
  ]);

  // Color-code new row
  const lastRow = sheet.getLastRow();
  const isAudit = (data.formType === "48-Hr Scorecard");
  sheet.getRange(lastRow, 1, 1, 10)
    .setBackground(isAudit ? "#0d1f3a" : "#0c1726");

  // Send email notification to info@aquiredata.com
  const subject = isAudit
    ? `🔔 New 48-Hr Scorecard Request — ${data.org || data.email}`
    : `📬 New Contact Form Submission — ${data.org || data.email}`;

  const body = `
New form submission received on aquiredata.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORM TYPE:     ${data.formType || "Contact"}
SUBMITTED:     ${now.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NAME:          ${data.firstName} ${data.lastName}
EMAIL:         ${data.email}
ORGANIZATION:  ${data.org || "—"}
CLOUD PLATFORM: ${data.platform || "—"}
MONTHLY SPEND: ${data.spend || "—"}

MESSAGE / CHALLENGE:
${data.message || "—"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
View all submissions:
https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();

  MailApp.sendEmail({
    to:      NOTIFY_TO,
    subject: subject,
    body:    body
  });

  return jsonResponse({ success: true, message: "Submission received." });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
