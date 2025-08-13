import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

export interface IntegrityIssue {
	path: string;
	issue: 'missing' | 'mismatch';
	expected?: string;
	actual?: string;
}

export async function hashFile(path: string): Promise<string> {
	const content = await FileSystem.readAsStringAsync(path);
	return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, content);
}

export async function scanIntegrity(files: { path: string; sha256: string }[]): Promise<IntegrityIssue[]> {
	const issues: IntegrityIssue[] = [];
	for (const f of files) {
		const info = await FileSystem.getInfoAsync(f.path);
		if (!info.exists) {
			issues.push({ path: f.path, tissue: 'missing' });
			continue;
		}
		const actual = await hashFile(f.path);
		if (actual !== f.sha256) {
			issues.push({ path: f.path, tissue: 'mismatch', expected: f.sha256, actual });
		}
	}
	return issues;
}


