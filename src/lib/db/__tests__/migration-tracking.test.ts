/**
 * Test that the Drizzle migration tracking table has the expected records.
 * If migrations were applied but not tracked, drizzle-kit migrate will try to
 * re-run all migrations from scratch, causing errors.
 */
import { describe, it, expect } from "vitest";
import "dotenv/config";
import { getDb } from "@/lib/db/client";
import { sql } from "drizzle-orm";

describe("drizzle migration tracking", () => {
	it("has records for applied migrations 0000 and 0001", async () => {
		const db = getDb();

		const rows = await db.execute(
			sql`SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at ASC`,
		);

		// Should have at least 2 records (for migrations 0000 and 0001)
		expect(rows.rowCount).toBeGreaterThanOrEqual(2);

		// Migration 0000 — spotty_brood
		const m0000 = rows.rows[0] as { hash: string; created_at: bigint };
		expect(m0000.hash).toBe(
			"57898812c437d01d2a71df32ea237673d877c41d18b9e2f3336cbe0f9365107c",
		);
		expect(Number(m0000.created_at)).toBe(1774496296313);

		// Migration 0001 — striped_wiccan
		const m0001 = rows.rows[1] as { hash: string; created_at: bigint };
		expect(m0001.hash).toBe(
			"933f8ab9910f61fdbcbdc429f6ab71fbd5391030dec8f90f1e14c91dc6f1255c",
		);
		expect(Number(m0001.created_at)).toBe(1774916353286);
	});
});
