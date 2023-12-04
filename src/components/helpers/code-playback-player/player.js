import React, { useImperativeHandle, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import MonacoEditor, { monaco } from 'react-monaco-editor';
import _ from 'lodash';

const MONACO_FONT =
  '"Source Code Pro", Monaco, Menlo, Consolas, "Courier New", monospace';

const DEFAULT_OPTIONS = {
  fontFamily: MONACO_FONT,
  readOnly: true,
  ariaLabel: 'Code Playback',
  minimap: {
    enabled: false,
  },
};

const MIN_VISIBLE_LINES = 3;

const CodePlaybackEditor = React.forwardRef((props, ref) => {
  const monacoRef = useRef(null);
  const [currentDecorations, setCurrentDecorations] = useState([]);
  useImperativeHandle(ref, () => ({
    deltaDecorations: (data) => {
      if (monacoRef.current) {
        const decorations = _.map(data, (item) => {
          const range = monaco.Range.fromPositions(
            item.range.start,
            item.range.end
          );
          return { range, options: item.options };
        });
        const newDecorations = monacoRef.current.editor.deltaDecorations(
          currentDecorations,
          decorations
        );
        setCurrentDecorations(newDecorations);
      }
    },
    clearSelection: () => {
      if (monacoRef.current) {
        monacoRef.current.editor.setSelection({
          startLineNumber: 0,
          startColumn: 0,
          endLineNumber: 0,
          endColumn: 0,
        });
      }
    },
    setPosition: (position) => {
      if (monacoRef.current) {
        monacoRef.current.editor.setPosition(position);
      }
    },
    smartScrollToPosition(position) {
      if (monacoRef.current) {
        const { startLineNumber, endLineNumber } =
          monacoRef.current.editor.getVisibleRanges()[0];
        if (
          position.lineNumber > startLineNumber &&
          position.lineNumber < endLineNumber - MIN_VISIBLE_LINES
        ) {
          monacoRef.current.editor.revealPosition(position);
        } else {
          monacoRef.current.editor.revealPositionInCenter(position);
        }
      }
    },
  }));
  return (
    <div className="codePlaybackEditor">
      <MonacoEditor
        language={props.language}
        value={props.value}
        options={{ ...props.options, ...DEFAULT_OPTIONS }}
        editorDidMount={(editor, monaco) => {
          monacoRef.current = { editor, monaco };
        }}
      />
    </div>
  );
});

CodePlaybackEditor.propTypes = {
  language: PropTypes.string,
  value: PropTypes.string,
};

CodePlaybackEditor.defaultProps = {
  language: 'text',
  value: '',
};

CodePlaybackEditor.displayName = 'CodePlaybackEditor';

export default CodePlaybackEditor;
