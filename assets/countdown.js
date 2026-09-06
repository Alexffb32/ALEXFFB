(function () {
  "use strict";

  var el = document.getElementById("wl-countdown");
  if (!el) return;

  var deadline = new Date(el.getAttribute("data-deadline")).getTime();
  var liveMsg = document.getElementById("wl-countdown-live");
  var nums = {
    days: el.querySelector('[data-unit="days"]'),
    hours: el.querySelector('[data-unit="hours"]'),
    minutes: el.querySelector('[data-unit="minutes"]'),
    seconds: el.querySelector('[data-unit="seconds"]'),
  };

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  var timer;

  function tick() {
    var diff = deadline - Date.now();
    if (diff <= 0) {
      el.hidden = true;
      if (liveMsg) liveMsg.hidden = false;
      clearInterval(timer);
      return;
    }
    var totalSeconds = Math.floor(diff / 1000);
    nums.days.textContent = pad(Math.floor(totalSeconds / 86400));
    nums.hours.textContent = pad(Math.floor((totalSeconds % 86400) / 3600));
    nums.minutes.textContent = pad(Math.floor((totalSeconds % 3600) / 60));
    nums.seconds.textContent = pad(totalSeconds % 60);
  }

  tick();
  timer = setInterval(tick, 1000);
})();
