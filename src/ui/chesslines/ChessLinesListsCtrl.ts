import { ChessLinesLists } from "~/lichess/interfaces/ChessLines"
import redraw from "~/utils/redraw"

export default class ChessLinesListsCtrl {
  data: ChessLinesLists
  currentTab: number

  constructor(defaultTab?: number) {
    this.currentTab = defaultTab || 0
    const w: {name: string}[ ] = 'abcd'.split('').map((e) => { return {name: e} })
    const b: {name: string}[ ] = 'efgh'.split('').map((e) => { return {name: e} })
    this.data = {
      white: w,
      black: b
    }

    redraw()
  }

  onTabChange = (tabIndex: number) => {
    const loc = window.location.search.replace(/\?tab=\w+$/, '')
    try {
      window.history.replaceState(window.history.state, '', loc + '?tab=' + tabIndex)
    } catch (e) { console.error(e) }
    this.currentTab = tabIndex
    redraw()
  }
}