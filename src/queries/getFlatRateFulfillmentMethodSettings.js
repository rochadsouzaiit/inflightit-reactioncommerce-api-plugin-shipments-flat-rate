import { getShopShippingSettings } from "../util/shopShippingSettings.js";

/**
 * @summary Returns app settings for a shop or global app settings.
 * @param {Object} context App context
 * @param {String} [shopId] Shop ID. Pass `null` for global settings.
 * @returns {Promise<Object>} App settings for a shop or global app settings
 */
export default async function getFlatRateFulfillmentMethodSettings(context, shopId = null) {
  const { collections } = context;
  const { AppSettings } = collections;

  const settings = (await AppSettings.findOne({ shopId })) || {};


  return shopId ? getShopShippingSettings(settings || {}) : {};
}
