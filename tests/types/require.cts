import Guard = require('browser-guard');
const guard = Guard.create({ target: document.body, onViolation: (type, event) => console.log(type, event.timestamp) });
guard.enable({ copy: true }); guard.on('violation', event => console.log(event.target));
// @ts-expect-error invalid action
guard.enable({ consoleAction: 'freeze' });
