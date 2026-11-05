import Guard from 'browser-guard';
const records = [], events = [];
const create = Guard.create;
Guard.create = options => {
  const controller = create(options);
  const record = { controller, destroyed: false };
  const destroy = controller.destroy;
  controller.on('violation', event => events.push({ type: event.type, feature: event.feature, target: event.target.id, prevented: event.defaultPrevented }));
  controller.destroy = () => { destroy(); record.destroyed = true; };
  records.push(record);
  return controller;
};
window.harness = {
  Guard, records, events,
  get active() { return records.filter(r => !r.destroyed).map(r => r.controller); },
  get latest() { return this.active.at(-1); },
  bind(mount, unmount) {
    this.mount = mount; this.unmount = unmount;
    document.querySelector('#mount').onclick = () => mount();
    document.querySelector('#unmount').onclick = () => unmount();
    mount();
  }
};
