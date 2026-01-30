import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const dataDir = resolve("data");
const sourcesPath = resolve(dataDir, "sources.json");
const seedPath = resolve(dataDir, "specs_seed.json");
const outputPath = resolve(dataDir, "specs.json");

const readJson = async (path) => {
  const content = await readFile(path, "utf8");
  return JSON.parse(content);
};

const normalize = (value) => value.toLowerCase();

const extractItems = (xml) => {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml))) {
    const block = match[1];
    const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);
    const dateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

    const title = titleMatch?.[1]?.trim();
    const link = linkMatch?.[1]?.trim();
    if (!title || !link) continue;

    items.push({
      title,
      link,
      publishedAt: dateMatch?.[1]?.trim() ?? null,
    });
  }

  return items;
};

const fetchArticles = async (sources) => {
  const modelArticles = new Map();

  const seedSpecs = await readJson(seedPath);
  const aliasMap = seedSpecs.map((spec) => ({
    model: spec.model,
    aliases: [spec.model, ...(spec.aliases ?? [])].map((alias) => normalize(alias)),
  }));

  for (const source of sources) {
    const response = await fetch(source.url, {
      headers: { "user-agent": "spec-bot" },
    });
    if (!response.ok) {
      console.warn(`Failed to fetch ${source.name}: ${response.status}`);
      continue;
    }

    const xml = await response.text();
    const items = extractItems(xml);

    items.forEach((item) => {
      aliasMap.forEach((entry) => {
        const isMatch = entry.aliases.some((alias) =>
          normalize(item.title).includes(alias)
        );

        if (!isMatch) return;
        const key = normalize(entry.model);
        const existing = modelArticles.get(key) ?? [];
        existing.push({
          source: source.name,
          title: item.title,
          link: item.link,
          publishedAt: item.publishedAt,
        });
        modelArticles.set(key, existing);
      });
    });
  }

  return modelArticles;
};

const main = async () => {
  const sources = await readJson(sourcesPath);
  const seedSpecs = await readJson(seedPath);
  const articlesByModel = await fetchArticles(sources);

  const modelMap = new Map();
  seedSpecs.forEach((spec) => {
    const key = normalize(spec.model);
    if (modelMap.has(key)) return;

    const { aliases, ...rest } = spec;
    modelMap.set(key, {
      ...rest,
      sources: (articlesByModel.get(key) ?? []).slice(0, 5),
    });
  });

  const payload = {
    updatedAt: new Date().toISOString(),
    totalSources: sources.length,
    models: Array.from(modelMap.values()),
  };

  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Updated ${outputPath} with ${payload.models.length} models.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
