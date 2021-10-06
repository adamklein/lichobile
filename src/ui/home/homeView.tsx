import h from 'mithril/hyperscript'
import router from '../../router'
import socket from '../../socket'

import { gameIcon, hasNetwork } from '../../utils'
import i18n, { plural, formatNumber } from '../../i18n'
import session from '../../session'
import { PongMessage, CorrespondenceSeek } from '../../lichess/interfaces'
import * as helper from '../helper'
import signals from '../../signals'
import MiniBoard from '../shared/miniBoard'
import TabNavigation from '../shared/TabNavigation'
import TabView from '../shared/TabView'
import newGameForm, { renderQuickSetup } from '../newGameForm'

import HomeCtrl from './HomeCtrl'
import playMachineForm from '../playMachineForm'

export function body(ctrl: HomeCtrl) {
  if (hasNetwork()) return online(ctrl)
  else return offline(ctrl)
}

function offline(ctrl: HomeCtrl) {
  const puzzleData = ctrl.offlinePuzzle
  const boardConf = puzzleData ? {
    fixed: true,
    fen: puzzleData.puzzle.fen,
    orientation: puzzleData.puzzle.color,
    link: () => router.set('/training'),
  } : null

  return (
    <div className={'homeOfflineWrapper' + (boardConf ? ' withBoard' : '')}>
      <div className="home homeOffline">
        <section className="playOffline">
          <h2>{i18n('playOffline')}</h2>
          <button className="fatButton" oncreate={helper.ontapY(() => router.set('/ai'))}>{i18n('playOfflineComputer')}</button>
          <button className="fatButton" oncreate={helper.ontapY(() => router.set('/otb'))}>{i18n('playOnTheBoardOffline')}</button>
        </section>
        { boardConf ?
        <section className="home__miniPuzzle">
          <h2 className="homeTitle">{i18n('puzzles')}</h2>
          {h(MiniBoard, boardConf)}
        </section> : undefined
        }
      </div>
    </div>
  )
}

function online(ctrl: HomeCtrl) {
  return (
    <div className="home">
      {renderLobby(ctrl)}
      {renderStart(ctrl)}
    </div>
  )
}

function renderStart(ctrl: HomeCtrl) {
  return (
    <div className="home__start">
      <div className="home__buttons">
        <button className="buttonMetal"
          oncreate={helper.ontapY(playMachineForm.open)}
        >
          {i18n('playWithTheMachine')}
        </button>
      </div>
      {h(Stats, { ctrl })}
    </div>
  )
}

const Stats = {
  oncreate({ attrs }) {
    const nbRoundSpread = spreadNumber(
      attrs.ctrl,
      '#nb_games_in_play > strong',
      8,
      socket.getCurrentPingInterval
    )
    const nbUserSpread = spreadNumber(
      attrs.ctrl,
      '#nb_connected_players > strong',
      10,
      socket.getCurrentPingInterval
    )
    this.render = (pong: PongMessage) => {
      nbUserSpread(pong.d)
      setTimeout(() => {
        nbRoundSpread(pong.r)
      }, socket.getCurrentPingInterval() / 2)
    }
    signals.homePong.add(this.render)
  },
  onremove() {
    signals.homePong.remove(this.render)
  },
  view() {
    return h('div.home__stats', [
      h('div#nb_connected_players', h.trust(i18n('nbPlayers:other', '<strong>?</strong>'))),
      h('div#nb_games_in_play', h.trust(i18n('nbGames:other', '<strong>?</strong>'))),
    ])
  }
} as Mithril.Component<{ ctrl: HomeCtrl }, { render: (p: PongMessage) => void }>

function spreadNumber(
  ctrl: HomeCtrl,
  selector: string,
  nbSteps: number,
  getDuration: () => number
): (nb: number, ons?: number) => void {
  let previous: number
  let displayed: string
  function display(el: HTMLElement | null, _prev: number, cur: number, _it: number) {
    const val = formatNumber(cur) // formatNumber(Math.round(((prev * (nbSteps - 1 - it)) + (cur * (it + 1))) / nbSteps))
    if (el && val !== displayed) {
      if (!ctrl.isScrolling) {
        el.textContent = val
        displayed = val
      }
    }
  }
  let timeouts: Array<number> = []
  return function(nb: number, overrideNbSteps?: number) {
    const el = document.querySelector(selector) as HTMLElement
    if (!el || (!nb && nb !== 0)) return
    if (overrideNbSteps) nbSteps = Math.abs(overrideNbSteps)
    timeouts.forEach(clearTimeout)
    timeouts = []
    const prev = previous === 0 ? 0 : (previous || nb)
    previous = nb
    const interv = Math.abs(getDuration() / nbSteps)
    for (let i = 0; i < nbSteps; i++) {
      timeouts.push(
        setTimeout(() => display(el, prev, nb, i), Math.round(i * interv))
      )
    }
  }
}

