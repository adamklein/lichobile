import { Capacitor, Plugins } from '@capacitor/core'

interface IStockfishPlugin {
  getMaxMemory(): Promise<{ value: number }>
  start(): Promise<void>
  cmd(options: { cmd: string }): Promise<void>
  exit(): Promise<void>
}

const CapacitorStockfish = Plugins.Stockfish as IStockfishPlugin
const StockfishWeb = Plugins.StockfishWeb as IStockfishPlugin 

export class StockfishPlugin {
  private plugin: IStockfishPlugin

  constructor() {
    this.plugin = Capacitor.platform === 'web' ? StockfishWeb : CapacitorStockfish
  }

  public async start(): Promise<{ engineName: string }> {
    return new Promise((resolve) => {
      let engineName = 'Stockfish'
      const listener = (e: Event) => {
        const line = (e as any).output
        console.debug('[stockfish >> ] ' + line)
        if (line.startsWith('id name ')) {
          engineName = line.substring('id name '.length)
        }
        if (line.startsWith('uciok')) {
          window.removeEventListener('stockfish', listener, false)
          resolve({ engineName })
        }
      }
      window.addEventListener('stockfish', listener, { passive: true })
      this.plugin.start()
      .then(() => this.send('uci'))
    })
  }

  public isReady(): Promise<void> {
    return new Promise((resolve) => {
      const listener = (e: Event) => {
        const line = (e as any).output
        if (line.startsWith('readyok')) {
          window.removeEventListener('stockfish', listener, false)
          resolve()
        }
      }
      window.addEventListener('stockfish', listener, { passive: true })
      this.send('isready')
    })
  }

  public send(text: string): Promise<void> {
    console.debug('[stockfish <<] ' + text)
    return this.plugin.cmd({ cmd: text })
  }

  public setOption(name: string, value: string | number | boolean): Promise<void> {
    return this.send(`setoption name ${name} value ${value}`)
  }

  public exit(): Promise<void> {
    return this.plugin.exit()
  }
}

export async function getMaxMemory(): Promise<number> {
  return Promise.resolve(window.deviceInfo.stockfishMaxMemory)
}

export function getNbCores(): number {
  const cores = window.deviceInfo.cpuCores
  return cores > 2 ? cores - 1 : 1
}
