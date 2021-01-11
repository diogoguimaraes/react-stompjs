import React from 'react'

import EventEmitter from 'eventemitter3'

import SockJS from 'sockjs-client'
import {Client} from '@stomp/stompjs'

if (typeof TextEncoder !== 'function') {
    const TextEncodingPolyfill = require('text-encoding')
    TextEncoder = TextEncodingPolyfill.TextEncoder
    TextDecoder = TextEncodingPolyfill.TextDecoder
}

// Stomp client
let _stompClient = null

const logger = {
    log: (str) => {}
}
const stompEvent = new EventEmitter()

// WebSocketError is more reliable on detecting the connection lost
const StompEventTypes = {
    Connect: 0,
    Disconnect: 1,
    Error: 2,
    WebSocketClose: 3,
    WebSocketError: 4,
}

const newStompClient = (url, headers) => {
    logger.log('Stomp trying to connect', headers)

    // let socket = SockJS(url)
    _stompClient = new Client({
        brokerURL: url,
        connectHeaders: headers,
        debug: (str) => {
            logger.log(str)
        },
        reconnectDelay: 500,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        logRawCommunication: false,
        webSocketFactory: () => {
            return SockJS(url)
            // return new WebSocket('https://bddev.teamnoteapp.com:40007/')
        },
        onStompError: (frame) => {
            logger.log('Stomp Error', frame)
            stompEvent.emit(StompEventTypes.Error, frame)
        },
        onConnect: (frame) => {
            logger.log('Stomp Connect', frame)
            stompEvent.emit(StompEventTypes.Connect, frame)
        },
        onDisconnect: (frame) => {
            logger.log('Stomp Disconnect', frame)
            stompEvent.emit(StompEventTypes.Disconnect, frame)
        },
        onWebSocketClose: (frame) => {
            logger.log('Stomp WebSocket Closed', frame)
            stompEvent.emit(StompEventTypes.WebSocketClose, frame)
        },
        onWebSocketError: (frame) => {
            logger.log('Stomp WebSocket Error', frame)
            stompEvent.emit(StompEventTypes.WebSocketError, frame)
        },
    })

    _stompClient.activate()

    return _stompClient
}

const removeStompClient = () => {
    if(_stompClient) {
        logger.log('Stomp trying to disconnect')
        _stompClient.deactivate()

        _stompClient = null
    }
}

const addStompEventListener = (eventType, emitted, context, isOnce) => {
    if (isOnce) {
        stompEvent.once(eventType, emitted, context)
    } else {
        stompEvent.on(eventType, emitted, context)
    }
}

const removeStompEventListener = (eventType, emitted, context) => {
    stompEvent.removeListener(eventType, emitted, context)
}

const getStompClient = () => {
    return _stompClient
}

// React Context and our functions
const stompContext = {
    getStompClient, newStompClient, removeStompClient, addStompEventListener, removeStompEventListener
}

const withStomp = (Component) => (
    (props) => <Component stompContext={stompContext} {...props} />
)

// Exports
export {StompEventTypes, withStomp}
