

/**
 * @summary Check if order is qualified for free delivery
 * @param {Object} context - an object containing the per-request state
 * @param {Object} method - current method to check restrictions against
 * @param {Object} hydratedOrder - hydrated order for current order
 * @returns {Bool} true / false as to whether method is still valid after this check
 */
export async function ordeQualifiedForFreeDeliveryCheck(
  context,
  method,
  hydratedOrder
) {
  const { collections } = context;
  const { AppSettings } = collections;

  let isFree = false;

  const settings = (await AppSettings.findOne({ shopId: hydratedOrder.shopId })) || {};

  const minAmoutForFreeDelivery = settings.shippingOptions && settings.shippingOptions.minAmoutForFreeDelivery;
  if (!minAmoutForFreeDelivery) return false;


  if (method.fulfillmentTypes && method.fulfillmentTypes.includes("shipping")) {
    const { amount } = hydratedOrder.totals.orderTotal;
    if (amount >= minAmoutForFreeDelivery) isFree = true;
  }

  return isFree;
}

/**
 * @summary Reset method value for free shipping methods
 * @param {Object} method - current method to check restrictions against
 * @returns {Object} method - with the rate as 0
 */
export function resetDeliveryMethodRate(method) {
  if (!method) return method;

  const updatedMethod = { ...method };
  if (!!method && !!method.rate) updatedMethod.rate = 0;
  return updatedMethod;
}
