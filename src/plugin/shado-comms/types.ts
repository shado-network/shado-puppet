export type ShadoCommsHttpResponse = {
  status: 'success' | 'fail' | 'error'
  timestamp: number
  data:
    | undefined
    | {
        message: string
        [key: string]: unknown
      }
}

export type ShadoCommsWsResponse = {
  timestamp: number
  source: string
  data: {
    identifier: string
    [key: string]: unknown
  }
}
