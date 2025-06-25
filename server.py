# server.py
from http.server import HTTPServer, SimpleHTTPRequestHandler

class COIHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cross-Origin-Resource-Policy", "cross-origin")
        super().end_headers()

if __name__ == "__main__":
    HTTPServer(("localhost", 8888), COIHandler).serve_forever()