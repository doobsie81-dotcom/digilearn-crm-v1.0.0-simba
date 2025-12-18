import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "~/trpc/init";
import { appRouter } from "~/trpc/routers/_app";


const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
    responseMeta() {
      return {
        headers: {
          "Access-Control-Allow-Origin": "*", // or specific origin
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
        },
      };
    }
  });


  // Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}
export { handler as GET, handler as POST };
