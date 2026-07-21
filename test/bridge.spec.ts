import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createServer as createHttpServer } from 'node:http'
import { createServer as createNetServer } from 'node:net'
import type { Server as HttpServer } from 'node:http'
import type { Server as NetServer, AddressInfo } from 'node:net'
import { Aedes } from 'aedes'
import { io as ioc } from 'socket.io-client'
import type { Socket as ClientSocket } from 'socket.io-client'
import { createMqttBridge } from '../server/utils/mqttBridge'

const AUTH_TOKEN = 'test-secret'

let aedes: Aedes
let mqttServer: NetServer
let mqttPort: number
let httpServer: HttpServer
let httpPort: number
let bridge: ReturnType<typeof createMqttBridge>

function connectClient(auth?: { token: string }): ClientSocket {
  return ioc(`http://localhost:${httpPort}`, {
    auth,
    transports: ['websocket'],
    reconnection: false,
  })
}

function waitForEvent<T>(socket: ClientSocket, event: string, timeoutMs = 3000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), timeoutMs)
    socket.once(event, (data: T) => {
      clearTimeout(timer)
      resolve(data)
    })
  })
}

beforeAll(async () => {
  aedes = await Aedes.createBroker()
  mqttServer = createNetServer(aedes.handle)
  await new Promise<void>((resolve) => mqttServer.listen(0, resolve))
  mqttPort = (mqttServer.address() as AddressInfo).port

  httpServer = createHttpServer()
  await new Promise<void>((resolve) => httpServer.listen(0, resolve))
  httpPort = (httpServer.address() as AddressInfo).port

  bridge = createMqttBridge({
    brokerUrl: `mqtt://localhost:${mqttPort}`,
    corsOrigins: ['*'],
    authToken: AUTH_TOKEN,
  })
  bridge.connectMqtt()
  bridge.attach(httpServer)

  // Wait for the bridge's MQTT client to be connected to aedes
  await new Promise<void>((resolve) => {
    aedes.on('client', () => resolve())
  })
})

afterAll(async () => {
  bridge.close()
  await new Promise<void>((resolve) => httpServer.close(() => resolve()))
  await new Promise<void>((resolve) => aedes.close(resolve))
  await new Promise<void>((resolve) => mqttServer.close(() => resolve()))
})

describe('mqtt bridge', () => {
  it('rejects a handshake without the auth token', async () => {
    const client = connectClient()
    const err = await waitForEvent<Error>(client, 'connect_error')
    expect(err.message).toBe('unauthorized')
    client.disconnect()
  })

  it('accepts a handshake with the auth token and reports broker status', async () => {
    const client = connectClient({ token: AUTH_TOKEN })
    const status = await waitForEvent<{ connected: boolean }>(client, 'mqtt-status')
    expect(status.connected).toBe(true)
    client.disconnect()
  })

  it('forwards broker messages to subscribers, including wildcard matches', async () => {
    const client = connectClient({ token: AUTH_TOKEN })
    await waitForEvent(client, 'connect')
    client.emit('mqtt-subscribe', { topic: 'muh/portal/+/json' })

    // Give the bridge time to register the MQTT subscription with aedes
    await new Promise((resolve) => setTimeout(resolve, 200))

    const received = waitForEvent<{ topic: string; message: string }>(client, 'mqtt-message')
    aedes.publish(
      { cmd: 'publish', topic: 'muh/portal/G/json', payload: Buffer.from('{"state":1}'), qos: 0, retain: false, dup: false },
      () => {},
    )

    const msg = await received
    expect(msg.topic).toBe('muh/portal/G/json')
    expect(msg.message).toBe('{"state":1}')
    client.disconnect()
  })

  it('publishes client messages to the broker with qos/retain forwarded', async () => {
    const client = connectClient({ token: AUTH_TOKEN })
    await waitForEvent(client, 'connect')

    const published = new Promise<{ topic: string; payload: string; qos: number }>((resolve) => {
      aedes.subscribe(
        'muh/alarm/set',
        (packet, done) => {
          done()
          resolve({ topic: packet.topic, payload: packet.payload.toString(), qos: packet.qos })
        },
        () => {},
      )
    })

    client.emit('mqtt-publish', { topic: 'muh/alarm/set', payload: 'ARM_AWAY', qos: 1 })

    const packet = await published
    expect(packet.topic).toBe('muh/alarm/set')
    expect(packet.payload).toBe('ARM_AWAY')
    expect(packet.qos).toBe(1)
    client.disconnect()
  })

  it('replays cached messages to late subscribers', async () => {
    // Seed the cache: a subscribed topic must exist for messages to arrive
    const first = connectClient({ token: AUTH_TOKEN })
    await waitForEvent(first, 'connect')
    first.emit('mqtt-subscribe', { topic: 'muh/wst/data/B327' })
    await new Promise((resolve) => setTimeout(resolve, 200))

    const firstMsg = waitForEvent(first, 'mqtt-message')
    aedes.publish(
      { cmd: 'publish', topic: 'muh/wst/data/B327', payload: Buffer.from('{"temp_c":21}'), qos: 0, retain: false, dup: false },
      () => {},
    )
    await firstMsg

    // Late subscriber gets the cached value immediately
    const second = connectClient({ token: AUTH_TOKEN })
    await waitForEvent(second, 'connect')
    const replay = waitForEvent<{ topic: string; message: string }>(second, 'mqtt-message')
    second.emit('mqtt-subscribe', { topic: 'muh/wst/data/B327' })

    const msg = await replay
    expect(msg.message).toBe('{"temp_c":21}')

    first.disconnect()
    second.disconnect()
  })

  it('rejects mqtt-configure when reconfiguration is disabled', async () => {
    const client = connectClient({ token: AUTH_TOKEN })
    await waitForEvent(client, 'connect')

    const errPromise = waitForEvent<{ error: string }>(client, 'mqtt-error')
    client.emit('mqtt-configure', { server: 'mqtt://evil.example:1883' })

    const err = await errPromise
    expect(err.error).toContain('disabled')
    client.disconnect()
  })
})
