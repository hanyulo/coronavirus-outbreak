function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

function throttle(fn, interval) {
  let lastExecutedTime = null;
  let dormnatInterval = null;
  let timer = null;
  return function decorator(...args) {
    if (lastExecutedTime) {
      dormnatInterval = Date.now() - lastExecutedTime;
    }
    if (!lastExecutedTime || (lastExecutedTime && (dormnatInterval >= interval))) {
      fn.apply(this, args);
      lastExecutedTime = Date.now();
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    } else if (lastExecutedTime && (dormnatInterval < interval)) {
      if (!timer) {
        console.log('timer!')
        timer = setTimeout(() => fn.apply(this, args), interval);
      }
    }
  };
}

export {
  formatNumber,
  throttle,
};
