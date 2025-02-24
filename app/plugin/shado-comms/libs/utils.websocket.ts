import type WebSocket from 'ws'

export const broadcast = (
  clients: { [key: string]: WebSocket },
  data: string,
  isBinary: boolean,
) => {
  Object.keys(clients).forEach((clientId) => {
    clients[clientId].send(data as any, { binary: isBinary })
  })
}
