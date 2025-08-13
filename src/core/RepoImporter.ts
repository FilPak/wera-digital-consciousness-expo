import * as FileSystem from 'expo-file-system';

export interface RepoImportOptions {
	branch?: string; // do przyszłego użytku
}

export interface KnowledgeLikeEntry {
	title: string;
	content: string;
	category: string;
	tags: string[];
	source: string;
	importance: number;
}

// Uproszczony importer repozytorium: pobiera plik ZIP i rozpakowuje listę plików tekstowych (symulacja)
export async function importRepoZip(url: string, opts: RepoImportOptions = {}): Promise<KnowledgeLikeEntry[]> {
	// UWAGA: Expo nie ma natywnego unzip bez dodatkowych pakietów; tutaj pseudo-obsługa:
	// 1) Pobierz ZIP do pamięci
	// 2) Zapisz jako asset
	// 3) (Placeholder) Traktuj zawartość jako jeden wpis, by nie wprowadzać natywnych zależności.
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Repo fetch failed: ${res.status}`);
	const arrayBuffer = await res.arrayBuffer();
	const base64 = Buffer.from(arrayBuffer).toString('base64');
	const repoDir = FileSystem.documentDirectory + 'repo_imports/';
	await FileSystem.makeDirectoryAsync(repoDir, { intermediates: true });
	const zipPath = repoDir + `repo_${Date.now()}.zip`;
	await FileSystem.writeAsStringAsync(zipPath, base64, { encoding: FileSystem.EncodingType.Base64 });

	return [{
		title: 'Repozytorium (ZIP)',
		content: `Pobrano repo ZIP: ${url}\nPlik: ${zipPath}`,
		category: 'repo',
		tags: ['import', 'repo', 'zip'],
		source: url,
		importance: 45
	}];
}


