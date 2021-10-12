import h from 'mithril/hyperscript'
import router from '../../router'

import i18n from '../../i18n'
import * as helper from '../helper'

import HomeCtrl from './HomeCtrl'

export function body(_ctrl: HomeCtrl) {
  return (
    h('div.homeOfflineWrapper', 
      h('div.home homeOffline',
        h('section.playOffline',
            h('h2', 'Chess Lines' /* i18n('playOffline') */),
            h('button.fatButton',
              { oncreate: helper.ontapY(() => router.set('/analyse/variant/standard')) }, 
              i18n('gameAnalysis'))
        ))))
}