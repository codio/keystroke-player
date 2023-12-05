import React, { useState } from 'react';

import CodePlaybackPlayerMultiFile from './components/code-playback-player-multi-file';
import { getModelsDataFromFile } from './components/code-playback-player/file-data';

const KeystrokePlayer = () => {
  const [modelsData, setModelsData] = useState(null);
  const [error, setError] = useState(null);
  const [cases] = useState(null);

  const onFileSelected = (e) => {
    setError(null);
    e.preventDefault();
    const file = e.target.files[0];
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const data = getModelsDataFromFile(JSON.parse(fr.result));
        setModelsData(data);
      } catch ({ message }) {
        setError(message);
      }
    };
    fr.onerror = () => setError(`Reading file error: ${file.name}`);

    fr.readAsText(e.target.files[0]);
  };

  if (!modelsData) {
    const message = error
      ? `Error occurred(${error}). Please try to load another file.`
      : 'Please models data file';
    return (
      <div className="keystrokePlayer-loading">
        {message}&nbsp;
        <input type="file" onChange={onFileSelected} />
      </div>
    );
  }

  return (
    <CodePlaybackPlayerMultiFile
      className="keystrokePlayer-code-playback"
      cases={cases}
      modelsData={modelsData}
    />
  );
};

export default KeystrokePlayer;
