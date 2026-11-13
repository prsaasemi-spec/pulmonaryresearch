
import { NextResponse } from "next/server";

function cleanXml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16))
    )
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCodePoint(Number(code))
    )
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query?.trim()) {
    return NextResponse.json(
      { error: "Please enter a search term." },
      { status: 400 }
    );
  }

  try {
    const searchUrl = new URL(
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    );

    searchUrl.searchParams.set("db", "pubmed");
    searchUrl.searchParams.set("term", query);
    searchUrl.searchParams.set("retmax", "10");
    searchUrl.searchParams.set("retmode", "json");

    const searchResponse = await fetch(searchUrl.toString());

    if (!searchResponse.ok) {
      throw new Error("PubMed search failed");
    }

    const searchData = await searchResponse.json();
    const ids: string[] = searchData.esearchresult.idlist;

    if (ids.length === 0) {
      return NextResponse.json({ articles: [] });
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
        authors: item?.authors?.map(
          (author: { name: string }) => author.name
        ) ?? [],
        journal: item?.fulljournalname ?? "",
        year: item?.pubdate ?? "",
        abstract: abstract || "Abstract is not available for this article.",
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      };
    });

    return NextResponse.json({ articles });
  } catch {
    return NextResponse.json(
      { error: "Unable to retrieve articles from PubMed." },
      { status: 500 }
    );
  }
}
