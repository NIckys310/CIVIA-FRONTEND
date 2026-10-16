import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.zip.GZIPOutputStream;

/**
 * Servidor web de CIVIA-FRONTEND, solo con el JDK (Java 21+), sin dependencias.
 *
 * <p>Sirve la interfaz de {@code web/} y reenvía {@code /api/*} al backend (CIVIA-BACKEND), así el
 * navegador ve un único origen: cookies SameSite=Strict, sin CORS y CSP estricta.
 *
 * <pre>
 *   java server/CiviaWeb.java                       # puerto 3000, API en http://localhost:8080
 *   java server/CiviaWeb.java --port 3000 --api https://civia-api.onrender.com
 * </pre>
 *
 * <p>No hace falta si ejecutas el backend: este ya sirve la interfaz en el mismo puerto.
 */
public final class CiviaWeb {

    private static final Map<String, String> TYPES = Map.ofEntries(
            Map.entry("html", "text/html; charset=utf-8"), Map.entry("css", "text/css; charset=utf-8"),
            Map.entry("js", "text/javascript; charset=utf-8"), Map.entry("json", "application/json"),
            Map.entry("webmanifest", "application/manifest+json"), Map.entry("png", "image/png"),
            Map.entry("jpg", "image/jpeg"), Map.entry("svg", "image/svg+xml"), Map.entry("ico", "image/x-icon"),
            Map.entry("woff2", "font/woff2"), Map.entry("txt", "text/plain; charset=utf-8"));

    private static final Set<String> HOP_BY_HOP = Set.of("connection", "keep-alive", "transfer-encoding", "te",
            "trailer", "upgrade", "proxy-authorization", "proxy-authenticate", "host", "content-length", "expect");

    private static final String CSP = String.join("; ",
            "default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:", "img-src 'self' data: blob:", "media-src 'self' blob:",
            "connect-src 'self' blob: data:", "worker-src 'self' blob:", "frame-src 'self' blob:", "object-src 'none'",
            "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'");

    private final Path root;
    private final URI api;
    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();

    private CiviaWeb(Path root, URI api) {
        this.root = root.toAbsolutePath().normalize();
        this.api = api;
    }

    public static void main(String[] args) throws IOException {
        int port = Integer.parseInt(arg(args, "--port", System.getenv().getOrDefault("PORT", "3000")));
        String apiUrl = arg(args, "--api", System.getenv().getOrDefault("CIVIA_API_URL", "http://localhost:8080"));
        Path web = Path.of(arg(args, "--web", "web"));
        if (!Files.isDirectory(web)) web = Path.of("..", "web");
        CiviaWeb app = new CiviaWeb(web, URI.create(apiUrl.replaceAll("/+$", "")));

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
        server.createContext("/", app::handle);
        server.start();
        System.out.println("CIVIA AI · interfaz en http://localhost:" + port + " · API → " + apiUrl);
    }

    private static String arg(String[] args, String name, String fallback) {
        for (int i = 0; i + 1 < args.length; i++) if (args[i].equals(name)) return args[i + 1];
        return fallback;
    }

    private void handle(HttpExchange ex) throws IOException {
        try (ex) {
            String path = ex.getRequestURI().getRawPath();
            if (path.startsWith("/api/")) {
                proxy(ex);
            } else {
                serve(ex, path);
            }
        } catch (Exception e) {
            System.err.println("Error en " + ex.getRequestURI() + ": " + e.getMessage());
        }
    }

    private static void securityHeaders(Headers h) {
        h.set("Content-Security-Policy", CSP);
        h.set("X-Content-Type-Options", "nosniff");
        h.set("X-Frame-Options", "DENY");
        h.set("Referrer-Policy", "strict-origin-when-cross-origin");
        h.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=(self), payment=()");
        h.set("Cross-Origin-Opener-Policy", "same-origin");
    }

