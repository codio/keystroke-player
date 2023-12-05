import * as I from 'immutable';

import PlayerModel from '../code-playback-player/player-model';

class MultiFileModel {
  constructor(modelsData, options = {}) {
    this.modelsData = modelsData;
    this.options = options;
    this.modelCache = I.Map();
  }

  getAllModels() {
    return this.modelsData
      .keySeq()
      .map((fileName) => this.getModel(fileName))
      .toList();
  }

  getModel(fileName) {
    if (!this.modelCache.has(fileName)) {
      const modelData = this.modelsData.get(fileName);
      this.modelCache = this.modelCache.set(
        fileName,
        new PlayerModel(fileName, modelData, this.options.speed)
      );
    }
    return this.modelCache.get(fileName);
  }

  async getDataForPosition(fileName, version) {
    const model = await this.loadModel(fileName);
    return model.getDataForPosition(version);
  }

  setSpeed(speed) {
    this.modelCache.forEach((model) => {
      model.setSpeed(speed);
    });
  }
}

export default MultiFileModel;
