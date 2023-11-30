import * as I from 'immutable'

const CodePlaybackPosition = I.Record({
  fileName: '',
  date: null,
  position: 0
})

export const buildPositions = (models) => {
  return models.flatMap((model) => {
    const {filename, fileTimeline} = model
    return fileTimeline.timeline.map((item, position) => {
      return new CodePlaybackPosition({
        fileName: filename,
        date: item.modified,
        position
      })
    })
  })
    .sortBy(item => item.date)
}
