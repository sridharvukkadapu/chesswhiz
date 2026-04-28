import { getSupabaseClient } from "../supabase";

describe("getSupabaseClient", () => {
  it("returns an object with .from method", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";
    const client = getSupabaseClient();
    expect(typeof client.from).toBe("function");
  });
});
