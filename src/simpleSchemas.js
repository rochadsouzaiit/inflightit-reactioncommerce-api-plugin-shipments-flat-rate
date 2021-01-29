import SimpleSchema from "simpl-schema";

/**
 * @name ShippingOptions
 * @memberof Schemas
 * @type {SimpleSchema}
 * @summary Shop shipping options
 * @property {Numver} minAmountForShipping
 * @property {Numver} minAmoutForFreeShipping
 * @property {Numver} latitude
 * @property {Numver} longitude
 */
export const ShippingOptions = new SimpleSchema({
  minAmountForShipping: {
    type: Number,
    optional: true
  },
  minAmoutForFreeShipping: {
    type: Number,
    optional: true
  }
});

