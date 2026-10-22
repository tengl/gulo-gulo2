export {
  addSelections,
  setQuantity,
  removeLine,
  cartTotalOre,
  cartCount,
} from "./domain/cart.ts";
export type { Cart, CartLine, Selection } from "./domain/cart.ts";
export {
  readCart,
  readSelections,
  cartFingerprint,
  describeCart,
  describeSavedOrder,
  saveDemoOrder,
  cancelDemoOrder,
  canCustomerCancel,
  parseMemory,
  EMPTY_MEMORY,
} from "./domain/saved-orders.ts";
export type { SavedOrder, OrderMemory } from "./domain/saved-orders.ts";
