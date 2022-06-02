const SAVES_FOLDER = "1Ra7VuME-GtGVOvRErbd7yiTzeTHlLhCN"


function* listSaves() {
  let myFolder = DriveApp.getFolderById(SAVES_FOLDER)
  let filesIterator = myFolder.getFiles()

  while (filesIterator.hasNext()) {
    const f = filesIterator.next()
    const label = `yielding ${f.getName()}`
    console.time(label)
    yield f
    console.timeEnd(label)
  }
}


/** Uses the script cache and the advanced Drive API */
function getRevisions(file) {
  const ONE_DAY = 24 * 60 * 60;
  const cache = CacheService.getScriptCache();
  
  // Try to retrieve from cache and return the cached value if successful
  const key = file.getName() + "/" + file.getLastUpdated().toISOString()
  let value = cache.get(key)
  if (value !== null) {
    console.log(`Retrieved value for ${key}:\n${value}`)
    return JSON.parse(value)
  }

  // Fetch file revisions (slow!) and simplify the results
  let revisions = Drive.Revisions.list(file.getId()).items
  revisions = revisions.map( ({modifiedDate, downloadUrl}) => ({modifiedDate, downloadUrl}) )
  
  // Cache the result
  value = JSON.stringify(revisions)
  cache.put(key, value, ONE_DAY)
  console.log(`-> STORED value for ${key}:\n${value}`)

  return revisions
}


const cleanupROMName = romName =>
  /^(?:\d{4} - )?(?<NAME>.*?)(?: \(\w\) ?\(.*\))?$/
    .exec(romName)?.groups["NAME"] ?? romName


function parseDescription(descText) {
  const descLines = descText.split('\n')
  
  const review = descLines.filter(line => !line.startsWith("* ")).join('\n')
  
  const ratingText = descLines.filter(line => line.startsWith("* ")).join('\n')
  const ratings = {}
  for (const [, name, score, _maxScore] of ratingText.matchAll(/\*\s*([^:]+): ([\d.]+)\/(\d+)/g)) {
    ratings[name] = parseFloat(score)
  }

  return { review, ratings }
}


function getAllGames() {
  let games = {}

  for (let file of listSaves()) {
    let match = /^(.*)(\.sav|\.st([0-9])(?:\.png)?)$/.exec(file.getName())
    if (match) {
      let [_fileName, game, ext, slot] = match
      if (!(game in games)) {
        games[game] = {
          romName: game,
          gameName: cleanupROMName(game),
          saveStates: [...Array(10)].map((_, i) => ({
            slot: i,
            lastSaved: null,
            image: null,
            numRevisions: 0,
          })),
          description: { review: "", ratings: {} },
          cartridgeSave: null,
          numRevisions: 0,
        }
      }
      if (ext == ".sav") {
        games[game].description = parseDescription(file.getDescription())
        games[game].cartridgeSave = file.getLastUpdated()
        games[game].numRevisions = getRevisions(file).length
      } else if (ext.endsWith(".png")) {
        games[game].saveStates[slot].image = file.getDownloadUrl()
        games[game].saveStates[slot].numRevisions = getRevisions(file).length
      } else if (ext.startsWith(".st")) {
        games[game].saveStates[slot].lastSaved = file.getLastUpdated()
      }
    }
  }

  return games
}