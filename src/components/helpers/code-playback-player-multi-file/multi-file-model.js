import * as I from 'immutable'

import PlayerModel from '../code-playback-player/player-model'

class MultiFileModel {
  constructor(projectId, fileNames, options = {}) {
    this.projectId = projectId
    this.fileNames = fileNames
    this.options = options
    this.modelCache = I.Map()
    this.modelInitailizedMapByPath = I.Map()
  }

  preloadAllModels() {
    const promises = this.fileNames.map(fileName => {
      return this.loadModel(fileName, true)
    }).toArray()
    return Promise.all(promises).then(resultArray => I.List(resultArray))
  }

  async loadModel(fileName, loadAll) {
    if (!this.modelCache.has(fileName)) {
      this.modelCache = this.modelCache.set(
        fileName,
        new PlayerModel(this.projectId, fileName, this.options.speed)
      )
    }
    const cachedModel = this.modelCache.get(fileName)
    if (!this.modelInitailizedMapByPath.get(fileName)) {
      await cachedModel.init(loadAll)
      this.modelInitailizedMapByPath = this.modelInitailizedMapByPath.set(fileName, true)
    }
    return cachedModel
  }

  async getDataForPosition(fileName, version) {
    const model = await this.loadModel(fileName)
    return model.getDataForPosition(version)
  }

  setSpeed(speed) {
    this.modelCache.forEach(model => {
      model.setSpeed(speed)
    })
  }
}

export default MultiFileModel
