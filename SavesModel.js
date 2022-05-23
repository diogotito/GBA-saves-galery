const SAVES_FOLDER = "1Ra7VuME-GtGVOvRErbd7yiTzeTHlLhCN"


function* listSaves() {
  let myFolder = DriveApp.getFolderById(SAVES_FOLDER)
  let filesIterator = myFolder.getFiles()

  while (filesIterator.hasNext()) {
    yield filesIterator.next()
  }
}


function getGames() {
  let games = {}

  for (let file of listSaves()) {
    let match = /^(.*)(\.sav|\.st([0-9])(?:\.png)?)$/.exec(file.getName())
    if (match) {
      let [_fileName, game, ext, slot] = match
      //Logger.log("game = %s\next = %s\next endsWith .png = %s\nslot = %s\ngame in games = %s", game, ext, ext.endsWith('.png'), slot, game in games)
      if (!(game in games)) {
        games[game] = {
          name: game,
          saveStates: [...Array(10)].map((_, i) => ({
            slot: i,
            lastSaved: null,
            image: null,
            numRevisions: 0,
          })),
          description: "",
          cartridgeSave: null,
          numRevisions: 0,
        }
      }
      if (ext == ".sav") {
        games[game].description = file.getDescription()
        games[game].cartridgeSave = file.getLastUpdated()
        games[game].numRevisions = Drive.Revisions.list(file.getId()).items.length
      } else if (ext.endsWith(".png")) {
        games[game].saveStates[slot].image = file.getDownloadUrl()
      } else if (ext.startsWith(".st")) {
        games[game].saveStates[slot].lastSaved = file.getLastUpdated()
        games[game].saveStates[slot].numRevisions = Drive.Revisions.list(file.getId()).items.length
      }
    }
  }

  // console.log(games)
  return games
}