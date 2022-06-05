"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withStomp = exports.StompEventTypes = void 0;

var _react = _interopRequireDefault(require("react"));

var _eventemitter = _interopRequireDefault(require("eventemitter3"));

var _sockjsClient = _interopRequireDefault(require("sockjs-client"));

var _stompjs = require("@stomp/stompjs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

// Stomp client
var _stompClient = null;
var logger = {
  log: function log(str) {}
};
var stompEvent = new _eventemitter["default"](); // WebSocketError is more reliable on detecting the connection lost

var StompEventTypes = {
  Connect: 0,
  Disconnect: 1,
  Error: 2,
  WebSocketClose: 3,
  WebSocketError: 4
};
exports.StompEventTypes = StompEventTypes;

var newStompClient = function newStompClient(url, headers) {
  logger.log('Stomp trying to connect', headers); // let socket = SockJS(url)

  _stompClient = new _stompjs.Client({
    brokerURL: url,
    connectHeaders: headers,
    debug: function debug(str) {
      logger.log(str);
    },
    reconnectDelay: 500,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    logRawCommunication: false,
    webSocketFactory: function webSocketFactory() {
      return (0, _sockjsClient["default"])(url); // return new WebSocket('https://bddev.teamnoteapp.com:40007/')
    },
    onStompError: function onStompError(frame) {
      logger.log('Stomp Error', frame);
      stompEvent.emit(StompEventTypes.Error, frame);
    },
    onConnect: function onConnect(frame) {
      logger.log('Stomp Connect', frame);
      stompEvent.emit(StompEventTypes.Connect, frame);
    },
    onDisconnect: function onDisconnect(frame) {
      logger.log('Stomp Disconnect', frame);
      stompEvent.emit(StompEventTypes.Disconnect, frame);
    },
    onWebSocketClose: function onWebSocketClose(frame) {
      logger.log('Stomp WebSocket Closed', frame);
      stompEvent.emit(StompEventTypes.WebSocketClose, frame);
    },
    onWebSocketError: function onWebSocketError(frame) {
      logger.log('Stomp WebSocket Error', frame);
      stompEvent.emit(StompEventTypes.WebSocketError, frame);
    }
  });

  _stompClient.activate();

  return _stompClient;
};

var removeStompClient = function removeStompClient() {
  if (_stompClient) {
    logger.log('Stomp trying to disconnect');

    _stompClient.deactivate();

    _stompClient = null;
  }
};

var addStompEventListener = function addStompEventListener(eventType, emitted, context, isOnce) {
  if (isOnce) {
    stompEvent.once(eventType, emitted, context);
  } else {
    stompEvent.on(eventType, emitted, context);
  }
};

var removeStompEventListener = function removeStompEventListener(eventType, emitted, context) {
  stompEvent.removeListener(eventType, emitted, context);
};

var getStompClient = function getStompClient() {
  return _stompClient;
}; // React Context and our functions


var stompContext = {
  getStompClient: getStompClient,
  newStompClient: newStompClient,
  removeStompClient: removeStompClient,
  addStompEventListener: addStompEventListener,
  removeStompEventListener: removeStompEventListener
};

var withStomp = function withStomp(Component) {
  return function (props) {
    return /*#__PURE__*/_react["default"].createElement(Component, _extends({
      stompContext: stompContext
    }, props));
  };
}; // Exports


exports.withStomp = withStomp;