import { Icon as MDIcon, addCollection } from '@iconify-icon/react'

// all iconify icons can be found in https://github.com/iconify/icon-sets/tree/master/json

// mdi icons data - https://raw.githubusercontent.com/iconify/icon-sets/master/json/mdi.json

import icons from './iconify/mdi-icons.json'

addCollection(icons, 'mdi:')

export default MDIcon
