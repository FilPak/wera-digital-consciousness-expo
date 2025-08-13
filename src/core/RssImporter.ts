export interface RssItem {
	title: string;
	link?: string;
	description?: string;
	content?: string;
	pubDate?: string;
}

export interface KnowledgeLikeEntry {
	title: string;
	content: string;
	category: string;
	tags: string[];
	source: string;
	importance: number;
}

function extractTag(xml: string, tag: string): string | undefined {
	const re = new RegExp(`<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, 'i');
	const m = xml.match(re);
	if (!m) return undefined;
	return decodeHtml(m[1].trim());
}

function decodeHtml(str: string) {
	return str
		.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

export function parseRss(xml: string): RssItem[] {
	const itemsXml = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
	const items: RssItem[] = [];
	for (const ix of itemsXml) {
		const title = extractTag(ix, 'title') || 'Brak tytułu';
		const link = extractTag(ix, 'link');
		const description = extractTag(ix, 'description');
		const content = extractTag(ix, 'content:encoded') || description;
		const pubDate = extractTag(ix, 'pubDate');
		items.push({ title, link, description, content, pubDate });
	}
	return items;
}

export async function fetchRss(url: string): Promise<string> {
	const res = await fetch(url, { headers: { Accept: 'application/rss+xml, application/xml, text/xml, text/plain' }});
	if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
	return await res.text();
}

export async function importRssToEntries(url: string): Promise<KnowledgeLikeEntry[]> {
	const xml = await fetchRss(url);
	const items = parseRss(xml);
	const sourceHost = (() => { try { return new URL(url).host; } catch { return 'rss'; }})();
	return items.map(it => ({
		title: it.title,
		content: `${it.content || it.description || ''}\n\n${it.link ? `Źródło: ${it.link}` : ''}`.trim(),
		category: 'rss',
		tags: ['import', 'rss', sourceHost],
		source: url,
		importance: 50
	}));
}


