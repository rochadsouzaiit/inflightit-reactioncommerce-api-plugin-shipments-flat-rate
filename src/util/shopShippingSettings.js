
/**
 * @param {Object} settings The settings object
 * @returns {Object} Shop public settings object
 */
export function getShopShippingSettings(settings) {
  const { shippingOptions } = settings;
  if (!shippingOptions) return {};

  // not allow to return GPS coordinates
  delete shippingOptions.longitude;
  delete shippingOptions.latitude;

  return shippingOptions;
}

