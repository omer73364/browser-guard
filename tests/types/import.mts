import Guard, { create, type ViolationEvent, type Feature } from 'browser-guard';
const guard = create({ target: '#article', allow: ['input'], copy: true });
guard.enable();
const off = guard.on('violation', event => { const e: ViolationEvent = event; const f: Feature = e.feature; console.log(f); });
off(); guard.disable(['copy', 'print']); guard.destroy();
Guard.enable({ antiDebug: true }); Guard.destroy();
// @ts-expect-error invalid feature
guard.disable('unknown');
// @ts-expect-error invalid flag type
Guard.create({ copy: 'yes' });
// @ts-expect-error invalid event name
guard.on('copy', () => {});
