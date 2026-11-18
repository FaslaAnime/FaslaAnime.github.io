/* PS4 browsers go straight to the primary Masry host. ?portal=1 keeps the portal visible on console. */
(function () {
  var ua = navigator.userAgent || "";
  if (/PlayStation 4/i.test(ua) && !/[?&]portal=1/.test(location.search)) {
    location.replace("dev/index.html" + location.search);
  }
})();
