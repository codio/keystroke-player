import * as I from 'immutable';
import { parse } from 'csv-parse/browser/esm/sync';
import _ from 'lodash';

const InitialState = I.Record({
  startVersion: 0,
  startContent: '',
  endContent: '',
  endVersion: 0,
  step: 0,
});

const FileStates = I.Record({
  logs: null,
  snapshotInfo: null,
});

const Snapshot = I.Record({
  content: '',
  version: 0,
  modified: null,
});

const ChangeLog = I.Record({
  version: 0,
  changes: null,
  modified: null,
  modifiedBy: '',
});

const TextChanges = I.Record({
  insertInfo: null,
  deleteInfo: null,
});

const TextInsert = I.Record({
  position: 0,
  insert: '',
});

const TextDelete = I.Record({
  position: 0,
  deleteCount: 0,
});

const ModelData = I.Record({
  initialState: null,
  states: null,
});

export const getInitialStateFromData = (data) => {
  return new InitialState({
    startVersion: data.startVersion,
    startContent: data.startContent,
    endContent: data.endContent,
    endVersion: data.endVersion,
    step: data.step,
  });
};

const getSnapshotFromData = (data) => {
  if (!data) {
    return null;
  }
  return new Snapshot({
    content: data.content,
    version: data.version,
    modified: new Date(data.modified),
  });
};

const getTextInsertFromData = (data) => {
  if (!data) {
    return null;
  }
  return new TextInsert({
    position: data.position,
    insert: data.insert,
  });
};

const getTextDeleteFromData = (data) => {
  if (!data) {
    return null;
  }
  return new TextDelete({
    position: data.position,
    deleteCount: data.delete,
  });
};

const getTextChangesFromData = (data) => {
  return new TextChanges({
    insertInfo: getTextInsertFromData(data.insert),
    deleteInfo: getTextDeleteFromData(data.delete),
  });
};

const getChangeLogFromData = (data) => {
  if (!data) {
    return null;
  }
  return new ChangeLog({
    version: data.version,
    changes: I.List(data.changes).map(getTextChangesFromData),
    // bug on server side - getModified().getSeconds() = time in milliseconds
    modified: new Date(data.modified / 1000),
    modifiedBy: data.modifiedBy,
  });
};

export const getFileStatesFromData = (data) => {
  return new FileStates({
    logs: I.List(data.logs).map(getChangeLogFromData),
    snapshotInfo: getSnapshotFromData(data.snapshotInfo),
  });
};

const getModelDataFromData = (data) => {
  return new ModelData({
    initialState: getInitialStateFromData(data.initialState),
    states: getFileStatesFromData(data.states),
  });
};

export const getModelsDataFromFile = (data) => {
  return I.Map(
    I.List(
      Object.keys(data).map((key) => [key, getModelDataFromData(data[key])])
    )
  );
};

function getTime(date) {
  return new Date(date).getTime() * 1000;
}

export const getModelsDataFromCSVFile = (data) => {
  const lines = parse(data, {
    delimiter: ',',
    columns: true,
    skip_empty_lines: true,
  });
  if (lines.length < 1) {
    throw new Error('no data in file');
  }

  const initialState = {
    endVersion: parseInt(lines[lines.length - 1].version, 10),
    startVersion: 0,
    startContent: '',
    step: 200000,
  };
  const logs = [];
  const result = {
    filename: {
      initialState,
      states: {
        logs,
        snapshotInfo: {
          content: '',
          modified: getTime(lines[0].date),
          version: 0,
        }
      }
    }
  };

  const changes = _.groupBy(lines, 'version');
  for (const [version, change] of Object.entries(changes)) {
    const ops = [];
    const logOp = {
      version: parseInt(version, 10),
      modified: getTime(change[0].date),
      modifiedBy: change[0].user,
      changes: ops,
    };

    for (const op of change) {
      if (op.insert || !op.delete) {
        ops.push({
          insert: op.insert ? {
            position: parseInt(op.position, 10),
            insert: op.insert
          } : null,
          delete: op.delete ? {
            position: parseInt(op.position, 10),
            delete: parseInt(op.delete, 10)
          } : null
        });
      }
    }

    logs.push(logOp);
  }
  return getModelsDataFromFile(result);
};
