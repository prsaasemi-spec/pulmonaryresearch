
"use client";

import { useState } from "react";

type Article = {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: string;
  abstract: string;
  url: string;
};

const topics = [
  { name: "Interstitial Lung Disease", query: "interstitial lung disease" },
  { name: "COPD", query: "COPD" },
  { name: "Asthma", query: "asthma" },
  { name: "Critical Care", query: "pulmonary critical care" },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [articleType, setArticleType] = useState("");
  const [sort, setSort] = useState("relevance");
  const [limit, setLimit] = useState("10");
  const [total, setTotal] = useState(0);

  async function searchPubMed(term: string) {
    if (!term.trim()) return;

    setSearch(term);
    setLoading(true);
    setError("");
    setSearched(true);
    setArticles([]);

    try {
      const params = new URLSearchParams({
        q: term,
        sort,
        limit,
      });

      if (startYear) params.set("startYear", startYear);
      if (endYear) params.set("endYear", endYear);
      if (articleType) params.set("type", articleType);

      const response = await fetch(`/api/pubmed?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setArticles(data.articles || []);
      setTimeout(() => {
        document.getElementById("articles")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
      setTotal(data.total || 0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to PubMed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#172b45]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="#" className="text-2xl font-bold tracking-tight">
            Pulmo<span className="text-teal-600">Research</span>
          </a>

          <nav className="hidden gap-8 text-sm font-medium md:flex">
            <a href="#articles" className="hover:text-teal-600">Discover</a>
            <a href="#topics" className="hover:text-teal-600">Topics</a>
            <a href="#about" className="hover:text-teal-600">About</a>
          </nav>

          <a
            href="#articles"
            className="rounded-lg bg-[#12334d] px-5 py-3 text-sm text-white"
          >
            Explore research
          </a>
        </div>
      </header>

      <section className="bg-[#102d45] px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="mb-6 text-sm font-semibold uppercase tracking-[0.25em] text-teal-300">
            Advancing respiratory medicine
          </p>

          <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Discover knowledge.
            <br />
            Advance pulmonary research.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
            Discover scientific literature and explore the latest research
            in respiratory medicine through PubMed.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              searchPubMed(search);
            }}
            className="mt-10 flex max-w-2xl flex-col gap-3 rounded-xl bg-white p-2 sm:flex-row"
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search asthma, COPD, ILD..."
              className="min-w-0 flex-1 rounded-lg px-4 py-3 text-sm text-slate-900 outline-none"
            />

            <button
              type="submit"
              disabled={loading || !search.trim()}
              className="rounded-lg bg-teal-600 px-7 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search PubMed"}
            </button>
          </form>

          <p className="mt-4 text-xs text-slate-400">
            Powered by the NCBI PubMed database.
          </p>
        </div>
      </section>

      <section id="topics" className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">
          Explore by specialty
        </p>

        <h2 className="mb-8 mt-2 text-3xl font-bold">
          Research topics
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {topics.map((topic, index) => (
            <button
              key={topic.name}
              onClick={() => {
                searchPubMed(topic.query);
                document.getElementById("articles")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
              className="rounded-xl border border-slate-200 bg-white p-6 text-left transition hover:-translate-y-1 hover:border-teal-400 hover:shadow-lg"
            >
              <span className="text-sm font-semibold text-teal-700">
                0{index + 1}
              </span>

              <h3 className="mt-5 text-lg font-bold">{topic.name}</h3>

              <p className="mt-3 text-sm text-slate-500">
                Explore research →
              </p>
            </button>
          ))}
        </div>
      </section>

      <section id="articles" className="bg-white px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">
            Literature discovery
          </p>

          <h2 className="mt-2 text-3xl font-bold">Scientific articles</h2>

          <p className="mt-3 text-slate-500">
            Search and discover real scientific publications from PubMed.
          </p>

          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="mb-5 text-lg font-bold">Advanced search filters</h3>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  From year
                </label>
                <input
                  type="number"
                  min="1900"
                  max={2026}
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  placeholder="2020"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  To year
                </label>
                <input
                  type="number"
                  min="1900"
                  max={2026}
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  placeholder="2026"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Article type
                </label>
                <select
                  value={articleType}
                  onChange={(e) => setArticleType(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
                >
                  <option value="">All types</option>
                  <option value="Clinical Trial">Clinical Trial</option>
                  <option value="Randomized Controlled Trial">
                    Randomized Controlled Trial
                  </option>
                  <option value="Review">Review</option>
                  <option value="Systematic Review">Systematic Review</option>
                  <option value="Meta-Analysis">Meta-Analysis</option>
                  <option value="Case Reports">Case Reports</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Sort by
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
                >
                  <option value="relevance">Best match</option>
                  <option value="date">Newest first</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Results per search
                </label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm sm:w-40"
                >
                  <option value="10">10 articles</option>
                  <option value="20">20 articles</option>
                  <option value="50">50 articles</option>
                </select>
              </div>

              <button
                onClick={() => searchPubMed(search)}
                disabled={loading || !search.trim()}
                className="rounded-lg bg-teal-700 px-7 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                Apply filters
              </button>
            </div>
          </div>

          {loading && (
            <div className="py-16 text-center text-teal-700">
              Searching PubMed database...
            </div>
          )}

          {error && (
            <div className="mt-8 rounded-xl bg-red-50 p-6 text-red-700">
              {error}
            </div>
          )}

          {!loading && searched && !error && articles.length === 0 && (
            <div className="mt-8 rounded-xl bg-slate-50 p-8 text-center text-slate-500">
              No articles found. Try another search term or filter.
            </div>
          )}

          {!loading && articles.length > 0 && (
            <>
              <p className="mb-6 mt-8 text-sm text-slate-500">
                Showing {articles.length} of {total} matching results from PubMed
              </p>

              <div className="grid gap-5 lg:grid-cols-2">
                {articles.map((article) => (
                  <article
                    key={article.pmid}
                    className="rounded-xl border border-slate-200 p-6 transition hover:border-teal-400 hover:shadow-lg"
                  >
                    <span className="text-xs font-bold tracking-wider text-teal-700">
                      PUBMED PUBLICATION
                    </span>

                    <h3 className="mt-4 text-lg font-bold leading-8">
                      {article.title}
                    </h3>

                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {article.authors.slice(0, 5).join(", ")}
                      {article.authors.length > 5 ? " et al." : ""}
                    </p>

                    <p className="mt-3 text-sm text-slate-500">
                      {article.journal}
                    </p>

                    <details className="mt-4 rounded-lg bg-slate-50 p-4">
                      <summary className="cursor-pointer font-semibold text-teal-800">
                        Read Abstract
                      </summary>
                      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                        {article.abstract}
                      </p>
                    </details>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
                      <span className="text-slate-500">{article.year}</span>
                      <span className="text-slate-500">PMID: {article.pmid}</span>

                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-teal-700 hover:text-teal-900"
                      >
                        View on PubMed →
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {!searched && (
            <div className="mt-10 rounded-xl bg-slate-50 p-10 text-center">
              <h3 className="text-xl font-bold">
                Start exploring pulmonary research
              </h3>
              <p className="mt-3 text-slate-500">
                Enter a keyword above or choose a research topic.
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-2xl bg-[#e8f4f4] p-10 md:p-14">
          <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
            Our mission
          </p>

          <h2 className="mt-4 max-w-2xl text-3xl font-bold">
            Bringing the respiratory research community closer together.
          </h2>

          <p className="mt-5 max-w-2xl leading-8 text-slate-600">
            PulmoResearch aims to make scientific discovery easier through
            organized literature, research collaboration and access to
            knowledge in pulmonary medicine.
          </p>
        </div>
      </section>

      <footer className="bg-[#102d45] px-6 py-8 text-center text-sm text-slate-300">
        Copyright 2026 PulmoResearch - A platform for respiratory research
      </footer>
    </main>
  );
}

