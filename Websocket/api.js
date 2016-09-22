/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */
(function(WebsocketServer) {
  'use strict';

  var wss;
  var Users = 0;
  var USERS = {value:[], push: function (v) {
    this.value.push(v)
  },   del: function (v) {
    this.value.splice(v, 1);
  }};
  function userLeft(user){
    var x = 0;
    for(x;x<USERS.value.length; x++){
      if(USERS.value[x] == user){USERS.del(x)}
    }
  }
  // See http://os.js.org/doc/tutorials/application-with-server-api.html
  module.exports.test = function(args, callback, request, response) {
    callback(false, 'test');
  };

  // This is called whenever the HTTP server starts up
  module.exports._onServerStart = function(server, instance, metadata) {
    wss = new WebsocketServer({server: server, port: 8001});
    
    wss.broadcast = function broadcast(data) {
      wss.clients.forEach(function each(client) {
        client.send(data);
      });
    };

    wss.on('connection', function(ws) {
      var userNam = "";
      console.log('!!!', 'WS', 'Opened connection');
      ws.send(JSON.stringify({action:"joined"}));
      ws.on('message', function(data, flags) {
        data = JSON.parse(data);
        console.log('!!!', 'WS', 'Message', data, flags);

        switch ( data.action){
            case("message"):
              wss.broadcast(JSON.stringify({action:"message", from:data.from, to:data.to, message:data.message}));
            break;
            case("join"):
              userNam = data.USER;
              Users+=1;
              USERS.push(data.USER);
              wss.broadcast(JSON.stringify({action:"join", USER:data.USER, USERS:USERS.value, tot:Users}));
            break;
        }
      });

      ws.on('close', function() {
        console.log('!!!', 'WS', 'closed connection');
        Users-=1;
        userLeft(userNam);
        wss.broadcast(JSON.stringify({action:"left", USER:userNam, USERS:USERS.value, tot:Users}));
      });
    });

    console.log('!!!', 'Websockets Initialized on port', metadata.config.port);
  };

})(require('ws').Server);