function renderLobby(ctrl: HomeCtrl) {
  const tabsContent = [
    { id: 'quick', f: () => renderQuickSetup(() => newGameForm.openRealTime('custom')) },
    { id: 'corres', f: () => renderCorresPool(ctrl) },
  ]

  return h('div.home__lobby', [
    h(TabNavigation, {
      buttons: [
        {
          label: i18n('quickPairing')
        },
        {
          label: i18n('correspondence')
        }
      ],
      selectedIndex: ctrl.selectedTab,
      onTabChange: ctrl.onTabChange,
      wrapperClass: 'homeSetup',
      withBottomBorder: true,
    }),
    h(TabView, {
      selectedIndex: ctrl.selectedTab,
      tabs: tabsContent,
      onTabChange: ctrl.onTabChange,
      className: 'home__setupTabView',
    }),
  ])
}

function renderCorresPool(ctrl: HomeCtrl) {
  return h('div.corresPoolWrapper.native_scroller', [
    h('table.corres_seeks', [
      h('thead', [
        h('tr', [
          h('th', ''),
          h('th', i18n('player')),
          h('th', i18n('rating')),
          h('th', i18n('time')),
          h('th', i18n('mode')),
        ]),
      ]),
      h('tbody', ctrl.corresPool.map(s => renderSeek(ctrl, s)))
    ]),
    h('div.corres_create', [
      h('button.defaultButton', {
        oncreate: helper.ontap(newGameForm.openCorrespondence)
      }, i18n('createAGame')),
    ]),
  ])
}

function renderSeek(ctrl: HomeCtrl, seek: CorrespondenceSeek) {
  const action = seek.username.toLowerCase() === session.getUserId() ?
    'cancelCorresSeek' :
    'joinCorresSeek'

  const icon = seek.color === '' ? 'random' :
      seek.color === 'white' ? 'white' : 'black'

  return h('tr', {
    key: 'seek' + seek.id,
    'id': seek.id,
    className: 'corres_seek ' + action,
    oncreate: helper.ontapY(() => ctrl[action](seek.id))
  }, [
    h('td', h('span.color-icon.' + icon)),
    h('td', seek.username),
    h('td', seek.rating + (seek.provisional ? '?' : '')),
    h('td', seek.days ? plural('nbDays', seek.days) : '∞'),
    h('td', h('span.withIcon', {
      'data-icon': gameIcon(seek.perf.key)
    }, i18n(seek.mode === 1 ? 'rated' : 'casual'))),
  ])
}

// function renderFeaturedTournaments(ctrl: HomeCtrl) {
//   if (ctrl.featuredTournaments?.length)
//     return (
//       <div className="home__tournament">
//         {renderTournamentList(ctrl.featuredTournaments)}
//       </div>
//     )
//   else
//     return null
// }

// function renderFeaturedStreamers(ctrl: HomeCtrl) {
//   if (ctrl.featuredStreamers?.length)
//     return h('ul.home__streamers', ctrl.featuredStreamers.map(s =>
//       h('li.home__streamer', {
//         oncreate: helper.ontapY(() => openExternalBrowser(s.url)),
//       }, [
//         h('strong[data-icon=]', (s.user.title ? s.user.title + ' ' : '') + s.user.name),
//         h('span.status', ' ' + s.status),
//       ])
//     ))
//   else
//     return null
// }

// function renderFeaturedGame(ctrl: HomeCtrl) {
//   const featured = ctrl.featuredGame
//   const boardConf = featured ? {
//     fixed: false,
//     fen: featured.fen,
//     orientation: featured.orientation,
//     lastMove: featured.lastMove,
//     link: () => {
//       router.set('/tv?channel=best')
//     },
//     gameObj: featured,
//   } : {
//     fixed: false,
//     orientation: 'white' as Color,
//     fen: emptyFen,
//   }

//   return (
//     <section className="home__featured">
//       {h(MiniBoard, boardConf)}
//     </section>
//   )
// }

// function renderDailyPuzzle(ctrl: HomeCtrl) {
//   const daily = ctrl.dailyPuzzle
//   const boardConf = daily && daily.puzzle && daily.game && daily.game.treeParts ? {
//     fixed: true,
//     fen: daily.game.treeParts.fen,
//     lastMove: daily.game.treeParts.uci,
//     orientation: daily.puzzle.color,
//     link: () => router.set(`/training/${daily.puzzle.id}?initFen=${daily.puzzle.fen}&initColor=${daily.puzzle.color}`),
//     topText: i18n('puzzleOfTheDay'),
//     bottomText: daily.puzzle.color === 'white' ? i18n('whitePlays') : i18n('blackPlays'),
//   } : {
//     fixed: true,
//     orientation: 'white' as Color,
//     fen: emptyFen,
//   }

//   return (
//     <section className="home__miniPuzzle">
//       {h(MiniBoard, boardConf)}
//     </section>
//   )
// }

// function renderTimeline(ctrl: HomeCtrl) {
//   const timeline = ctrl.timeline

//   if (timeline === undefined) {
//     return (
//       <section className="home__timeline loading">
//         {spinner.getVdom('monochrome')}
//       </section>
//     )
//   }

//   if (timeline.length === 0) {
//     return (
//       <section className="home__timeline">
//       </section>
//     )
//   }

//   return (
//     <section className="home__timeline">
//       <ul
//         oncreate={helper.ontapY(timelineOnTap, undefined, helper.getLI)}
//       >
//         { timeline.map(renderTimelineEntry)}
//       </ul>
//       <div className="more">
//         <button oncreate={helper.ontapY(() => router.set('/timeline'))}>
//           {i18n('more')} »
//         </button>
//       </div>
//     </section>
//   )
// }

