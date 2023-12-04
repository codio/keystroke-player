/* eslint max-classes-per-file: ["error", 4] */
import * as I from 'immutable';
import _ from 'lodash';
import DiffMatchPatch from 'diff-match-patch';

import OtText from './shareman/ot-text';

import CodePlaybackStore from '../../../stores/code-playback-store';

class FileTimeline {
  static State = I.Record({
    needPreload: false,
    nextFrame: null,
    playDone: false,
    currentPosition: 0,
  });

  constructor(startPosition, endPosition, step, startContent, speed) {
    this.currentPosition = startPosition;
    this.endPosition = endPosition;
    this.startPosition = startPosition;
    this.step = step;
    this.startContent = startContent;
    this.timeline = I.List();
    this.speed = speed;
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  addFrame(offset, frame) {
    frame.timeline.forEach((item, position) => {
      const framePosition = position + this.step * offset;
      if (framePosition > this.endPosition) {
        return;
      }
      this.timeline = this.timeline.set(framePosition, item);
    });
  }

  moveToPosition(position) {
    this.currentPosition = position - 1;
    return this.getNextState();
  }

  positionInformation(position) {
    return this.timeline.get(position);
  }

  timelineState() {
    const newPosition = this.currentPosition + 1;
    const frame = Math.floor(newPosition / this.step);
    const futurePosition = this.currentPosition + 5 * this.speed;
    const noFutureData =
      !this.timeline.has(newPosition) || !this.timeline.has(futurePosition);

    return FileTimeline.State({
      needPreload: noFutureData,
      nextFrame: !this.timeline.has(newPosition) ? frame : frame + 1,
      playDone: newPosition > this.endPosition,
      currentPosition: this.currentPosition,
    });
  }

  getNextState() {
    let newPosition = this.currentPosition + 1;
    if (newPosition > this.endPosition) {
      newPosition = this.endPosition;
    }
    if (this.timeline.has(newPosition)) {
      const value = this.timeline.get(newPosition);
      if (value && _.isString(value.content)) {
        this.currentPosition = newPosition;
        return value.content;
      }
    }
  }
}

const FileFrame = I.Record({
  offset: 0,
  timeline: I.List(),
});

const FileChange = I.Record({
  content: '',
  modified: null,
  modifiedBy: '',
});

class ChangePlayer {
  static InitialStateInfo = I.Record({
    min: 0,
    max: 0,
  });

  static Position = I.Record({
    lineNumber: 0,
    column: 0,
  });

  static Range = I.Record({
    start: null,
    end: null,
  });

  static PositionInfo = I.Record({
    position: null,
    scroll: null,
  });

  static PositionMetadata = I.Record({
    modifiedBy: '',
    date: null,
  });

  static DecoratorOptions = I.Record({
    inlineClassName: '',
  });

  static Decorator = I.Record({
    range: null,
    options: null,
  });

  static PositionData = I.Record({
    content: '',
    decorators: I.List(),
    positionInfo: null,
    metadata: null,
  });

  constructor(projectId, fileName, speed = 5) {
    this.dmp = new DiffMatchPatch();
    this.projectId = projectId;
    this.filename = fileName;
    this.speed = speed;
  }

  _onLoadFileStateComplete(fileState, offset) {
    const { logs, snapshotInfo } = fileState;
    const { step } = this.metadataState;
    const sortedLogs = logs.sortBy((log) => log.version);
    let currentSnapshotStr = snapshotInfo.content;
    const timeline = new Array(step + 1);
    for (let i = sortedLogs.size - 1; i >= 0; i--) {
      const log = sortedLogs.get(i);
      if (!log) {
        break;
      }
      const timelinePosition =
        log.version === offset * step + step ? step : log.version % step;
      timeline[timelinePosition] = new FileChange({
        content: String(currentSnapshotStr),
        modified: log.modified,
        modifiedBy: log.modifiedBy,
      });
      const ops = log.changes.map((op) => {
        if (op.insertInfo) {
          return { p: op.insertInfo.position, i: op.insertInfo.insert };
        }
        return { p: op.deleteInfo.position, d: op.deleteInfo.deleteCount };
      });
      currentSnapshotStr = OtText.apply(currentSnapshotStr, ops.toJS());
    }
    const frame = new FileFrame({ offset, timeline: I.List(timeline) });
    this.fileTimeline.addFrame(offset, frame);
    return logs.size;
  }

  _loadFileState(offset) {
    return CodePlaybackStore.loadFileState(
      this.projectId,
      this.filename,
      offset
    ).then((fileState) => {
      return this._onLoadFileStateComplete(fileState, offset);
    });
  }

