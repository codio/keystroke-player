import React from 'react'

const PlainButton = (props) => {
  const classname = `plainButton ${props.className}`
  const {className, children, ...htmlProps} = props
  return (
    <button type='button' {...htmlProps} className={classname}>
      {children}
    </button>
  )
}
export default PlainButton
