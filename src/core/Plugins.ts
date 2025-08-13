import * as FileSystem from 'expo-file-system';

export interface WeraPluginMeta {
	id: string;
	name: string;
	version: string;
	enabled: boolean;
	entry: string; // ścieżka do JS bundle pluginu
}

export const Plugins = {
	pluginsDir: FileSystem.documentDirectory + 'plugins/',

	list: async (): Promise<WeraPluginMeta[]> => {
		const info = await FileSystem.getInfoAsync(Plugins.pluginsDir);
		if (!info.exists) return [];
		const files = await FileSystem.readDirectoryAsync(Plugins.pluginsDir);
		const metas: WeraPluginMeta[] = [];
		for (const f of files.filter(x => x.endsWith('.json'))) {
			const meta = JSON.parse(await FileSystem.readAsStringAsync(Plugins.pluginsDir + f));
			metas.push(meta);
		}
		return metas;
	},

	enable: async (id: string, enabled: boolean): Promise<void> => {
		const metas = await Plugins.list();
		const meta = metas.find(m => m.id === id);
		if (!meta) return;
		meta.enabled = enabled;
		await FileSystem.writeAsStringAsync(Plugins.pluginsDir + `${id}.json`, JSON.stringify(meta, null, 2));
	},

	loadEnabled: async (): Promise<void> => {
		const metas = await Plugins.list();
		for (const m of metas.filter(x => x.enabled)) {
			try {
				// UWAGA: dynamic import lokalnego pliku – tylko w sandbox RN; tu placeholder
				console.log(`🔌 Ładowanie pluginu: ${m.name} (${m.version})`);
			} catch (e) {
				console.warn('Błąd ładowania pluginu', m.id, e);
			}
		}
	}
};

export default Plugins;


