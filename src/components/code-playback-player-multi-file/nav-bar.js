import * as I from 'immutable';
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import DropdownList from 'react-widgets/DropdownList';

import PlainButton from '../plain-button';
import MDIcon from '../iconify';

import { formatDateFullUS } from '../../helpers/helpers';

import { SPEED, SPEED_DATA } from '../code-playback-player/constants';
import Timeline from './timeline';

const CodePlaybackMultiFileNavBar = ({
  positions,
  cases,
  step,
  stepMetadata,
  speed,
  isPlaying,
  onProgressChange,
  onSpeedChange,
  onPlayPause,
}) => {
  const timelineRef = useRef(null);

  useEffect(() => {
    timelineRef.current.setCustomTime(
      positions.get(step).date,
      'positionMarker',
      true
    );
  }, [step]);

  const getModifiedBy = () => {
    const modifiedBy =
      stepMetadata && stepMetadata.modifiedBy ? stepMetadata.modifiedBy : null;
    return modifiedBy === 'internal#reload'
      ? 'System - File Created'
      : modifiedBy;
  };

  return (
    <div className="CodePlaybackMultiFileNavBar codePlaybackTimeline">
      <Timeline
        ref={timelineRef}
        cases={cases}
        positions={positions}
        onProgressChange={onProgressChange}
      />
      <div className="codePlaybackTimeline-navBar">
        <div className="codePlaybackTimeline-playback-controls">
          <PlainButton
            className="codePlaybackTimeline-button"
            onClick={() => onProgressChange(step - 1)}
            title="Previous change"
            aria-label="Previous change"
            disabled={isPlaying || step <= 0}
          >
            <MDIcon icon="mdi:skip-backward" />
          </PlainButton>
          <PlainButton
            className="codePlaybackTimeline-button"
            onClick={onPlayPause}
            title="Play/Pause"
            aria-label="Play/Pause"
          >
            {isPlaying ? (
              <MDIcon icon="mdi:pause" />
            ) : (
              <MDIcon icon="mdi:play" />
            )}
          </PlainButton>
          <PlainButton
            className="codePlaybackTimeline-button"
            onClick={() => onProgressChange(step + 1)}
            title="Next change"
            aria-label="Next change"
            disabled={isPlaying || step >= positions.size - 1}
          >
            <MDIcon icon="mdi:skip-forward" />
          </PlainButton>
        </div>
        <div className="codePlaybackTimeline-metadata">
          <div className="codePlaybackTimeline-time">
            {stepMetadata && stepMetadata.date
              ? formatDateFullUS(stepMetadata.date, true)
              : null}
          </div>
          <div className="codePlaybackTimeline-username">
            <strong>Modified by:</strong>
            &nbsp;{getModifiedBy()}
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
            dropUp={true}
          />
        </div>
      </div>
    </div>
  );
};

CodePlaybackMultiFileNavBar.propTypes = {
  cases: PropTypes.instanceOf(I.List),
  positions: PropTypes.instanceOf(I.List).isRequired,
  step: PropTypes.number,
  stepMetadata: PropTypes.shape({
    date: PropTypes.instanceOf(Date),
    modifiedBy: PropTypes.string,
  }),
  speed: PropTypes.oneOf(_.values(SPEED)),
  isPlaying: PropTypes.bool,
  onProgressChange: PropTypes.func,
  onSpeedChange: PropTypes.func,
  onPlayPause: PropTypes.func,
};

CodePlaybackMultiFileNavBar.defaultProps = {
  cases: I.List(),
  step: 0,
  stepMetadata: null,
  speed: 1,
  isPlaying: false,
  onProgressChange: () => {},
  onSpeedChange: () => {},
  onPlayPause: () => {},
};

export default CodePlaybackMultiFileNavBar;
