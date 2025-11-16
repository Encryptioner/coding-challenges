#!/usr/bin/env python3
"""
Markdown to PDF Web Application
A simple web server for the markdown editor.
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import urllib.parse
from markdown_parser import MarkdownParser
import os


class MarkdownHandler(SimpleHTTPRequestHandler):
    """Custom HTTP handler for markdown conversion."""

    def do_GET(self):
        """Handle GET requests."""
        if self.path == '/' or self.path == '/index.html':
            self.path = '/templates/index.html'
        elif self.path.startswith('/static/'):
            # Serve static files
            pass

        return SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        """Handle POST requests for markdown conversion."""
        if self.path == '/convert':
            # Read POST data
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)

            # Parse JSON
            try:
                data = json.loads(post_data.decode('utf-8'))
                markdown_text = data.get('markdown', '')
                custom_css = data.get('css', '')

                # Convert markdown to HTML
                parser = MarkdownParser()
                html_body = parser.parse(markdown_text)

                # Send response
                response = {
                    'html': html_body,
                    'success': True
                }

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))

            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                error_response = {
                    'error': str(e),
                    'success': False
                }
                self.wfile.write(json.dumps(error_response).encode('utf-8'))

        else:
            self.send_response(404)
            self.end_headers()

    def end_headers(self):
        """Add CORS headers."""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        SimpleHTTPRequestHandler.end_headers(self)


def run_server(port=8000):
    """Run the web server."""
    server_address = ('', port)
    httpd = HTTPServer(server_address, MarkdownHandler)

    print(f"Markdown to PDF Server")
    print(f"=====================")
    print(f"Server running on http://localhost:{port}")
    print(f"Open your browser and navigate to the URL above")
    print(f"Press Ctrl+C to stop the server")
    print()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        httpd.server_close()


if __name__ == '__main__':
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    run_server(8000)
