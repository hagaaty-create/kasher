/* QZ Tray Helper Wrapper - Safe Offline / Client Fallback */
(function(window) {
    'use strict';
    
    var qz = {
        version: "2.2.4",
        websocket: {
            connection: null,
            connect: function(config) {
                return new Promise(function(resolve, reject) {
                    // Fail gracefully so script execution is never blocked
                    setTimeout(function() {
                        reject("QZ Tray Offline Fallback");
                    }, 50);
                });
            },
            isActive: function() {
                return false;
            }
        },
        printers: {
            find: function(name) {
                return Promise.resolve(["XPrinter XP-80C", "Epson TM-T20", "POS-80 Printer"]);
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
            return Promise.reject("QZ Tray Offline");
        }
    };

    window.qz = qz;
})(window);
