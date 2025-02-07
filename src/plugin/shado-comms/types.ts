export type ShadoCommsResponse = {
  status: 'success' | 'fail' | 'error'
  timestamp: number
  data: null | {
    message: string
    [key: string]: unknown
  }
}
