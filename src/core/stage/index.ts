import type { CoreLogger } from '../../plugin/core-logger/index.ts'
import type { StageDefinition } from '../types/stage.ts'

export class Stage {
  stageId: string
  stageDefinition: StageDefinition

  _logger: CoreLogger

  constructor(stageId: string, _logger: CoreLogger) {
    this._logger = _logger

    this.stageId = stageId
    this._init()
  }

  _init = async () => {
    try {
      this.stageDefinition = await this._loadStageDefinition()
    } catch (error) {
      this._logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.stageId,
        message: `Error in stage initialization`,
        payload: { error },
      })
    }
  }

  _loadStageDefinition = async () => {
    this._logger.send({
      type: 'INFO',
      source: 'STAGE',
      stageId: this.stageId,
      message: `Loading stage definition for "${this.stageId}"`,
    })

    const stage = await import(`../../../include/stage/${this.stageId}.ts`)
    const stageDefinition = stage.default

    this._logger.send({
      type: 'SUCCESS',
      source: 'STAGE',
      stageId: this.stageId,
      message: `Loaded stage definition for "${this.stageId}"`,
    })

    return stageDefinition
  }
}
