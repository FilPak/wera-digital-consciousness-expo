import * as FileSystem from 'expo-file-system';

export interface FileEntry {
	path: string;
	isDirectory: boolean;
	size?: number;
}

export const FileBrowser = {
	list: async (path: string): Promise<FileEntry[]> => {
		const info = await FileSystem.getInfoAsync(path);
		if (!info.exists || !info.isDirectory) return [];
		const entries = await FileSystem.readDirectoryAsync(path);
		const result: FileEntry[] = [];
		for (const name of entries) {
			const full = path.endsWith('/') ? path + name : path + '/' + name;
			const stat = await FileSystem.getInfoAsync(full);
			result.push({ path: full, isDirectory: !!stat.isDirectory, size: stat.size });
		}
		return result;
	},

	readText: async (path: string): Promise<string> => {
		return await FileSystem.readAsStringAsync(path);
	}
};

export default FileBrowser;


