import { getShopShippingSettings } from "../util/shopShippingSettings.js";

/**
 * @summary Returns app settings for a shop or global app settings.
 * @param {Object} context App context
 * @param {String} [shopId] Shop ID. Pass `null` for global settings.
 * @returns {Promise<Object>} App settings for (cencerning to shipping) and max delivery distance
 */
export default async function getFlatRateFulfillmentMethodSettings(context, shopId = null) {
  if (!shopId) return {};
  const { collections } = context;
  const { AppSettings, FlatRateFulfillmentRestrictions } = collections;

  const settings = (await AppSettings.findOne({ shopId })) || {};


  // Get max instant delivery distance from restrictions
  const fulfillmentRestrictions =
    (await FlatRateFulfillmentRestrictions.find({ shopId }).toArray()) || [];
  const distances = fulfillmentRestrictions
    .map((restriction) =>
      (!!restriction.delivery && restriction.delivery.distance) || 0)
    .filter((distance) => distance > 0);

  let maxInstantDeliveryDistance = null;
  if (distances.length) maxInstantDeliveryDistance = Math.max(...distances);


  return { ...getShopShippingSettings(settings || {}), maxInstantDeliveryDistance };
}
