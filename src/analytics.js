export const DAY = 86400000;
export const stamp = value => value && Number.isFinite(Date.parse(value)) ? Date.parse(value) : null;
export const elapsed = (value, now) => stamp(value) === null ? null : Math.max(0, (now - stamp(value)) / DAY);
export const closed = i => ['closed', 'done', 'removed'].includes((i.state || '').toLowerCase());
export const isOpen = i => !closed(i) && !['sin confirmar', ''].includes((i.state || '').toLowerCase());
export const status = i => !isOpen(i) && !closed(i) ? 'Sin confirmar' : closed(i) ? 'Completado' : ['active', 'committed', 'in progress'].includes((i.state || '').toLowerCase()) ? 'En progreso' : 'Pendiente';
export function enrich(i, now, staleDays = 3, processDays = 7) {
  const age = elapsed(i.createdAt, now), idle = elapsed(i.changedAt, now);
  const waiting = isOpen(i) && stamp(i.waitingSince) !== null ? elapsed(i.waitingSince, now) : null;
  const due = stamp(i.dueAt);
  const overdue = isOpen(i) && due !== null && now > due;
  const risk = isOpen(i) && due !== null && due >= now && due - now <= DAY;
  const stateAge = elapsed(i.stateChangedAt, now);
  const slow = isOpen(i) && stateAge !== null && stateAge >= processDays;
  const overEstimate = isOpen(i) && Number(i.originalEstimate) > 0 && i.completedWork != null && i.remainingWork != null && Number(i.completedWork) + Number(i.remainingWork) > Number(i.originalEstimate);
  return { ...i, age, idle, stateAge, slow, waiting, overdue, risk, overEstimate, stale: isOpen(i) && idle !== null && idle >= staleDays, high: isOpen(i) && [1, 2].includes(Number(i.priority)), unassigned: isOpen(i) && !i.assignee, status: status(i) };
}
export const matchesQueue = (i, queue) => ({ all: true, open: isOpen(i), high: i.high, waiting: i.waiting !== null, overdue: i.overdue || i.overEstimate || i.slow, stale: i.stale, unassigned: i.unassigned, done: closed(i) })[queue] ?? true;
export function trend(items, now, days) {
  const end = new Date(now); end.setUTCHours(0, 0, 0, 0);
  return Array.from({ length: days }, (_, n) => {
    const start = end.getTime() - (days - 1 - n) * DAY;
    return { date: new Date(start).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', timeZone: 'UTC' }), Creados: items.filter(i => stamp(i.createdAt) >= start && stamp(i.createdAt) < start + DAY).length, Cerrados: items.filter(i => stamp(i.closedAt) >= start && stamp(i.closedAt) < start + DAY).length };
  });
}
export function csv(items) {
  const fields = ['id', 'title', 'source', 'state', 'priority', 'assignee', 'createdAt', 'changedAt', 'waitingSince', 'dueAt'];
  const cell = value => '"' + String(value ?? '').replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""') + '"';
  return '\ufeff' + [fields, ...items.map(i => fields.map(k => i[k]))].map(row => row.map(cell).join(',')).join('\r\n');
}
