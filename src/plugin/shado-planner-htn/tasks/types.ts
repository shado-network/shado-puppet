import type { AppContext } from '../../../core/context/types'
import type { PuppetConfig, PuppetRuntime } from '../../../core/puppet/types'

export type HtnTask = {
  identifier: string
  conditions: {
    [key: string]: (props: ValueProps) => boolean
    // [key: string]: Promise<{ success: boolean; payload: any }>
  }
  effects: {
    [key: string]: {
      value: (props: ValueProps) => boolean
      trigger: (
        props: TriggerProps,
      ) => Promise<{ success: boolean; payload: any }>
    }
  }
  actions: {
    [key: string]: (
      props: TriggerProps,
    ) => Promise<{ success: boolean; payload: any }>
  }
}

export type GoalProps = {
  state: {
    [key: string]: any
  }
  _app: AppContext
  [key: string]: any
}

export type ValueProps = {
  state: {
    [key: string]: any
  }
  _app: AppContext
  [key: string]: any
}

export type TriggerProps = {
  puppetRuntime: PuppetRuntime
  puppetConfig: PuppetConfig
  state: {
    [key: string]: any
  }
  _app: AppContext
  [key: string]: any
}
