import { mkdir, readFile, writeFile } from "node:fs/promises";

const API_URL = "https://data.usajobs.gov/api/Search";
const SEARCH_CONFIG_PATH = new URL("../data/searches.json", import.meta.url);
const JOBS_OUTPUT_PATH = new URL("../data/jobs.json", import.meta.url);

const userAgent = process.env.USAJOBS_USER_AGENT;
const authorizationKey = process.env.USAJOBS_AUTH_KEY;

function publicSearchUrl(params) {
  const searchParams = new URLSearchParams();
  const keyword = params.Keyword || params.PositionTitle;
  if (keyword) searchParams.set("k", keyword);
  if (params.LocationName) searchParams.set("l", params.LocationName);
  return `https://www.usajobs.gov/Search/Results?${searchParams.toString()}`;
}

function apiSearchUrl(params) {
  const searchParams = new URLSearchParams(params);
  return `${API_URL}?${searchParams.toString()}`;
}

function firstValue(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function formatLocation(positionLocation) {
  const locations = Array.isArray(positionLocation) ? positionLocation : [];
  const names = locations
    .map((location) => location?.LocationName)
    .filter(Boolean);

  if (!names.length) return "Location varies";
  if (names.length <= 3) return names.join("; ");
  return `${names.slice(0, 3).join("; ")} + ${names.length - 3} more`;
}

function formatApplyUrl(applyUrl) {
  const value = firstValue(applyUrl);
  if (typeof value === "string") return value;
  return null;
}

function normalizeJob(item, search) {
  const descriptor = item?.MatchedObjectDescriptor || {};
  const userArea = descriptor.UserArea || {};
  const details = userArea.Details || {};

  return {
    id: descriptor.PositionID || item?.MatchedObjectId || crypto.randomUUID(),
    source: "USAJOBS",
    searchId: search.id,
    title: descriptor.PositionTitle || "Untitled position",
    organization: descriptor.OrganizationName || descriptor.DepartmentName || "",
    location: formatLocation(descriptor.PositionLocation),
    postedAt: descriptor.PublicationStartDate || null,
    closesAt: descriptor.ApplicationCloseDate || null,
    url: descriptor.PositionURI || publicSearchUrl(search.params),
    applyUrl: formatApplyUrl(descriptor.ApplyURI),
    salaryMinimum: details.LowGrade || null,
    salaryMaximum: details.HighGrade || null,
  };
}

async function fetchSearch(search) {
  const response = await fetch(apiSearchUrl(search.params), {
    headers: {
      Host: "data.usajobs.gov",
      "User-Agent": userAgent,
      "Authorization-Key": authorizationKey,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${search.label}: ${response.status} ${response.statusText} ${text.slice(0, 160)}`);
  }

  const payload = await response.json();
  const items = payload?.SearchResult?.SearchResultItems || [];
  return {
    id: search.id,
    label: search.label,
    industry: search.industry,
    provider: search.provider,
    publicUrl: publicSearchUrl(search.params),
    count: items.length,
    jobs: items.map((item) => normalizeJob(item, search)),
  };
}

async function writeJobs(payload) {
  await mkdir(new URL("../data/", import.meta.url), { recursive: true });
  await writeFile(JOBS_OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
}

async function main() {
  const config = JSON.parse(await readFile(SEARCH_CONFIG_PATH, "utf8"));
  const searches = config.searches || [];

  if (!userAgent || !authorizationKey) {
    await writeJobs({
      configured: false,
      updatedAt: new Date().toISOString(),
      searches: [],
      errors: ["USAJOBS_USER_AGENT and USAJOBS_AUTH_KEY are required for automatic updates."],
    });
    console.log("USAJOBS secrets are not configured; wrote placeholder data/jobs.json.");
    return;
  }

  const results = [];
  const errors = [];

  for (const search of searches) {
    if (search.provider !== "usajobs") continue;
    try {
      results.push(await fetchSearch(search));
      console.log(`Fetched ${search.label}`);
    } catch (error) {
      errors.push(error.message);
      console.error(error.message);
    }
  }

  await writeJobs({
    configured: true,
    updatedAt: new Date().toISOString(),
    searches: results,
    errors,
  });

  if (errors.length && !results.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
