import operators from "@reactioncommerce/api-utils/operators.js";
import propertyTypes from "@reactioncommerce/api-utils/propertyTypes.js";
import isDestinationRestricted from "./isDestinationRestricted.js";

/**
 * @summary Filter shipping methods based on per method deny attribute restrictions
 * @param {Object} methodRestrictions - method restrictions from FlatRateFulfillmentRestrcitionsCollection
 * @param {Object} method - current method to check restrictions against
 * @param {Object} hydratedOrder - hydrated order for current order
 * @returns {Bool} true / false as to whether method is still valid after this check
 */
export async function orderAttributeDenyCheck(
  methodRestrictions,
  method,
  hydratedOrder
) {
  // Get method specific attribute deny restrictions

  const attributesDenyRestrictions = methodRestrictions.filter(
    (restriction) =>
      restriction.type === "deny" && Array.isArray(restriction.attributes)
  );

  if (attributesDenyRestrictions.length === 0) return true;

  const { shippingAddress } = hydratedOrder;

  // just one true, allowed.
  const isRestricted = attributesDenyRestrictions.some((methodRestriction) => {
    const { attributes, destination } = methodRestriction;

    try {
      // every true, allowed.
      return attributes.every((attribute) => {
        const objectPath = attribute.property.split(".");
        objectPath.shift();

        // get property value with dot notation
        const propertyValue = objectPath.reduce((a, b) => a[b], hydratedOrder);
        const attributeFound = operators[attribute.operator](
          propertyValue,
          propertyTypes[attribute.propertyType](attribute.value)
        );

        if (attributeFound) {
          // If there is no destination restriction, destination restriction is global
          return (
            !destination ||
            isDestinationRestricted(destination, shippingAddress)
          );
        }
        return false;
      });
    } catch (error) {
      return false;
    }
  });

  return !isRestricted;
}
