import React, {useEffect, useRef, useState} from 'react'
import * as I from 'immutable'
import _ from 'lodash'
import PropTypes from 'prop-types'

import useInterval from '../../helpers/use-interval'

import {SPEED} from './code-playback-player/constants'
import CodePlaybackEditor from './code-playback-player/player'
import MultiFileModel from './code-playback-player-multi-file/multi-file-model'
import CodePlaybackMultiFileNavBar from './code-playback-player-multi-file/nav-bar'
import {buildPositions} from './code-playback-player-multi-file/helper'

const CodePlaybackPlayerMultiFile = ({modelsData, cases, className}) => {
  const codePaybackEditorRef = useRef(null)
  const [value, setValue] = useState('')
  const [speed, setSpeed] = useState(SPEED.CPS_5)
  const [playing, setPlaying] = useState(false)
  const [step, setStep] = useState(0)
  const [metadata, setMetadata] = useState(null)
  const [playerModel, setPlayerModel] = useState(null)
  const [positions, setPositions] = useState(null)

  useEffect(async () => {
    const playerModel = new MultiFileModel(modelsData, {speed})
    const models = await playerModel.getAllModels()
    const positions = buildPositions(models)
    setPlayerModel(playerModel)
    setPositions(positions)
  }, [modelsData]);

  useEffect(() => {
    if (positions) {
      updateContent(step)
    }
  }, [positions, step])

  const updateContent = async (step) => {
    const {fileName, position} = positions.get(step)
    try {
      const positionData = await playerModel.getDataForPosition(fileName, position)
      setValue(positionData.content)
      setMetadata(positionData.metadata)
      if (codePaybackEditorRef.current) {
        _.defer(() => {
          codePaybackEditorRef.current.clearSelection()
          const isInternal = positionData.metadata && positionData.metadata.modifiedBy === 'internal#reload'
          codePaybackEditorRef.current.deltaDecorations(isInternal ? [] : positionData.decorators.toJS())
          if (positionData.positionInfo) {
            const {position, scroll} = positionData.positionInfo
            codePaybackEditorRef.current.setPosition(position.toJS())
            codePaybackEditorRef.current.smartScrollToPosition(scroll.toJS())
          }
        })
      }
    } catch {}
  }

  useInterval(async () => {
    const newStep = step + 1
    const positionInfo = positions.get(newStep)
    if (!positionInfo) {
      setPlaying(false)
      return
    }
    setStep(newStep)
  }, playing ? 1000 / speed : null)

  const onPlayPause = () => {
    if (!playing && step + 1 >= positions.size) {
      onProgressChange(0)
    }
    setPlaying(!playing)
  }

  const onSpeedChange = (value) => {
    setSpeed(value)
    playerModel.setSpeed(value)
  }

  const onProgressChange = (value) => {
    setStep(value)
  }

  if (!playerModel || !positions) {
    return <div className='codePlaybackPlayer-loading'>Loading...</div>
  }

  const classes = `codePlaybackPlayer ${className}`
  return (
    <div className={classes}>
      <div className='codePlaybackPlayer-fileName'>{positions ? positions.get(step).fileName : ''}</div>
      <CodePlaybackEditor ref={codePaybackEditorRef} value={value} />
      <CodePlaybackMultiFileNavBar
        positions={positions}
        cases={cases}
        step={step}
        isPlaying={playing}
        speed={speed}
        stepMetadata={metadata}
        onPlayPause={onPlayPause}
        onSpeedChange={onSpeedChange}
        onProgressChange={onProgressChange}
      />
    </div>
  )
}

CodePlaybackPlayerMultiFile.propTypes = {
  modelsData: PropTypes.instanceOf(I.Map).isRequired,
  cases: PropTypes.instanceOf(I.List),
  className: PropTypes.string
}

export default CodePlaybackPlayerMultiFile
