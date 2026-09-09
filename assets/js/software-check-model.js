/* Pure arithmetic shared by the browser and the calculator checks. */
(function (root) {
  'use strict';
  function number(value, max = 10000000) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const raw = String(value).trim().replace(',', '.');
    if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
  }
  const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
  function reference(plan, seats = 1) {
    const count = number(seats, 10000);
    if (!plan || count === null || count < 1 || !Number.isInteger(count)) return null;
    return round(plan.price * (plan.unit === 'seat' ? count : 1) +
      (plan.smallTeamBelow && count < plan.smallTeamBelow ? plan.smallTeamFee : 0));
  }
  function summarize(entries, hours, hourlyRate) {
    const priced = entries.map(e => ({...e, monthly:number(e.cost)})).filter(e => e.monthly !== null);
    const monthly = round(priced.reduce((sum,e) => sum + e.monthly,0));
    const usage = entries.filter(e => ['25','50','75','100'].includes(String(e.usage)));
    const satisfaction = entries.filter(e => ['1','2','3','4','5'].includes(String(e.satisfaction)));
    const workHours = number(hours, 10000), rate = number(hourlyRate,10000);
    const hoursMonth = workHours === null ? null : workHours * 52 / 12;
    return {
      selected:entries.length, priced:priced.length, missing:entries.length-priced.length,
      monthly:priced.length ? monthly : null, yearly:priced.length ? round(monthly*12) : null,
      usageCount:usage.length, averageUsage:usage.length ? Math.round(usage.reduce((s,e)=>s+Number(e.usage),0)/usage.length) : null,
      satisfactionCount:satisfaction.length, lowFit:satisfaction.filter(e=>Number(e.satisfaction)<=2).length,
      underused:usage.filter(e=>Number(e.usage)<=50).length,
      hoursMonth:hoursMonth===null?null:round(hoursMonth),
      workValue:hoursMonth===null||rate===null?null:round(hoursMonth*rate)
    };
  }
  const api={number,reference,summarize};
  if (typeof module === 'object' && module.exports) module.exports=api;
  else root.GreenfieldSoftwareCheck=api;
})(typeof window !== 'undefined' ? window : globalThis);
