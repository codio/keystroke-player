import * as I from 'immutable';
import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { Timeline as VisTimeline } from 'vis-timeline/esnext';
import PropTypes from 'prop-types';

import { generateId } from '../../../helpers/helpers';
import MDIcon from '../iconify';

const MINUTE_MS = 60 * 1000;
const SESSION_LENGTH_MS = 10 * MINUTE_MS;

const GROUP_FILE = 'Files';
const GROUP_COPY_PASTE = 'CopyPaste';

const groups = [
  { id: GROUP_FILE, content: 'File name' },
  {
    id: GROUP_COPY_PASTE,
    content: 'Pastes',
    className: `timelineGroup${GROUP_COPY_PASTE}`,
  },
];

const getTimelineItem = (id, group, content, start, end, title) => {
  return {
    id: id || generateId(8),
    group: group,
    content,
    start: new Date(start),
    end: end ? new Date(end) : undefined,
    title,
    type: end ? 'range' : 'box',
  };
};

const generateTimelineData = (positions, cases) => {
  if (!positions) {
    return {};
  }
  const items = [];
  const hiddenDates = [];
  let startRange = null;
  positions.forEach((item, index) => {
    const nextItem = positions.get(index + 1);
    if (!startRange) {
      startRange = item.date;
    }
    const sessionExpireDate = new Date(item.date.getTime() + SESSION_LENGTH_MS);
    const isSessionExpired = nextItem && nextItem.date > sessionExpireDate;
    const isFileChanged = nextItem && nextItem.fileName !== item.fileName;
    if (!nextItem || isSessionExpired || isFileChanged) {
      let endRange = sessionExpireDate;
      if (!isSessionExpired && isFileChanged) {
        endRange = nextItem.date;
      }
      if (
        nextItem &&
        nextItem.date.getTime() - endRange.getTime() > MINUTE_MS
      ) {
        hiddenDates.push({
          start: endRange.getTime() + MINUTE_MS,
          end: nextItem.date.getTime() - 1,
        });
      }
      items.push(
        getTimelineItem(
          null,
          GROUP_FILE,
          item.fileName.split('/').pop(),
          startRange,
          endRange,
          item.fileName
        )
      );
      startRange = null;
    }
  });
  if (cases) {
    cases.forEach((item, index) => {
      const id = `${generateId(8)}-${index}`;
      items.push(
        getTimelineItem(id, GROUP_COPY_PASTE, `${item.lines} lines`, item.date)
      );
    });
  }
  return {
    items,
    groups,
    options: {
      showCurrentTime: false,
      hiddenDates,
      stack: false,
    },
  };
};

const Timeline = React.forwardRef((props, ref) => {
  const { cases, positions } = props;
  const elRef = useRef();
  const timelineRef = useRef();
  useImperativeHandle(ref, () => ({
    setCustomTime: (date, id, forbidDrag) => {
      const timeline = timelineRef.current;
      try {
        timeline.getCustomTime(id);
        return timeline.setCustomTime(date, id);
      } catch {
        const elId = timeline.addCustomTime(date, id);
        if (forbidDrag) {
          timeline.customTimes[timeline.customTimes.length - 1].hammer.off(
            'panstart panmove panend'
          );
        }
        return elId;
      }
    },
  }));
  const onTimelineClick = (event) => {
    let date = event.time;
    if (event.item && event.group === GROUP_COPY_PASTE) {
      date = cases.get(event.item.split('-')[1]).date;
    }
    const nearestIndex = positions.findIndex((item) => item.date >= date);
    if (nearestIndex > 0) {
      props.onProgressChange(nearestIndex);
    }
  };

  useEffect(() => {
    const { items, groups, options } = generateTimelineData(positions, cases);
    options.onInitialDrawComplete = () => {
      timelineRef.current.setWindow(
        positions.first().date.getTime() - MINUTE_MS,
        positions.last().date.getTime() + SESSION_LENGTH_MS + MINUTE_MS
      );
    };
    timelineRef.current = new VisTimeline(
      elRef.current,
      items,
      groups,
      options
    );
    timelineRef.current.on('click', onTimelineClick);
    return () => {
      if (timelineRef.current) {
        timelineRef.current.off('click');
      }
    };
  }, []);

  return (
    <div className="timeline">
      <div className="timelineEl" ref={elRef} />
      <div className="timelineGroupTitle">Timeline</div>
      <div className="timelineControls">
        <button
          type="button"
          className="plainButton timelineControlButton"
          onClick={() => timelineRef.current.zoomIn(0.4)}
        >
          <MDIcon icon="mdi:magnify-plus-outline" />
          Zoom In
        </button>
        <button
          type="button"
          className="plainButton timelineControlButton"
          onClick={() => timelineRef.current.zoomOut(0.4)}
        >
          <MDIcon icon="mdi:magnify-minus-outline" />
          Zoom Out
        </button>
      </div>
    </div>
  );
});

Timeline.propTypes = {
  positions: PropTypes.instanceOf(I.List).isRequired,
  cases: PropTypes.instanceOf(I.List),
  onProgressChange: PropTypes.func,
};

Timeline.defaultProps = {
  onProgressChange: () => {},
};

export default Timeline;
