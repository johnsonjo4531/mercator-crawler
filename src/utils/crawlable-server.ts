import * as http from "http";
import * as url from "url";
import * as fs from "fs";
import * as path from "path";

export function staticServer(rootPath: string) {
	const mimeType: Record<string, string> = {
		".ico": "image/x-icon",
		".html": "text/html",
		".js": "text/javascript",
		".json": "application/json",
		".css": "text/css",
		".png": "image/png",
		".jpg": "image/jpeg",
		".wav": "audio/wav",
		".mp3": "audio/mpeg",
		".svg": "image/svg+xml",
		".pdf": "application/pdf",
		".zip": "application/zip",
		".doc": "application/msword",
		".eot": "application/vnd.ms-fontobject",
		".ttf": "application/x-font-ttf",
	};
	const server = http.createServer(function (req, res) {
		console.log(`${req.method} ${req.url}`);

		// parse URL
		const parsedUrl = new URL(`${req.url}`, `http://${req.headers.host}`);

		const sanitizePath = path
			.normalize(parsedUrl.pathname)
			.replace(/^(\.\.[\/\\])+/, "");
		let pathname = path.join(__dirname, rootPath, sanitizePath);

		fs.access(pathname, function (err) {
			if (err) {
				// if the file is not found, return 404
				res.statusCode = 404;
				res.end(`File ${pathname} not found!`);
				return;
			}

			// if is a directory, then look for index.html
			if (fs.statSync(pathname).isDirectory()) {
				pathname += "/index.html";
			}

			// read file from file system
			fs.readFile(pathname, function (err, data) {
				if (err) {
					res.statusCode = 500;
					res.end(`Error getting the file: ${err}.`);
				} else {
					// based on the URL path, extract the file extention. e.g. .js, .doc, ...
					const ext = path.parse(pathname).ext;
					// if the file is found, set Content-type and send data
					res.setHeader("Content-type", mimeType[ext] ?? "text/plain");
					res.end(data);
				}
			});
		});
	});

	return server;
}
