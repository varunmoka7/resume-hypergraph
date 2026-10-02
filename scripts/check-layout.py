# Layout check: every sample at four desktop sizes, no overlapping labels, nothing off screen.
# Run: python3 scripts/serve.py 8131 &   then   browser-harness < scripts/check-layout.py
import os, time

base = os.environ.get("SITE_CHECK_URL", "http://localhost:8131")
new_tab(base + "/view/#work")
cdp("Network.enable")
cdp("Network.setCacheDisabled", cacheDisabled=True)
cdp("Emulation.setEmulatedMedia", features=[{"name": "prefers-reduced-motion", "value": "reduce"}])
for width, height in ((1024, 768), (1280, 720), (1440, 900), (1920, 1080)):
    cdp("Emulation.setDeviceMetricsOverride", width=width, height=height, deviceScaleFactor=1, mobile=False)
    for sample in ("short", "profile", "long"):
        goto_url(f"{base}/view/?p={sample}&w={width}#work")
        wait_for_load()
        time.sleep(.7)
        r = js("""(() => {
          const boxes = [...document.querySelectorAll('.net .nn')].map(e => ({id: e.dataset.id, r: e.getBoundingClientRect()}));
          const hit = [];
          for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i].r, b = boxes[j].r;
            if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) hit.push(boxes[i].id + ' x ' + boxes[j].id);
          }
          const off = boxes.filter(b => b.r.left < 0 || b.r.right > innerWidth || b.r.top < 0 || b.r.bottom > innerHeight).map(b => b.id);
          return {n: boxes.length, hit, off};
        })()""")
        assert r["n"] > 0 and not r["hit"] and not r["off"], (width, sample, r)
        print(f"{width}x{height} {sample}: {r['n']} nodes, no overlaps, all on screen")
cdp("Emulation.clearDeviceMetricsOverride")
