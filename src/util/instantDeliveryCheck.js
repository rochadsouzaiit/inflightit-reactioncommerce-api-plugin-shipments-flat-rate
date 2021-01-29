import Logger from "@reactioncommerce/logger";
import axios from "axios";
import * as SphericalCompute from "spherical-geometry-js";

const { computeDistanceBetween } = SphericalCompute.default;

/**
 * @summary Check method has instant delivery rules
 * @param {Object} methodRestrictions - method restrictions from FlatRateFulfillmentRestrcitionsCollection
 * @returns {Bool} true / false if is a instant delivery rule or not
 */
export function isInstantDeliveryRateCheck(methodRestrictions = []) {
  const instantDeliveryRules = methodRestrictions.filter((mr) => !!mr.delivery);
  if (!instantDeliveryRules.length) return null;

  return true;
}

const MAPS_URL = "https://maps.googleapis.com/maps/api/geocode/json?address=";

/**
 * @summary get instant delivery rate
 * @param {Object} context - an object containing the per-request state
 * @param {Object} methodRestrictions - method restrictions from FlatRateFulfillmentRestrcitionsCollection
 * @param {Object} method - current method to check restrictions against
 * @param {Object} hydratedOrder - hydrated order for current order
 * @returns {Number | null} delivery rate or null (if error or method not available for the requested location)
 */
export async function getInstantDeliveryRateCheck(
  context,
  methodRestrictions = [],
  method,
  hydratedOrder
) {
  // If there is no rules, something when wrong
  const instantDeliveryRules = methodRestrictions.filter((mr) => !!mr.delivery);
  if (!instantDeliveryRules.length) throw new Error("There is no instant delivery rules");

  const { collections } = context;
  const { AppSettings } = collections;


  const { latitude, longitude } = (await AppSettings.findOne({ shopId: hydratedOrder.shopId })) || {};
  // If there is no Shop location, return
  if (!latitude || !longitude) throw new Error(`Store has no location defined: ${hydratedOrder.shopId}`);

  try {
    const {
      shippingAddress: { address1, address2, city, postal, region }
    } = hydratedOrder;

    const addressEncoded = [address1, address2, city, postal, region]
      .filter((part) => !!part)
      .join("+");
    const res = await axios.get(`${MAPS_URL}${encodeURIComponent(addressEncoded)}&key=${
      process.env.GOOGLE_MAPS_KEY
    }`);

    if (res && res.data && res.data.status === "OK") {
      const {
        geometry: { location }
      } = res.data.results[0];


      const deliveryLocationDistance = computeDistanceBetween({ latitude, longitude }, location);
      // Return distance in meter
      if (isNaN(deliveryLocationDistance)) throw new Error(`Not possible to calculate distance: ${hydratedOrder.shopId}`);

      const deliveryLocationDistanceInKms = deliveryLocationDistance / 1000;

      const rulesSortedDescByDistance = instantDeliveryRules.sort((ruleA, ruleB) => {
        if (ruleA.delivery.distance < ruleB.delivery.distance) return 1;
        if (ruleA.delivery.distance > ruleB.delivery.distance) return -1;
        return 0;
      });

      // if out of bounds, returns
      const { delivery } = rulesSortedDescByDistance[0];
      if (delivery.distance < deliveryLocationDistanceInKms) throw new Error(`Delivery location out of bounds: ${hydratedOrder.shopId}`);

      // Select rules
      let selectedRule = null;
      for (
        let index = 1;
        index < rulesSortedDescByDistance.length && !selectedRule;
        // eslint-disable-next-line no-plusplus
        index++
      ) {
        const { distance: upperLimit } = rulesSortedDescByDistance[
          index - 1
        ].delivery;
        const { distance: lowerLimit } = rulesSortedDescByDistance[
          index
        ].delivery;

        if (
          deliveryLocationDistanceInKms <= upperLimit &&
          deliveryLocationDistanceInKms > lowerLimit
        ) {
          selectedRule = rulesSortedDescByDistance[index - 1];
        }
      }

      // get last if not found
      if (!selectedRule) selectedRule = rulesSortedDescByDistance.pop();

      return selectedRule.delivery.rate;
    }

    throw new Error(`Google can't find location: ${addressEncoded}`);
  } catch (error) {
    const msg = typeof error === "string" ? error : (error && error.message) || "Error getting instant delivery rate";

    Logger.error(msg);
    return null;
  }
}

/**
 * @summary Set method rate for instant delivery method
 * @param {Object} method - current method to check restrictions against
 * @param {Number} rate - rate value
 * @returns {Object} method - with the rate as 0
 */
export function setInstantDeliveryMethodRate(method, rate) {
  if (!method) return method;

  const updatedMethod = { ...method, rate };
  return updatedMethod;
}
