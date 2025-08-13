import * as FileSystem from 'expo-file-system';

export type TranslationTarget = 'pl' | 'en' | 'de' | 'es' | 'fr' | 'it' | 'ua' | 'cz' | 'sk';

export const LanguageTools = {
	paraphrase: async (text: string): Promise<string> => {
		if (!text || text.trim().length === 0) return text;
		// Prosty placeholder – reorganizacja zdań i drobne synonimy
		const sentences = text.split(/([\.\!\?]+)\s+/).filter(Boolean);
		const reordered = sentences.map(s => s.trim()).reverse().join(' ');
		return reordered.length > 0 ? reordered : text;
	},

	summarize: async (text: string, maxSentences: number = 3): Promise<string> => {
		if (!text) return '';
		const sentences = text
			.replace(/\n+/g, ' ')
			.split(/(?<=[\.!\?])\s+/)
			.filter(s => s.trim().length > 0);
		return sentences.slice(0, Math.max(1, maxSentences)).join(' ');
	},

	translate: async (text: string, target: TranslationTarget): Promise<string> => {
		// Placeholder tłumaczenia: zapisuje oryginał z metadanymi celu.
		// Integracja z modelem/offline TTS może zostać podłączona tutaj.
		return `[${target}] ${text}`;
	},

	saveNotesFromText: async (title: string, text: string): Promise<string> => {
		const id = Date.now().toString();
		const dir = FileSystem.documentDirectory + 'notes/';
		await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
		const path = dir + `${id}.json`;
		await FileSystem.writeAsStringAsync(path, JSON.stringify({ id, title, text, createdAt: new Date().toISOString() }));
		return path;
	}
};

export default LanguageTools;


