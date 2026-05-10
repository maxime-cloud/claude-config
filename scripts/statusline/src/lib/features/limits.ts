import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { UsageLimit } from "../render-pure";

const CACHE_TTL_MS = 5 * 60_000; // 5 minutes
const CACHE_PATH = join(homedir(), ".claude", "scripts", "statusline", "data", "limits_cache.json");

type UsageLimitsResult = {
	five_hour: UsageLimit | null;
	seven_day: UsageLimit | null;
};

type CacheEntry = {
	timestamp: number;
	data: UsageLimitsResult;
};

async function readCache(): Promise<UsageLimitsResult | null> {
	try {
		const content = await readFile(CACHE_PATH, "utf-8");
		const entry: CacheEntry = JSON.parse(content);
		if (Date.now() - entry.timestamp < CACHE_TTL_MS) return entry.data;
	} catch { /* cache miss */ }
	return null;
}

async function writeCache(data: UsageLimitsResult): Promise<void> {
	try {
		const entry: CacheEntry = { timestamp: Date.now(), data };
		await writeFile(CACHE_PATH, JSON.stringify(entry));
	} catch { /* ignore */ }
}

async function getAccessToken(): Promise<string | null> {
	try {
		const credPath = join(homedir(), ".claude", ".credentials.json");
		const content = await readFile(credPath, "utf-8");
		const creds = JSON.parse(content);
		return creds?.claudeAiOauth?.accessToken ?? null;
	} catch {
		return null;
	}
}

export async function getUsageLimits(): Promise<UsageLimitsResult> {
	const cached = await readCache();
	if (cached) return cached;

	const token = await getAccessToken();
	if (!token) return { five_hour: null, seven_day: null };

	try {
		const response = await fetch("https://api.anthropic.com/api/oauth/usage", {
			headers: {
				Authorization: `Bearer ${token}`,
				"anthropic-version": "2023-06-01",
			},
		});

		if (!response.ok) {
			await writeCache({ five_hour: null, seven_day: null });
			return { five_hour: null, seven_day: null };
		}

		const data = await response.json();

		const result: UsageLimitsResult = {
			five_hour: data.five_hour
				? {
						utilization: data.five_hour.utilization,
						resets_at: data.five_hour.resets_at ?? null,
					}
				: null,
			seven_day: data.seven_day
				? {
						utilization: data.seven_day.utilization,
						resets_at: data.seven_day.resets_at ?? null,
					}
				: null,
		};

		await writeCache(result);
		return result;
	} catch {
		return { five_hour: null, seven_day: null };
	}
}
