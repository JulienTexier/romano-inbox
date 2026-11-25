const { removeApsEnvironment } = require('../plugins/withoutPushEntitlement');

test('removes aps-environment', () => {
  expect(removeApsEnvironment({ 'aps-environment': 'development', other: 1 })).toEqual({ other: 1 });
});
