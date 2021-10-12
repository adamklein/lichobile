import h from 'mithril/hyperscript'
import redraw from '~/utils/redraw'
import router from '../../router'
import popupWidget from '../shared/popup'
import ChessLinesListsCtrl from './ChessLinesListsCtrl'

let isOpen = false

export default {
  open,
  close,
  view(ctrl: ChessLinesListsCtrl) {
    return popupWidget(
      'tournament_form_popup',
      undefined,
      () => { 
        return renderForm(ctrl) 
      },
      isOpen,
      close
    )
  }
}

function open() {
  router.backbutton.stack.push(close)
  isOpen = true
}

function close(fromBB?: string) {
  if (fromBB !== 'backbutton' && isOpen) router.backbutton.stack.pop()
  isOpen = false
}


function renderForm(ctrl: ChessLinesListsCtrl) {
  return (
    <form id="chessLineCreateForm" class="tournamentForm" 
    onsubmit={(e: Event) => {
      e.preventDefault()
      return create(e.target as HTMLFormElement, ctrl)
    }}>
      <fieldset>
        <div className="tournamentFaq">
            Please choose a name for your chess line
        </div>
        <div className="select_input no_arrow_after">
          <div className="text_input_container">
            <label>Name</label>
            <input type="text"
              id="name"
              className="textField"
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck={false}
            />
          </div>
        </div>
      </fieldset>
      <div className="popupActionWrapper">
        <button className="popupAction" type="submit">
          <span className="fa fa-check" />
          Create line
        </button>
      </div>
    </form>
  )
}

function create(form: HTMLFormElement, ctrl: ChessLinesListsCtrl) {
  const elements: HTMLCollection = (form[0] as HTMLFieldSetElement).elements as HTMLCollection
  const name = (elements[0] as HTMLInputElement).value

  if (ctrl.currentTab === 0)
    ctrl.data.white.push({name: name})
  else
    ctrl.data.black.push({name: name})
  
  close()
  redraw()
}
