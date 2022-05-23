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
