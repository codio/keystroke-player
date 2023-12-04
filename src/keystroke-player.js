import React, { useState } from 'react';

import CodePlaybackPlayerMultiFile from './components/helpers/code-playback-player-multi-file';

const KeystrokePlayer = ({ cases }) => {
  const [modelsData, setModelsData] = useState(null);

  if (!modelsData) {
    return <div className="keystrokePlayer-loading">Need to load data</div>;
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
