const { withEntitlementsPlist } = require('expo/config-plugins');

// Personal Teams (free Apple ID) cannot sign the Push Notifications capability.
function removeApsEnvironment(entitlements) {
  const { 'aps-environment': _removed, ...rest } = entitlements;
  return rest;
}

module.exports = (config) =>
  withEntitlementsPlist(config, (c) => {
    c.modResults = removeApsEnvironment(c.modResults);
    return c;
  });
module.exports.removeApsEnvironment = removeApsEnvironment;
