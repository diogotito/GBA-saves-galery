// TODO "route" e to return JSON response to eventually query my GBA games through a static app hosted in GitHub Pages
// return ContentService.createTextOutput(JSON.stringify(getGames())).setMimeType(ContentService.MimeType.JSON)

// Entry point for web app
const doGet = _e =>
  HtmlService.createTemplateFromFile('page/index').evaluate()

// Utilities used in app_template.html

const include = filename =>
  HtmlService.createHtmlOutputFromFile(filename).getContent()

const zFill = int => String(int).padStart(2, '0')

const fmtDateTime = d =>
  `${zFill(d.getFullYear())}-${zFill(d.getMonth() + 1)}-${zFill(d.getDate())} ` +
  `${zFill(d.getHours())}:${zFill(d.getMinutes())}`
