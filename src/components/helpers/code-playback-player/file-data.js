import * as I from 'immutable';

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
    changes: I.List(data.changesList).map(getTextChangesFromData),
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

export const getModelsDataFromFile = (data) => {
  return new ModelData({
    initialState: getInitialStateFromData(data.initialState),
    states: getFileStatesFromData(data.states),
  });
};
