import * as FileSystem from 'expo-file-system';

export interface HealthReport {
	timestamp: string;
	status: 'ok' | 'degraded' | 'error';
	checks: { name: string; ok: boolean; details?: string }[];
}

export const SelfHealing = {
	runSmokeTests: async (): Promise<HealthReport> => {
		const checks: HealthReport['checks'] = [];
		try {
			const dir = FileSystem.documentDirectory;
			const ok = !!dir;
			checks.push({ name: 'filesystem', ok, details: dir });
		} catch (e) {
			checks.push({ name: 'filesystem', ok: false, details: String(e) });
		}
		const status = checks.every(c => c.ok) ? 'ok' : (checks.some(c => !c.ok) ? 'degraded' : 'ok');
		return { timestamp: new Date().toISOString(), status, checks };
	},

	attemptRecovery: async (): Promise<boolean> => {
		// Prosty recovery: rekreacja podstawowych katalogów
		try {
			const essentials = ['sandbox_thoughts','sandbox_memory','sandbox_dreams'];
			for (const d of essentials) {
				await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + d, { intermediates: true });
			}
			return true;
		} catch {
			return false;
		}
	}
};

export default SelfHealing;


