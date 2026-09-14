import { describe, expect, test } from "bun:test";
import {
  authSuperuser,
  checkHealth,
  createSetupClient,
  describeSetupError,
  findMissingCollections,
  importCollections,
  seedSampleData,
} from "./setupApi";

const url = process.env.PB_TEST_URL;
const email = process.env.PB_TEST_EMAIL ?? "setup@example.com";
const password = process.env.PB_TEST_PASSWORD ?? "setuppass123";

const errorOf = async (promise: Promise<unknown>): Promise<unknown> => {
  try {
    await promise;
  } catch (err) {
    return err;
  }
  throw new Error("Expected the promise to reject");
};

// Runs only against a disposable instance: PB_TEST_URL=http://127.0.0.1:8095 bun test integration
describe.skipIf(!url)("setupApi against a real PocketBase", () => {
  test("full setup flow is idempotent", async () => {
    const client = createSetupClient(url!);
    await checkHealth(client);

    const authError = await errorOf(authSuperuser(client, email, "wrong-password"));
    expect(describeSetupError(authError, "auth")).toBe("Wrong superuser email or password.");

    await authSuperuser(client, email, password);
    expect(await findMissingCollections(client)).toEqual(["products", "journal_articles", "orders"]);

    await importCollections(client);
    await importCollections(client);
    expect(await findMissingCollections(client)).toEqual([]);

    const progress: string[] = [];
    const first = await seedSampleData(client, (p) => progress.push(`${p.collection} ${p.done}/${p.total}`));
    expect(first).toEqual({ created: 9, skipped: 0, failed: [] });
    expect(progress.at(-1)).toBe("journal_articles 3/3");

    const second = await seedSampleData(client);
    expect(second).toEqual({ created: 0, skipped: 9, failed: [] });

    const anonymous = createSetupClient(url!);
    const products = await anonymous.collection("products").getList(1, 50, { sort: "-created" });
    expect(products.totalItems).toBe(6);
    const order = await anonymous.collection("orders").create({
      customerEmail: "buyer@example.com",
      totalAmount: 429,
      items: [{ id: "p1", name: "Aura Harmony", price: 429, quantity: 1 }],
      status: "pending",
    });
    expect(order.id).toHaveLength(15);
  });

  test("unreachable URL reports a network message", async () => {
    const client = createSetupClient("http://127.0.0.1:1");
    const err = await errorOf(checkHealth(client));
    expect(describeSetupError(err, "connect")).toStartWith("Can't reach this URL");
  });
});
