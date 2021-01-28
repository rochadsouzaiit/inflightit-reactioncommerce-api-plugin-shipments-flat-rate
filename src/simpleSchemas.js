import SimpleSchema from "simpl-schema";

/**
 * @name ShippingOptions
 * @memberof Schemas
 * @type {SimpleSchema}
 * @summary Shop shipping options
 * @property {Numver} minAmountForDelivery
 * @property {Numver} minAmoutForFreeDelivery
 * @property {Numver} latitude
 * @property {Numver} longitude
 */
export const ShippingOptions = new SimpleSchema({
  minAmountForDelivery: {
    type: Number,
    optional: true
  },
  minAmoutForFreeDelivery: {
    type: Number,
    optional: true
  }
});