    private void serve(HttpExchange ex, String rawPath) throws IOException {
        if (!"GET".equals(ex.getRequestMethod()) && !"HEAD".equals(ex.getRequestMethod())) {
            ex.sendResponseHeaders(405, -1);
            return;
        }
        String path = java.net.URLDecoder.decode(rawPath, java.nio.charset.StandardCharsets.UTF_8);
        if (path.equals("/")) path = "/index.html";
        Path file = root.resolve(path.substring(1)).normalize();
        if (!file.startsWith(root) || !Files.isRegularFile(file)) {
            file = root.resolve("index.html");
        }
        String name = file.getFileName().toString();
        String ext = name.contains(".") ? name.substring(name.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT) : "";
        Headers h = ex.getResponseHeaders();
        securityHeaders(h);
        h.set("Content-Type", TYPES.getOrDefault(ext, "application/octet-stream"));
        String rel = root.relativize(file).toString().replace(java.io.File.separatorChar, '/');
        boolean longCache = rel.startsWith("vendor/") || rel.startsWith("assets/");
        h.set("Cache-Control", longCache ? "public, max-age=2592000" : "no-cache");
        h.set("Last-Modified", java.time.format.DateTimeFormatter.RFC_1123_DATE_TIME.format(
                Files.getLastModifiedTime(file).toInstant().atZone(java.time.ZoneOffset.UTC)));

        byte[] body = Files.readAllBytes(file);
        boolean gzip = body.length > 1024 && (ext.equals("js") || ext.equals("css") || ext.equals("html") || ext.equals("json"))
                && String.valueOf(ex.getRequestHeaders().getFirst("Accept-Encoding")).contains("gzip");
        if (gzip) {
            var buffer = new java.io.ByteArrayOutputStream();
            try (GZIPOutputStream gz = new GZIPOutputStream(buffer)) {
                gz.write(body);
            }
            body = buffer.toByteArray();
            h.set("Content-Encoding", "gzip");
            h.set("Vary", "Accept-Encoding");
        }
        if ("HEAD".equals(ex.getRequestMethod())) {
            ex.sendResponseHeaders(200, -1);
            return;
        }
        ex.sendResponseHeaders(200, body.length);
        try (OutputStream out = ex.getResponseBody()) {
            out.write(body);
        }
    }

    /** Reenvía la petición al backend en streaming (sirve también para subir planos y modelos grandes). */
    private void proxy(HttpExchange ex) throws IOException, InterruptedException {
        URI target = URI.create(api + ex.getRequestURI().getRawPath()
                + (ex.getRequestURI().getRawQuery() == null ? "" : "?" + ex.getRequestURI().getRawQuery()));
        String method = ex.getRequestMethod();
        HttpRequest.BodyPublisher body = switch (method) {
            case "GET", "HEAD", "DELETE", "OPTIONS" -> HttpRequest.BodyPublishers.noBody();
            default -> HttpRequest.BodyPublishers.ofInputStream(ex::getRequestBody);
        };
        HttpRequest.Builder req = HttpRequest.newBuilder(target).method(method, body).timeout(Duration.ofMinutes(10));
        ex.getRequestHeaders().forEach((k, values) -> {
            if (!HOP_BY_HOP.contains(k.toLowerCase(Locale.ROOT))) values.forEach(v -> req.header(k, v));
        });
        req.header("X-Forwarded-For", ex.getRemoteAddress().getAddress().getHostAddress());
        req.header("X-Forwarded-Proto", "http");

        HttpResponse<InputStream> res;
        try {
            res = client.send(req.build(), HttpResponse.BodyHandlers.ofInputStream());
        } catch (IOException e) {
            byte[] msg = "{\"status\":502,\"message\":\"No se pudo conectar con la API de CIVIA.\"}".getBytes();
            ex.getResponseHeaders().set("Content-Type", "application/json");
            ex.sendResponseHeaders(502, msg.length);
            ex.getResponseBody().write(msg);
            return;
        }
        Headers h = ex.getResponseHeaders();
        res.headers().map().forEach((k, values) -> {
            if (!HOP_BY_HOP.contains(k.toLowerCase(Locale.ROOT)) && !k.startsWith(":")) h.put(k, List.copyOf(values));
        });
        long length = res.headers().firstValueAsLong("content-length").orElse(0);
        ex.sendResponseHeaders(res.statusCode(), "HEAD".equals(method) || res.statusCode() == 204 ? -1 : length);
        try (InputStream in = res.body(); OutputStream out = ex.getResponseBody()) {
            in.transferTo(out);
        }
    }
}
