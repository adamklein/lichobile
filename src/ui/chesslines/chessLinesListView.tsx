import h from "mithril/hyperscript"
import { ChessLinesListItem } from "~/lichess/interfaces/ChessLines"
import TabNavigation from "../shared/TabNavigation"
import TabView from "../shared/TabView"
import ChessLinesListsCtrl from "./ChessLinesListsCtrl"
import newChessLineForm from "./newChessLineForm"
import * as helper from '../helper'


export function renderChessLinesLists(ctrl: ChessLinesListsCtrl) {
    if (!ctrl.data) return null
  
    const tabs = [
      {label: 'White'}, 
      {label: 'Black'}, 
    ]
    
    const tabsContent = [
      { id: 'w-lines', f: () => ctrl.data ? renderChessLinesList(ctrl.data.white) : null },
      { id: 'b-lines', f: () => ctrl.data ? renderChessLinesList(ctrl.data.black) : null  },
    ]
  
    return [
      h('div.tabs-nav-header.subHeader',
        h(TabNavigation, {
            buttons: tabs,
            selectedIndex: ctrl.currentTab,
            onTabChange: ctrl.onTabChange
        }),
      ),
      h( TabView, {
        selectedIndex: ctrl.currentTab,
        tabs: tabsContent,
        onTabChange: ctrl.onTabChange,
      })
    ]
  }
  
  
  function renderChessLinesList(list: ReadonlyArray<ChessLinesListItem>) {
    return h('ul.native_scroller.tournamentList', 
    {
      // oncreate: helper.ontapXY(onTournamentTap, undefined, helper.getLI)
    }, list.map(renderChessLinesListItem))
  }
  
  function renderChessLinesListItem(line: ChessLinesListItem, index: number) {
    const evenOrOdd = index % 2 === 0 ? ' even ' : ' odd '
  
    return (
      h('li.list_item tournament_item ' + evenOrOdd, {'data-id': line.name},
        h('div.tournamentListName',
          h('div.fullName', line.name)
        )
      )
    )
  }
  

  export function renderFooter() {
    return (
      <div className="actions_bar">
        <button className="action_create_button" oncreate={helper.ontap(newChessLineForm.open)}>
          <span className="fa fa-plus-circle" />
          Create a new line
        </button>
      </div>
    )
  }