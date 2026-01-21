import { pad, parseHM, clamp, formatHMS } from '../src/modules/utils/time.js';

const resultsEl = document.getElementById('results');
function logResult(name, ok, detail='') {
  const div = document.createElement('div');
  div.className = ok ? 'pass' : 'fail';
  div.textContent = `${ok ? '✔' : '✘'} ${name} ${detail}`;
  resultsEl.appendChild(div);
}

try {
  logResult('pad(5,2) == 05', pad(5,2) === '05');
  logResult('parseHM(08:30) == 510', parseHM('08:30') === 510);
  logResult('clamp(5,1,4) == 4', clamp(5,1,4) === 4);
  logResult('formatHMS(3661000) == 01:01:01', formatHMS(3661000) === '01:01:01');
} catch (e) {
  logResult('utils tests runtime', false, e.message);
}