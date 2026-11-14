
import { NextResponse } from "next/server";

function cleanXml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q")?.trim();
  const startYear = searchParams.get("startYear");
  const endYear = searchParams.get("endYear");
  const articleType = searchParams.get("type");
  const sort = searchParams.get("sort") || "relevance";
  const limit = Number(searchParams.get("limit") || 10);

  if (!query) {
    return NextResponse.json(
      { error: "Please enter a search term." },
      { status: 400 }
    );
  }

  const currentYear = new Date().getFullYear();

  if (
    (startYear && !/^\d{4}$/.test(startYear)) ||
    (endYear && !/^\d{4}$/.test(endYear)) ||
    (startYear && Number(startYear) > currentYear) ||
    (endYear && Number(endYear) > currentYear) ||
    (startYear && endYear && Number(startYear) > Number(endYear))
  ) {
    return NextResponse.json(
      { error: "Invalid publication year range." },
      { status: 400 }
    );
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return NextResponse.json(
      { error: "Limit must be between 1 and 50." },
      { status: 400 }
    );
  }

  const allowedTypes = [
    "Clinical Trial",
    "Randomized Controlled Trial",
    "Review",
    "Systematic Review",
    "Meta-Analysis",
    "Case Reports",
  ];

  if (articleType && !allowedTypes.includes(articleType)) {
    return NextResponse.json(
      { error: "Invalid article type." },
      { status: 400 }
    );
  }

  try {
    const terms = [query];

    if (startYear || endYear) {
      const from = startYear || "1900";
      const to = endYear || String(currentYear);

      terms.push(`("${from}"[Date - Publication] : "${to}"[Date - Publication])`);
    }

    if (articleType) {
      terms.push(`"${articleType}"[Publication Type]`);
    }

    const searchUrl = new URL(
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    );

    searchUrl.searchParams.set("db", "pubmed");
    searchUrl.searchParams.set("term", terms.join(" AND "));
    searchUrl.searchParams.set("retmax", String(limit));
    searchUrl.searchParams.set("retmode", "json");
    searchUrl.searchParams.set(
      "sort",
      sort === "date" ? "pub date" : "relevance"
    );

    const searchResponse = await fetch(searchUrl.toString());

    if (!searchResponse.ok) {
      throw new Error("PubMed search failed");
    }

    const searchData = await searchResponse.json();
    const ids: string[] = searchData.esearchresult.idlist;

    if (ids.length === 0) {
      return NextResponse.json({ articles: [], total: 0 });
    }

    const detailsUrl = new URL(
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
    );

    detailsUrl.searchParams.set("db", "pubmed");
    detailsUrl.searchParams.set("id", ids.join(","));
    detailsUrl.searchParams.set("retmode", "json");

    const detailsResponse = await fetch(detailsUrl.toString());

    if (!detailsResponse.ok) {
      throw new Error("PubMed details request failed");
    }

    const detailsData = await detailsResponse.json();

    const abstractUrl = new URL(
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
    );

    abstractUrl.searchParams.set("db", "pubmed");
    abstractUrl.searchParams.set("id", ids.join(","));
    abstractUrl.searchParams.set("retmode", "xml");

    const abstractResponse = await fetch(abstractUrl.toString());

    if (!abstractResponse.ok) {
      throw new Error("PubMed abstract request failed");
    }

    const xml = await abstractResponse.text();

    const articles = ids.map((id) => {
      const item = detailsData.result[id];

      const articleMatch = xml.match(
        new RegExp(
          `<PubmedArticle>[\\s\\S]*?<PMID[^>]*>${id}<\\/PMID>[\\s\\S]*?<\\/PubmedArticle>`
        )
      );

      let abstract = "";

      if (articleMatch) {
        const abstractMatches = [
          ...articleMatch[0].matchAll(
            /<AbstractText([^>]*)>([\s\S]*?)<\/AbstractText>/g
          ),
        ];

        abstract = abstractMatches
          .map((match) => {
            const labelMatch = match[1].match(/Label="([^"]+)"/);
            const label = labelMatch ? `${labelMatch[1]}: ` : "";
            return label + cleanXml(match[2]);
          })
          .filter(Boolean)
          .join("\n\n");
      }

      return {
        pmid: id,
        title: item?.title ?? "Untitled",
        authors:
          item?.authors?.map(
            (author: { name: string }) => author.name
          ) ?? [],
        journal: item?.fulljournalname ?? "",
        year: item?.pubdate ?? "",
        abstract: abstract || "Abstract is not available for this article.",
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      };
    });

    return NextResponse.json({
      articles,
      total: Number(searchData.esearchresult.count || 0),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to retrieve articles from PubMed." },
      { status: 500 }
    );
  }
}
