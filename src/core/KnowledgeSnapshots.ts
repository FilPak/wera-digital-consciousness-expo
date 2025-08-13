import * as FileSystem from 'expo-file-system';

export interface KnowledgeSnapshotMeta {
	id: string;
	createdAt: string;
	description?: string;
	sizeBytes: number;
}

export const KnowledgeSnapshots = {
	createSnapshot: async (description?: string): Promise<KnowledgeSnapshotMeta> => {
		const id = Date.now().toString();
		const dir = FileSystem.documentDirectory + 'snapshots/';
		await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
		const path = dir + `${id}.json`;
		const payload = {
			memories: [],
			logs: [],
			config: {},
			createdAt: new Date().toISOString(),
			description: description || ''
		};
		const content = JSON.stringify(payload);
		await FileSystem.writeAsStringAsync(path, content);
		return { id, createdAt: payload.createdAt, description, sizeBytes: content.length };
	},

	listSnapshots: async (): Promise<KnowledgeSnapshotMeta[]> => {
		const dir = FileSystem.documentDirectory + 'snapshots/';
		const info = await FileSystem.getInfoAsync(dir);
		if (!info.exists) return [];
		const files = await FileSystem.readDirectoryAsync(dir);
		const metas: KnowledgeSnapshotMeta[] = [];
		for (const f of files) {
			const filePath = dir + f;
			const id = f.replace(/\.json$/, '');
			const stat = await FileSystem.getInfoAsync(filePath);
			metas.push({ id, createdAt: new Date(stat.modificationTime || Date.now()).toISOString(), sizeBytes: stat.size || 0 });
		}
		return metas.sort((a, b) => (a.id < b.id ? 1 : -1));
	}
};

export default KnowledgeSnapshots;


