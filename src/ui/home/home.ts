import { safeStringToNum } from '../../utils'
import * as helper from '../helper'
import layout from '../layout'
import { dropShadowHeader } from '../shared/common'

import ChessLinesListsCtrl from '../chesslines/ChessLinesListsCtrl'
import { renderChessLinesLists, renderFooter } from '../chesslines/chessLinesListView'
import newChessLineForm from '../chesslines/newChessLineForm'

// import i18n from '~/i18n'
// import router from '~/router'

interface Attrs {
  tab?: string
}

interface State {
  ctrl: ChessLinesListsCtrl
}

export default {
  oninit({ attrs }) {
    this.ctrl = new ChessLinesListsCtrl(safeStringToNum(attrs.tab))
  },

  oncreate: helper.viewFadeIn,

  onremove() {
    // this.ctrl.unload()
  },

  view() {
   
    return layout.free(
      dropShadowHeader('Chess Lines'),
      renderChessLinesLists(this.ctrl),
      renderFooter(),
      newChessLineForm.view(this.ctrl),
    )
  }
} as Mithril.Component<Attrs, State>
