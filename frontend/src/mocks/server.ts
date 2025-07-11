import { setupServer } from "msw/node";
import { handlers } from "../../__tests__/mocks/handlers";

// Setup MSW server for Node.js environment (tests)
export const server = setupServer(...handlers);
