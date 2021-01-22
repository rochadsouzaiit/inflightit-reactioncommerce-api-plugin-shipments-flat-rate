import importAsString from "@reactioncommerce/api-utils/importAsString.js";

const schema = importAsString("./schema.graphql");
const restrictions = importAsString("./restrictions.graphql");
const settings = importAsString("./settings.graphql");

export default [schema, restrictions, settings];
