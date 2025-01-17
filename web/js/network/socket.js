/**
 * WebSocket connection module.
 *
 *  Needs init() call.
 *
 * @version 1
 */
const socket = (() => {
  // TODO: this ping is for maintain websocket state
  /*
        https://tools.ietf.org/html/rfc6455#section-5.5.2

        Chrome doesn't support
            https://groups.google.com/a/chromium.org/forum/#!topic/net-dev/2RAm-ZYAIYY
            https://bugs.chromium.org/p/chromium/issues/detail?id=706002

        Firefox has option but not enable 'network.websocket.timeout.ping.request'

        Suppose ping message must be sent from WebSocket Server.
        Gorilla WS doesnot support it.
        https://github.com/gorilla/websocket/blob/5ed622c449da6d44c3c8329331ff47a9e5844f71/examples/filewatch/main.go#L104

        Below is high level implementation of ping.
        // TODO: find the best ping time, currently 2 seconds works well in Chrome+Firefox
    */
  const pingIntervalMs = 2000; // 2 secs
  // const pingIntervalMs = 1000 / 5; // too much

  let conn;
  let curPacketId = "";

  const connect = (protocol, addr) => {
    // const params = new URLSearchParams({room_id: roomId, zone: zone}).toString()
    // const address = `${location.protocol !== 'https:' ? 'ws' : 'wss'}://${location.host}/ws`;
    const address = `${protocol !== "https:" ? "ws" : "wss"}://${addr}`;
    console.info(`[ws] connecting to ${address}`);
    conn = new WebSocket(address);

    // Clear old roomID
    conn.onopen = () => {
      log.info("[ws] <- open connection");
      log.info(`[ws] -> setting ping interval to ${pingIntervalMs}ms`);
      // !to add destructor if SPA
      setInterval(ping, pingIntervalMs);
    };
    conn.onerror = (error) => log.error(`[ws] ${error}`);
    conn.onclose = () => log.info("[ws] closed");
    // Message received from server
    conn.onmessage = (response) => {
      const data = JSON.parse(response.data);
      const message = data.type;

      if (message !== "heartbeat")
        log.debug(`[ws] <- message '${message}' `, data);

      switch (message) {
        case "init":
          event.pub(MEDIA_STREAM_INITIALIZED, { stunturn: data.data });
          break;
        case "offer":
          // this is offer from worker
          event.pub(MEDIA_STREAM_SDP_AVAILABLE, { sdp: data.data });
          break;
        case "candidate":
          event.pub(MEDIA_STREAM_CANDIDATE_ADD, { candidate: data.data });
          break;
        case "heartbeat":
          event.pub(PING_RESPONSE);
          break;
        case "checkLatency":
          curPacketId = data.packet_id;
          const addresses = data.data.split(",");
          event.pub(LATENCY_CHECK_REQUESTED, {
            packetId: curPacketId,
            addresses: addresses,
          });
        case "CHAT":
          event.pub(CHAT, { chatrow: data.data });
          break;
        case "NUMPLAYER":
          event.pub(NUM_PLAYER, { numplayers: data.data });
          break;
        case "INIT":
          event.pub(CLIENT_INIT, { data: data.data });
          break;
        case "UPDATEAPPLIST":
          event.pub(UPDATE_APP_LIST, { data: data.data });
          break;
      }
    };
  };

  // TODO: format the package with time
  const ping = () => {
    const time = Date.now();
    send({ id: "heartbeat", data: time.toString() });
    event.pub(PING_REQUEST, { time: time });
  };
  const send = (data) => conn.send(JSON.stringify(data));
  const latency = (workers, packetId) =>
    send({
      id: "checkLatency",
      data: JSON.stringify(workers),
      packet_id: packetId,
    });
  // const start = (appName, isMobile) =>
  //   send({
  //     id: "start",
  //     data: JSON.stringify({
  //       app_name: gameName,
  //       is_mobile: isMobile,
  //     }),
  //   });
  // const quit = (roomId) => send({"id": "quit", "data": "", "room_id": roomId});

  return {
    send: send,
    latency: latency,
    // start: start,
    connect: connect,
    // quit: quit,
  };
})($, event, log);
