import React, { useState } from 'react';

import CodePlaybackPlayerMultiFile from './components/code-playback-player-multi-file';
import { getModelsDataFromFile, getModelsDataFromCSVFile } from './components/code-playback-player/file-data';

const KeystrokePlayer = () => {
  const [modelsData, setModelsData] = useState(null);
  const [error, setError] = useState(null);
  const [cases] = useState(null);

  const onFileSelected = (e) => {
    e.preventDefault();
    setError(null);
    setModelsData(null);

    const file = e.target.files[0];
    const fr = new FileReader();
    fr.onload = () => {
      try {
        let data = null
        if (file.name.indexOf('.json') !== -1) {
          data = getModelsDataFromFile(JSON.parse(fr.result));
        } else if (file.name.indexOf('.csv') !== -1) {
          data = getModelsDataFromCSVFile(fr.result);
        }
        if (!data) {
          throw new Error('Wrong file format');
        }
        setModelsData(data);
      } catch ({ message }) {
        setError(message);
      }
    };
    fr.onerror = () => setError(`Reading file error: ${file.name}`);

    fr.readAsText(e.target.files[0]);
  };

  const getFileBar = () => {
    const message = error
      ? `Error occurred(${error}). Please try to load another file.`
      : 'Select a file with data';
    return (
      <div className="keystrokePlayer-fileBar">
        <div className="keystrokePlayer-fileBar-message">{message}</div>
        <input type="file" onChange={onFileSelected} />
      </div>
    );
  };

  const getPlayer = () => {
    if (!modelsData) {
      return null;
    }
    return (
      <CodePlaybackPlayerMultiFile
        className="keystrokePlayer-code-playback"
        cases={cases}
        modelsData={modelsData}
      />
    );
  };

  return (
    <div
      className={`keystrokePlayer ${
        !modelsData ? 'keystrokePlayer-code-playback--empty' : ''
      }`}
    >
      {getFileBar()}
      {getPlayer()}
    </div>
  );
};

export default KeystrokePlayer;
