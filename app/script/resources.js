'use strict';
var JayWalker;
(function (JayWalker) {
    var Resources;
    (function (Resources) {
        var resourceCache = {};
        function _preload(url) {
            return new Promise(function (resolve, reject) {
                if (resourceCache[url]) {
                    resolve(resourceCache[url]);
                }
                else {
                    var img_1 = new Image();
                    img_1.onerror = function () {
                        reject();
                    };
                    img_1.onload = function () {
                        resourceCache[url] = img_1;
                        resolve(img_1);
                    };
                    resourceCache[url] = null;
                    img_1.src = url;
                }
            });
        }
        function preload(value) {
            return new Promise(function (resolve, reject) {
                var promises = [];
                if (value instanceof Array) {
                    value.forEach(function (url) {
                        promises.push(_preload(url));
                    });
                }
                else {
                    _preload(value);
                }
                Promise.all(promises).then(resolve, reject);
            });
        }
        Resources.preload = preload;
        function get(url) {
            return resourceCache[url];
        }
        Resources.get = get;
    })(Resources = JayWalker.Resources || (JayWalker.Resources = {}));
})(JayWalker || (JayWalker = {}));
//# sourceMappingURL=resources.js.map