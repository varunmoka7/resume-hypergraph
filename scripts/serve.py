# Local preview server that tells the browser never to cache, so a plain reload shows the latest files.
# Usage: python3 scripts/serve.py [port]   (default 8124), run from the repo root
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8124
print(f"http://localhost:{port}/")
ThreadingHTTPServer(("127.0.0.1", port), NoCache).serve_forever()
