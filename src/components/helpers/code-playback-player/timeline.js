import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Slider from 'rc-slider';
import DropdownList from 'react-widgets/DropdownList';

import PlainButton from '../plain-button';

import { formatDateFullUS } from '../../../helpers/tools';
import Icon from '../icon';
import { SPEED, SPEED_DATA } from './constants';

const CodePlaybackTimeline = ({
  min,
  max,
  step,
  marks,
  stepMetadata,
  speed,
  isPlaying,
  onBeforeProgressChange,
  onProgressChange,
  onAfterProgressChange,
  onSpeedChange,
  onPlayPause,
  onBack,
  onForward,
}) => {
  return (
    <div className="codePlaybackTimeline">
      <Slider
        min={min}
        max={max}
        value={step}
        onBeforeChange={onBeforeProgressChange}
        onChange={(value) => onProgressChange(value)}
        onAfterChange={onAfterProgressChange}
        ariaLabelForHandle="Code Playback Position"
        marks={marks}
      />
      <div className="codePlaybackTimeline-navBar">
        <div className="codePlaybackTimeline-playback-controls">
          <PlainButton
            className="codePlaybackTimeline-button"
            onClick={onBack}
            title="Previous change"
            aria-label="Previous change"
            disabled={isPlaying || step <= min}
          >
            <Icon name="skipback" />
          </PlainButton>
          <PlainButton
            className="codePlaybackTimeline-button"
            onClick={onPlayPause}
            title="Play/Pause"
            aria-label="Play/Pause"
          >
            <Icon name={isPlaying ? 'pause' : 'play'} />
          </PlainButton>
          <PlainButton
            className="codePlaybackTimeline-button"
            onClick={onForward}
            title="Next change"
            aria-label="Next change"
            disabled={isPlaying || step >= max}
          >
            <Icon name="skipforward" />
          </PlainButton>
        </div>
        <div className="codePlaybackTimeline-metadata">
          <div className="codePlaybackTimeline-time">
            {stepMetadata && stepMetadata.date
              ? formatDateFullUS(stepMetadata.date, true)
              : null}
          </div>
          <div className="codePlaybackTimeline-username">
            <strong>Modified by:</strong>{' '}
            {stepMetadata && stepMetadata.userName
              ? stepMetadata.userName
              : null}
          </div>
        </div>
        <div className="codePlaybackTimeline-speed-container">
          <strong>Speed:</strong>
          <DropdownList
            className="codePlaybackTimeline-speed"
            onChange={(value) => onSpeedChange(value.value)}
            data={SPEED_DATA}
            dataKey="value"
            textField="name"
            value={speed}
            title="Play speed"
            aria-label="Play speed"
          />
        </div>
      </div>
    </div>
  );
};

CodePlaybackTimeline.propTypes = {
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  marks: PropTypes.object,
  stepMetadata: PropTypes.shape({
    date: PropTypes.instanceOf(Date),
    userName: PropTypes.string,
  }),
  speed: PropTypes.oneOf(_.values(SPEED)),
  isPlaying: PropTypes.bool,
  onBeforeProgressChange: PropTypes.func,
  onProgressChange: PropTypes.func,
  onAfterProgressChange: PropTypes.func,
  onSpeedChange: PropTypes.func,
  onPlayPause: PropTypes.func,
  onBack: PropTypes.func,
  onForward: PropTypes.func,
};

CodePlaybackTimeline.defaultProps = {
  min: 0,
  max: 0,
  step: 0,
  marks: {},
  stepMetadata: null,
  speed: 1,
  isPlaying: false,
  onBeforeProgressChange: () => {},
  onProgressChange: () => {},
  onAfterProgressChange: () => {},
  onSpeedChange: () => {},
  onPlayPause: () => {},
  onBack: () => {},
  onForward: () => {},
};

export default CodePlaybackTimeline;