  _loadAllStates() {
    const chunksP = [];
    const chunksLength = Math.floor(
      this.fileTimeline.endPosition / this.fileTimeline.step
    );
    for (let i = 0; i < chunksLength + 1; i++) {
      chunksP.push(this._loadFileState(i));
    }
    return Promise.all(chunksP);
  }

  init(loadAll) {
    return CodePlaybackStore.loadFileInitialState(
      this.projectId,
      this.filename
    ).then((state) => {
      this.metadataState = state;
      this.fileTimeline = new FileTimeline(
        state.startVersion,
        state.endVersion,
        state.step,
        state.startContent,
        this.speed
      );
      this.loadingFramePromise = loadAll
        ? this._loadAllStates()
        : this._loadFileState(0);
      return this.loadingFramePromise
        .then(() => {
          return new ChangePlayer.InitialStateInfo({
            min: this.fileTimeline.startPosition,
            max: this.fileTimeline.endPosition,
          });
        })
        .finally(() => {
          this.loadingFramePromise = null;
        });
    });
  }

  setSpeed(speed) {
    this.speed = speed;
    this.fileTimeline && this.fileTimeline.setSpeed(this.speed);
  }

  getDataForPosition(position) {
    return new Promise((resolve) => {
      position = _.isNumber(position)
        ? position
        : this.fileTimeline.currentPosition;
      const prev = this.fileTimeline.positionInformation(position - 1);
      const current = this.fileTimeline.moveToPosition(position);
      if (_.isString(current)) {
        const info = this.fileTimeline.positionInformation(position);
        const { content, decorators, positionInfo } = this._getContentDetails(
          current,
          prev
        );
        resolve(
          new ChangePlayer.PositionData({
            content,
            decorators,
            positionInfo,
            metadata: new ChangePlayer.PositionMetadata({
              modifiedBy: info.modifiedBy,
              date: info.modified,
            }),
          })
        );
      } else {
        const { nextFrame } = this.fileTimeline.timelineState();
        if (!this.loadingFramePromise) {
          this.loadingFramePromise = this._loadFileState(nextFrame);
        }
        this.loadingFramePromise
          .then(() => this.getDataForPosition(position))
          .then((data) => resolve(data));
      }
    });
  }

  _getContentDetails(newContent, current) {
    let content;
    const decorators = [];
    let positionInfo = null;
    let detectedScrollInfo = null;
    if (current && _.isString(current.content)) {
      const diff = this.dmp.diff_main(current.content, newContent);
      this.dmp.diff_cleanupEfficiency(diff);
      const text = _.map(diff, (ops) => ops[1]);
      content = text.join('');
      let lineNumber = 1;
      let column = 1;
      _.each(diff, (diffItem) => {
        const op = diffItem[0];
        const content = diffItem[1];
        const parts = content.split('\n');
        const endRangeLineNumber = parts.length - 1;
        const endRangeColumn = parts[parts.length - 1].length;
        if (op === -1 || op === 1) {
          const range = new ChangePlayer.Range({
            start: new ChangePlayer.Position({ lineNumber, column }),
            end: new ChangePlayer.Position({
              lineNumber: lineNumber + endRangeLineNumber,
              column: column + endRangeColumn,
            }),
          });
          decorators.push(
            new ChangePlayer.Decorator({
              range,
              options: new ChangePlayer.DecoratorOptions({
                inlineClassName:
                  op === -1 ? 'codePlaybackRemove' : 'codePlaybackInsert',
              }),
            })
          );
        }
        lineNumber += endRangeLineNumber;
        column += endRangeColumn;
        if (!detectedScrollInfo) {
          detectedScrollInfo = new ChangePlayer.Position({
            lineNumber,
            column,
          });
        }
      });
    } else {
      content = newContent;
    }
    if (detectedScrollInfo) {
      positionInfo = new ChangePlayer.PositionInfo({
        position: detectedScrollInfo,
        scroll: new ChangePlayer.Position({
          lineNumber: detectedScrollInfo.lineNumber,
          column: 1,
        }),
      });
    }
    return { content, positionInfo, decorators: I.List(decorators) };
  }

  getPrevPosition() {
    if (!this.fileTimeline) {
      return null;
    }
    const position = this.fileTimeline.currentPosition - 1;
    if (position < this.fileTimeline.startPosition) {
      return null;
    }
    return position;
  }

  getNextPosition() {
    if (!this.fileTimeline) {
      return null;
    }
    const position = this.fileTimeline.currentPosition + 1;
    if (position > this.fileTimeline.endPosition) {
      return null;
    }
    return position;
  }
}

export default ChangePlayer;
