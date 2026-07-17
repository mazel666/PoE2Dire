  const CONFIG = {
    apiEndpoints: [
      { name: "PoE2Wiki", api: "https://www.poe2wiki.net/api.php" },
      { name: "PoEWiki", api: "https://www.poewiki.net/api.php" },
    ],
    apiUserAgent: "PoE2Dire (https://github.com/aisatan/PoE2Dire)",
    wikiLookupConcurrency: 2,
    wikiRequestConcurrency: 1,
    wikiImageConcurrency: 2,
    wikiBatchSize: 40,
    iconThumbWidth: 108,
    fallbackIcon: "https://www.poewiki.net/images/b/b6/Scroll_of_Wisdom_inventory_icon.png",
    cache: {
      namespacePrefix: "PoE2DireCache",
      namespace: "PoE2DireCache-10-07-2026",
      // 1 year — a storage cleanup ceiling, not a freshness guarantee. Freshness for
      // revision-tracked icons (file-based lookups) is enforced by revalidateAfterMs
      // below; icons without a tracked revision just ride on this TTL alone.
      hitTtlMs: 365 * 24 * 60 * 60 * 1000,
      // 7 days
      missTtlMs: 7 * 24 * 60 * 60 * 1000,
      // How long a revision-tracked icon is trusted before we cheaply re-check its
      // wiki "touched" timestamp and refetch if the underlying file actually changed.
      revalidateAfterMs: 6 * 60 * 60 * 1000,
    },
    network: {
      retries: 2,
      retryDelayMs: 650,
      // Floor is >= 1s on purpose — spread the extra as random jitter (below),
      // not as a shorter floor, so we never dip under 1s between requests.
      minRequestIntervalMs: 1000,
      minRequestIntervalJitterMs: 400,
      maxRetryDelayMs: 30000,
      challengeCooldownMs: 60000,
      maxCooldownMs: 120000,
      userscriptTimeoutMs: 30000,
    },
    ui: {
      tooltipShowDelayMs: 500,
      keywordShowDelayMs: 220,
      tooltipHideDelayMs: 120,
      statusErrorHideMs: 8000,
    },
  };

  const state = {
    renderRunId: 0,
    wikiDone: false,
    viewport: null,
    wikiEndpoints: null,
    iconStatus: null,
    retryWaitMs: 0,
    wikiCooldownUntil: 0,
    wikiCooldownReason: "",
  };
