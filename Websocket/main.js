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
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';
  function cleanArr(arr, currentU){
   var x = 0;
   var y = 0;
    for(x;x < arr.length;x++){if(arr[x] == OSjs.Core.getHandler().getUserData().username){arr[x] = ("<a style=\"color:blue;cursor:pointer;\" onclick=\"this.parentNode.parentNode.childNodes[1].value = \'" + OSjs.Core.getHandler().getUserData().username + "\'\">" + "me" + "</a>")}}
   for(y;y < arr.length;y++){arr[y] = ("<a style=\"color:blue;cursor:pointer;\" onclick=\"this.parentNode.parentNode.childNodes[1].value = this.innerHTML\">" + arr[y] + "</a>")}
   return(arr.toString().replace(",", "/"));
  }
  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationWebsocketWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationWebsocketWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 200,
      height: 100
    }, app, scheme]);
  }

  ApplicationWebsocketWindow.prototype = Object.create(Window.prototype);
  ApplicationWebsocketWindow.constructor = Window.prototype;

  ApplicationWebsocketWindow.prototype.init = function(wmRef, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    scheme.render(this, 'WebsocketWindow', root);

    this._find('Button').son('click', this, this.onClick);

    return root;
  };

  ApplicationWebsocketWindow.prototype.onClick = function() {
    this._app.send({action: 'message', from:OSjs.Core.getHandler().getUserData().username, to:document.getElementById("to").value, message:document.getElementById("message").value});
  };

  ApplicationWebsocketWindow.prototype.onMessage = function(data) {
   switch(data.action){
    case("message"):
    if(data.to == OSjs.Core.getHandler().getUserData().username || data.to == "!all"){
      OSjs.API.createDialog('Alert', {'title':'messageAlert', 'message':("Message from " + data.from + ": " +                 data.message)}, function(ev, button, res){console.log(res)});
    }
    break;
    case("joined"):
     this._app.send({action: 'join', USER:OSjs.Core.getHandler().getUserData().username})
    break;
    case("join"):
     document.getElementById("usersDiv").innerHTML = ("Joined users(" + (data.tot) + "): " + cleanArr(data.USERS, data.USER));
     if(data.USER != OSjs.Core.getHandler().getUserData().username){OSjs.API.createDialog('Alert', {'title':'joinAlert', 'message':(data.USER + " joined!")}, function(ev, button, result){console.log(result)})}
    break;
    case("left"):
      document.getElementById("usersDiv").innerHTML = ("Joined users(" + (data.tot) + "): " + cleanArr(data.USERS, data.USER));
      if(data.USER != OSjs.Core.getHandler().getUserData().username){OSjs.API.createDialog('Alert', {'title':'leftAlert', 'message':(data.USER + " left!")}, function(ev, button, res){console.log(res)})}
    break;
   }
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationWebsocket(args, metadata) {
    Application.apply(this, ['ApplicationWebsocket', args, metadata]);

    this.websocket = null;
  }

  ApplicationWebsocket.prototype = Object.create(Application.prototype);
  ApplicationWebsocket.constructor = Application;

  ApplicationWebsocket.prototype.destroy = function() {
    if ( this.websocket ) {
      this.websocket.close();
    }
    this.websocket = null;

    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationWebsocket.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);
    var self = this;
    var url = 'ws' + (window.location.protocol === 'https:' ? 's' : '') + '://' + window.location.hostname + ':' + metadata.config.port;

    this._loadScheme('./scheme.html', function(scheme) {
      var win = self._addWindow(new ApplicationWebsocketWindow(self, metadata, scheme));

      self.websocket = new WebSocket(url);
      
      
     
      
      
      self.websocket.onmessage = function(ev) {
        win.onMessage(JSON.parse(ev.data));
      };
    });
  };



  ApplicationWebsocket.prototype.send = function(data) {
    if ( this.websocket ) {
      this.websocket.send(JSON.stringify(data));
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationWebsocket = OSjs.Applications.ApplicationWebsocket || {};
  OSjs.Applications.ApplicationWebsocket.Class = Object.seal(ApplicationWebsocket);

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
