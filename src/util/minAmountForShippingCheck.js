

/**
 * @summary Filter shipping methods based on per method deny attribute restrictions
 * @param {Object} context - an object containing the per-request state
 * @param {Object} method - current method to check restrictions against
 * @param {Object} hydratedOrder - hydrated order for current order
 * @returns {Bool} true / false as to whether method is still valid after this check
 */
export async function minAmountForShippingCheck(
  context,
  method,
  hydratedOrder
) {
  const { collections } = context;
  const { AppSettings } = collections;

  let isRestricted = false;

  const settings = (await AppSettings.findOne({ shopId: hydratedOrder.shopId })) || {};

  const shopMinAmountForShipping = settings.shippingOptions && settings.shippingOptions.minAmountForShipping;
  if (!shopMinAmountForShipping) return !isRestricted;

  const { amount } = hydratedOrder.totals.orderTotal;
  if (amount < shopMinAmountForShipping) isRestricted = true;

  return !isRestricted;
}
