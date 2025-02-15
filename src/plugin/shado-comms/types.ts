export type ShadoCommsResponse = {
  status: 'success' | 'fail' | 'error'
  timestamp: number
  data:
    | undefined
    | {
        message: string
        [key: string]: unknown
      }
}
