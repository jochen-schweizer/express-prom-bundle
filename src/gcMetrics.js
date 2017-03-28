const optional = require('optional');
const gc = optional('gc-stats');

module.exports = function(promClient, opts) {
  opts = opts || {};

  if (typeof gc !== 'function') {
    return;
  }

  const gcTypes = opts.gcType || {
    0: 'Unknown',
    1: 'Scavenge',
    2: 'MarkSweepCompact',
    3: 'ScavengeAndMarkSweepCompact',
    4: 'IncrementalMarking',
    8: 'WeakPhantom',
    15: 'All',
  };

  const gcCount = new promClient.Counter('nodejs_gc_runs_total', 'Count of total garbage collections.', ['gctype']);
  const gcTimeCount = new promClient.Counter('nodejs_gc_pause_seconds_total', 'Time spent in GC Pause in seconds.', ['gctype']);
  const gcReclaimedCount = new promClient.Counter('nodejs_gc_reclaimed_bytes_total', 'Total number of bytes reclaimed by GC.', [
    'gctype',
  ]);

  let started = false;

  if (started !== true) {
    started = true;
    gc().on('stats', stats => {
      const gcType = gcTypes[stats.gctype];

      gcCount.labels(gcType).inc();
      gcTimeCount.labels(gcType).inc(stats.pause / 1e9);

      if (stats.diff.usedHeapSize < 0) {
        gcReclaimedCount.labels(gcType).inc(stats.diff.usedHeapSize * -1);
      }
    });
  }
}
