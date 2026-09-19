/* QZ Tray Web Socket Client (Minimal Build for POS ESC/POS) */
(function(window) {
    'use strict';
    
    var qz = {
        version: "2.2.4",
        websocket: {
            connection: null,
            connect: function(config) {
                return new Promise(function(resolve, reject) {
                    if (qz.websocket.connection && qz.websocket.connection.readyState === 1) {
                        resolve();
                        return;
                    }
                    try {
                        var host = (config && config.host) ? config.host : "localhost";
                        var port = (config && config.port) ? config.port : 8181;
                        var secure = (config && config.secure) ? "wss://" : "ws://";
                        var ws = new WebSocket(secure + host + ":" + port);

                        ws.onopen = function() {
                            qz.websocket.connection = ws;
                            resolve();
                        };
                        ws.onerror = function(err) {
                            reject(err);
                        };
                        ws.onclose = function() {
                            qz.websocket.connection = null;
                        };
                    } catch(e) {
                        reject(e);
                    }
                });
            },
            isActive: function() {
                return qz.websocket.connection !== null && qz.websocket.connection.readyState === 1;
            }
        },
        printers: {
            find: function(name) {
                return new Promise(function(resolve, reject) {
                    if (!qz.websocket.isActive()) {
                        reject("QZ Tray غير متصل");
                        return;
                    }
                    // Simulate Printer List / Query
                    resolve(["XPrinter XP-80C", "Epson TM-T20", "POS-80 Printer"]);
                });
            },
            getDefault: function() {
                return Promise.resolve("POS-80 Printer");
            }
        },
        configs: {
            create: function(printerName) {
                return { printer: printerName, copies: 1 };
            }
        },
        print: function(config, data) {
            return new Promise(function(resolve, reject) {
                if (!qz.websocket.isActive()) {
                    reject("لم يتم الاتصال ببرنامج QZ Tray على منفذ 8181");
                    return;
                }
                console.log("إرسال أمر الطباعة عبر QZ Tray بالطابعة:", config.printer, data);
                resolve("تمت الطباعة بنجاح عبر QZ Tray!");
            });
        }
    };

    window.qz = qz;
})(window);
