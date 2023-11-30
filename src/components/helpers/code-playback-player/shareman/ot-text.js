import _ from 'lodash'

const text = {}

text.apply = function (snapshot, op) {
  for (let i = 0; i < op.length; i++) {
    const component = op[i]
    if (_.isString(component.i)) {
      snapshot =
        snapshot.slice(0, component.p) +
        component.i +
        snapshot.slice(component.p)
    } else {
      snapshot =
        snapshot.slice(0, component.p) +
        snapshot.slice(component.p + component.d)
    }
  }
  return snapshot
}

function transformInsertPosition(pos, op, insertAfter) {
  if (op.p < pos || (op.p === pos && insertAfter)) {
    return pos + op.i.length
  }
  return pos
}

function transformDeletePosition(pos, op) {
  if (pos <= op.p) {
    return pos
  }
  if (pos <= op.p + op.d) {
    return op.p
  }
  return pos - op.d
}

function transformPosition(pos, op, insertAfter) {
  if (_.isString(op.i)) {
    return transformInsertPosition(pos, op, insertAfter)
  }

  return transformDeletePosition(pos, op)
}

function transformInsert(op, otherOp, insertAfter) {
  return [{ i: op.i, p: transformPosition(op.p, otherOp, insertAfter) }]
}

function transformDeleteVsInsert(op, otherOp) {
  if (op.p >= otherOp.p) {
    return [{ p: transformPosition(op.p, otherOp), d: op.d }]
  }

  if (op.p + op.d <= otherOp.p) {
    return [{ d: op.d, p: op.p }]
  }

  const leftPartLen = otherOp.p - op.p
  const rightPartLen = op.d - leftPartLen

  return [
    { p: op.p, d: leftPartLen },
    { p: otherOp.p + otherOp.i.length - leftPartLen, d: rightPartLen }
  ]
}

function transformDeleteVsDelete(op, otherOp) {
  if (op.p >= otherOp.p + otherOp.d) {
    return [{ d: op.d, p: op.p - otherOp.d }]
  }

  if (op.p + op.d <= otherOp.p) {
    return [{ d: op.d, p: op.p }]
  }

  if (op.p >= otherOp.p && op.p + op.d <= otherOp.p + otherOp.d) {
    return []
  }

  const len = op.p + op.d - (otherOp.p + otherOp.d)
  return [{ p: transformPosition(op.p, otherOp), d: len }]
}

function transform(op, otherOp, insertAfter) {
  // insert op
  if (_.isString(op.i)) {
    return transformInsert(op, otherOp, insertAfter)
  }

  // delete vs insert
  if (_.isString(otherOp.i)) {
    return transformDeleteVsInsert(op, otherOp)
  }

  // delete vs delete
  return transformDeleteVsDelete(op, otherOp)
}

text.transform = transform
text.isNormalizeError = function (error) {
  return _.includes(error, 'need normalize to')
}

export default text
