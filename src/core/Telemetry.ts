import * as FileSystem from 'expo-file-system';

export interface TelemetryEvent {
	id: string;
	timestamp: string;
	category: string;
	level: 'info' | 'warn' | 'error';
	message: string;
	data?: Record<string, any>;
}

const LOG_FILE = FileSystem.documentDirectory + 'telemetry.jsonl';

export const Telemetry = {
	async log(category: string, level: TelemetryEvent['level'], message: string, data?: Record<string, any>) {
		const evt: TelemetryEvent = {
			id: Date.now().toString(),
			timestamp: new Date().toISOString(),
			category,
			level,
			message,
			data
		};
		await FileSystem.writeAsStringAsync(LOG_FILE, JSON.stringify(evt) + '\n', { encoding: FileSystem.EncodingType.UTF8, append: true });
	},

	async readRecent(limit = 100): Promise<TelemetryEvent[]> {
		const info = await FileSystem.getInfoAsync(LOG_FILE);
		if (!info.exists) return [];
		const content = await FileSystem.readAsStringAsync(LOG_FILE);
		const lines = content.trim().split('\n').slice(-limit);
		return lines.map(l => JSON.parse(l));
	}
};

export default Telemetry;


