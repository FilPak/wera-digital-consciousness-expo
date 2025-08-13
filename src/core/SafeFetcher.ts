export interface SafeFetchOptions extends RequestInit {
	allowedContentTypes?: string[]; // np. ['text/plain','application/json']
	maxBytes?: number; // limit rozmiaru
}

export async function safeFetch(url: string, options: SafeFetchOptions = {}) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 30000);
	try {
		const res = await fetch(url, { ...options, signal: controller.signal });
		const ctype = res.headers.get('content-type') || '';
		if (options.allowedContentTypes && !options.allowedContentTypes.some(t => ctype.includes(t))) {
			throw new Error(`Niedozwolony content-type: ${ctype}`);
		}
		const blob = await res.blob();
		if (options.maxBytes && blob.size > options.maxBytes) {
			throw new Error(`Za duży plik: ${blob.size}B > ${options.maxBytes}B`);
		}
		return blob;
	} finally {
		clearTimeout(timeout);
	}
}


