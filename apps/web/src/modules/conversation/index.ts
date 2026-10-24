export { parseDemoRequest } from "./domain/demo-request.ts";
export type { SuggestedItem, DemoRequest } from "./domain/demo-request.ts";
export {
  readChatContext,
  actionFromTool,
  toolReply,
  limitedReply,
  applyCartProposal,
  describeCartChange,
  interpretModelReply,
} from "./domain/chat.ts";
export type {
  ChatMessage,
  ChatAction,
  ChatReply,
  ChatContext,
} from "./domain/chat.ts";
export { parseOrderLink, orderLinkReply } from "./domain/order-link.ts";
export type { OrderLink } from "./domain/order-link.ts";
