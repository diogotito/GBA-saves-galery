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


/** Fetches revision lists in bulk */
function getRevisionsInBulk(fileIds) {
  const cache = CacheService.getScriptCache()
  const TIME = (label, f) => {
    console.time(label)
    let ret = f()
    console.timeEnd(label)
    return ret
  }

  return fileIds.map(id => {
    let file = TIME(`DriveApp.getFileById(${id})`,
               () => DriveApp.getFileById(id))
    return TIME(`getRevisions() ${id}`,
           () => getRevisions(file, cache))
  })
}


/** Uses the script cache and the advanced Drive API */
function getRevisions(file, cache) {
  const ONE_DAY = 24 * 60 * 60;

  if (!cache) {
    cache = CacheService.getScriptCache();
  }

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
          fileId: null,
          saveStates: [...Array(10)].map((_, i) => ({
            slot: i,
            fileId: null,
            imageId: null,
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
        games[game].fileId = file.getId()
        games[game].description = parseDescription(file.getDescription())
        games[game].cartridgeSave = file.getLastUpdated()
      } else if (ext.endsWith(".png")) {
        games[game].saveStates[slot].imageId = file.getId()
        games[game].saveStates[slot].image = file.getDownloadUrl()
      } else if (ext.startsWith(".st")) {
        games[game].saveStates[slot].fileId = file.getId()
        games[game].saveStates[slot].lastSaved = file.getLastUpdated()
      }
    }
  }

  return games
}