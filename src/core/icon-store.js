  function createIconStore() {
    return createTtlStore() || nullIconStore();
  }

  // Reads cached results and returns the subset of found icons that are old
  // enough to warrant a cheap revision check (see revalidateCachedIcons). Entries
  // without a tracked revision (e.g. from the page-scrape lookup path) aren't
  // included — they're trusted for the full TTL with no revalidation.
  async function readStoredIconResults(store, jobs, storeKeys, resolved, knownMissing) {
    let stored = new Map();
    try {
      stored = await store.getMany(Array.from(storeKeys.values()));
    } catch (error) {
      return [];
    }

    const dueForRecheck = [];

    for (const job of jobs) {
      const key = storeKeys.get(job.key);
      const entry = stored.get(key);
      if (!entry) continue;

      if (entry.url) {
        resolved.set(job.key, { url: entry.url, source: entry.source || "icon-cache" });
        if (entry.revisionTitle && isDueForRecheck(entry)) {
          dueForRecheck.push({ job, key, entry });
        }
      } else if (entry.missing) {
        if (shouldCacheMissingIcon(job)) knownMissing.add(job.key);
      }
    }

    return dueForRecheck;
  }

  function isDueForRecheck(entry) {
    const checkedAt = entry.checkedAt || entry.cachedAt || 0;
    return Date.now() - checkedAt > CONFIG.cache.revalidateAfterMs;
  }

  // Persists a single job's outcome the moment it's known, rather than batching
  // every result until resolveIcons fully finishes. A patch page can have hundreds
  // of icons to resolve at one-request-per-250ms, so waiting for the whole batch
  // risked losing every already-resolved icon (not just the failed ones) if the
  // user navigated away, closed the tab, or a single storage write threw, before
  // that final write ever ran.
  async function persistIconResult(store, key, job, image) {
    if (!key) return;
    if (!image && !shouldCacheMissingIcon(job)) return;

    const entry = image ? {
      url: image.url,
      source: image.source,
      revisionTitle: image.revisionTitle || null,
      touchedAt: image.touchedAt || null,
      cachedAt: Date.now(),
      checkedAt: Date.now(),
      expiresAt: Date.now() + CONFIG.cache.hitTtlMs,
    } : {
      missing: true,
      cachedAt: Date.now(),
      expiresAt: Date.now() + CONFIG.cache.missTtlMs,
    };

    try {
      await store.set(key, entry);
    } catch (error) {
      console.warn(`[PoE2Dire] Failed to cache wiki icon for "${job.title}":`, error);
    }
  }

  function shouldCacheMissingIcon(job) {
    return job.kind !== "support";
  }

  function nullIconStore() {
    return {
      get: async () => null,
      set: async () => {},
      getMany: async () => new Map(),
      setMany: async () => {},
      removeMany: async () => {},
    };
  }

  function iconStoreKey(scope, title, kind) {
    return CONFIG.cache.namespace + [
      scope,
      kind || "general",
      normalKey(title),
    ].map(encodeURIComponent).join(":");
  }
