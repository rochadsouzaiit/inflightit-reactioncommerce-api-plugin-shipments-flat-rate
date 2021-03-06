import { attributeDenyCheck } from "./attributeDenyCheck.js";
import { locationAllowCheck } from "./locationAllowCheck.js";
import { locationDenyCheck } from "./locationDenyCheck.js";
import { minAmountForShippingCheck } from "./minAmountForShippingCheck.js";
import { ordeQualifiedForFreeShippingCheck, resetShippingMethodRate } from "./freeShippingCheck.js";
import { isInstantDeliveryRateCheck, getInstantDeliveryRateCheck,
  setInstantDeliveryMethodRate, OUT_OF_BOUNDS_VALUE } from "./instantDeliveryCheck.js";

/**
 * @summary Filter shipping methods based on per method restrictions
 * @param {Object} context - an object containing the per-request state
 * @param {Object} methods - all available shipping methods for a shop
 * @param {Object} hydratedOrder - hydrated order for current order
 * @returns {Object|null} available shipping methods after filtering
 */
export default async function filterShippingMethods(
  context,
  methods,
  hydratedOrder
) {
  const { FlatRateFulfillmentRestrictions } = context.collections;

  const allValidShippingMethods = methods.reduce(
    async (validShippingMethods, currentMethod) => {
      const awaitedValidShippingMethods = await validShippingMethods;
      let method = currentMethod;

      // If method is not enabled, it is not valid
      if (!method.enabled) {
        return awaitedValidShippingMethods;
      }

      // Find all restrictions for this shipping method
      const methodRestrictions = await FlatRateFulfillmentRestrictions.find({
        methodIds: method._id
      }).toArray();

      // Check method against location allow check
      const methodIsAllowedBasedOnShippingLocationsAllowList = await locationAllowCheck(
        methodRestrictions,
        method,
        hydratedOrder
      );
      if (!methodIsAllowedBasedOnShippingLocationsAllowList) {
        return awaitedValidShippingMethods;
      }

      // Check method against location deny check
      const methodIsAllowedBasedOnShippingLocationsDenyList = await locationDenyCheck(
        methodRestrictions,
        method,
        hydratedOrder
      );
      if (!methodIsAllowedBasedOnShippingLocationsDenyList) {
        return awaitedValidShippingMethods;
      }

      // Check method against attributes deny check
      const methodIsAllowedBasedOnShippingAttributesDenyList = await attributeDenyCheck(
        methodRestrictions,
        method,
        hydratedOrder
      );
      if (!methodIsAllowedBasedOnShippingAttributesDenyList) {
        return awaitedValidShippingMethods;
      }

      // Verify method against min order value
      const methodIsAllowedBasedOnOrderTotalAmount = await minAmountForShippingCheck(
        context,
        method,
        hydratedOrder
      );
      if (!methodIsAllowedBasedOnOrderTotalAmount) {
        return awaitedValidShippingMethods;
      }

      // *******************************************************
      // NOT USED SINCE MIN SHIPPING VALUE WENT TO SHOP SETTINGS
      // *******************************************************
      // Check method against attributes deny check
      // const methodIsAllowedBasedOnOrderAttributesDenyList = await orderAttributeDenyCheck(
      //   methodRestrictions,
      //   method,
      //   hydratedOrder
      // );
      // if (!methodIsAllowedBasedOnOrderAttributesDenyList) {
      //   return awaitedValidShippingMethods;
      // }


      // If is a "instant" delivery method, check if inside bounds and rate
      if (isInstantDeliveryRateCheck(methodRestrictions)) {
        const instantDeliveryRate = await getInstantDeliveryRateCheck(
          context,
          methodRestrictions,
          method,
          hydratedOrder
        );

        if (instantDeliveryRate !== null) {
          method = setInstantDeliveryMethodRate(method, instantDeliveryRate);

          // TODO: (Refactor) prevent to be reset by "qualified free shipping"
          if (instantDeliveryRate === OUT_OF_BOUNDS_VALUE) {
            awaitedValidShippingMethods.push(method);
            return awaitedValidShippingMethods;
          }
        } else return awaitedValidShippingMethods;
      }


      // If method passes all filter, it should be checked if is qualified for free shipping
      const orderIsQualifiedForFreeShippingMethod = await ordeQualifiedForFreeShippingCheck(
        context,
        method,
        hydratedOrder
      );
      if (orderIsQualifiedForFreeShippingMethod) method = resetShippingMethodRate(method);

      // If method passes all checks, it is valid and should be added to valid methods array
      awaitedValidShippingMethods.push(method);
      return awaitedValidShippingMethods;
    },
    Promise.resolve([])
  );

  // Return all valid shipping rates
  return allValidShippingMethods;
}
