const zFill = int => String(int).padStart(2, '0')
const fmtDateTime = d =>
  `${zFill(d.getFullYear())}-${zFill(d.getMonth() + 1)}-${zFill(d.getDate())} ` +
  `${zFill(d.getHours())}:${zFill(d.getMinutes())}`

function doGet() {
  return HtmlService
      .createTemplateFromFile('app_template')
      .evaluate()
}


function doGet_notemplate() {
  return HtmlService.createHtmlOutput(
    "<h1>hello</h1>" + savesTable())
}

function savesTable() {
  const zFill = int => String(int).padStart(2, '0')
  const formatDateTime = d =>
    `${zFill(d.getFullYear())}-${zFill(d.getMonth())}-${zFill(d.getDay())} ` +
    `${zFill(d.getHours())}:${zFill(d.getMinutes())}`

  const base64img = blob => blob
    ? `<img src="data:image/png;base64,${Utilities.base64Encode(blob.getBytes())}" />`
    : "no thumbnail"

  const p = val => (console.log(val), val)

  return `<table>
    <tr>
      <th>Thumbnail</th>
      <th>File Name</th>
      <th>Date</th>
    </tr>
    Array.from(listSaves(), file => '...').join('')
    ${[...listSaves()].map(file => `<tr>
      <td>${p(file.getName().match(/\.png$/) ? `<a href="${file.getDownloadUrl()}">${file.getName()}</a>` : '[X]')}</td>
      <td>${file.getName()}</td>
      <td>${formatDateTime(file.getLastUpdated())}</td>
    </tr>`).join('')}
  </table>`
}