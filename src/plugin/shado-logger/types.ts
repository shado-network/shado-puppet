export type LogMessage = {
  type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO' | 'LOG' | 'SANDBOX'
  source: 'SERVER' | 'PLAY' | 'PUPPET' | 'AGENT' | 'USER'
  playId?: string
  puppetId?: string
  userId?: string
  message: string
  payload?: null | unknown
}
