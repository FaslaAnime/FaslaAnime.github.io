/* PS4 browsers go straight to the embedded engine. ?portal=1 keeps the portal visible on console. */
(function () {
  var ua = navigator.userAgent || "";
  if (/PlayStation 4/i.test(ua) && !/[?&]portal=1/.test(location.search)) {
    location.replace("jb/index.html" + location.search);
  }
})();
