import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Random;

/**
 * Genera la escena de la ciudad a la hora dorada (pantalla de carga y acceso) en capas SVG.
 *
 * <pre>java tools/GenerateScene.java</pre>
 *
 * Escribe en web/assets/scene/:
 * <ul>
 *   <li>far.svg: bruma lejana (siluetas en violeta cálido)</li>
 *   <li>mid.svg: ciudad media con borde dorado del lado del sol</li>
 *   <li>near.svg: arquitectura cercana: fachadas con patrón de ventanas, torres escalonadas, techo
 *       inclinado, cúpula, grúa, calle, árboles y faroles</li>
 *   <li>lights.svg: ventanas encendidas y vestíbulos (capa aparte: se encienden con un fundido)</li>
 * </ul>
 * Todas comparten viewBox 0 0 1920 640 y la línea de suelo en y = 560, así que se apilan con
 * object-fit: cover y object-position: bottom sin desalinearse. Usa semillas fijas: la escena es
 * siempre la misma. No requiere dependencias: basta el JDK 21.
 */
public class GenerateScene {
    static final int W = 1920, H = 640, BASE = 560;
    /** El sol bajo queda detrás de este punto (≈40 %): los edificios cercanos son más bajos ahí. */
    static final int SUN_X = 780;

    /** Generador con semilla y los mismos ayudantes que se usaban (enteros inclusivos y uniformes). */
    static final class Rnd {
        private final Random r;
        Rnd(long seed) { r = new Random(seed); }
        double random() { return r.nextDouble(); }
        int randint(int a, int b) { return a + r.nextInt(b - a + 1); }
        double uniform(double a, double b) { return a + (b - a) * r.nextDouble(); }
    }

    /** Número con un decimal y sin ceros sobrantes (12.0 → "12", 12.5 → "12.5"). */
    static String f(double n) {
        String s = String.format(Locale.ROOT, "%.1f", n);
        if (s.contains(".")) s = s.replaceAll("0+$", "").replaceAll("\\.$", "");
        return s.equals("-0") ? "0" : s;
    }

    static String svg(String body, String defs) {
        return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 " + W + " " + H + "\" preserveAspectRatio=\"xMidYMax slice\">"
                + "<defs>" + defs + "</defs>" + body + "</svg>\n";
    }

    /** 0 lejos del sol … 1 justo delante: los edificios se abren alrededor del sol. */
    static double nearSun(double x, double w) {
        double d = Math.abs((x + w / 2) - SUN_X);
        return Math.max(0.0, 1 - d / 420);
    }

    /** Borde iluminado del lado que mira al sol. */
    static String rim(double x, double y, double w, double h, String color, double width) {
        double rx = (x + w / 2) < SUN_X ? x + w - width : x;
        return "<rect x=\"" + f(rx) + "\" y=\"" + f(y) + "\" width=\"" + f(width) + "\" height=\"" + f(h) + "\" fill=\"" + color + "\"/>";
    }

    static String rect(double x, double y, double w, double h) {
        return "<rect x=\"" + f(x) + "\" y=\"" + f(y) + "\" width=\"" + f(w) + "\" height=\"" + f(h) + "\"/>";
    }

    static String glowColor(double alpha) {
        return String.format(Locale.ROOT, "%.2f", alpha);
    }

    // ---------------------------------------------------------------- lejana
    static String far() {
        Rnd r = new Rnd(11);
        StringBuilder out = new StringBuilder();
        int x = -20;
        while (x < W + 20) {
            int w = r.randint(46, 110);
            double h = r.randint(110, 250) + (r.random() < 0.14 ? 1 : 0) * r.randint(60, 120);
            h *= 1 - 0.35 * nearSun(x, w);
            double y = BASE - 40 - h;
            out.append(rect(x, y, w, BASE - y));
            if (r.random() < 0.18) out.append(rect(x + w / 2.0 - 1, y - 26, 2, 26)); // antena
            x += w + r.randint(-14, 8);
        }
        String defs = "<linearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">"
                + "<stop offset=\"0\" stop-color=\"#b07a92\"/><stop offset=\"1\" stop-color=\"#7a5576\"/></linearGradient>";
        return svg("<g fill=\"url(#g)\" opacity=\".55\">" + out + "</g>", defs);
    }

    // ---------------------------------------------------------------- media
    static String mid() {
        Rnd r = new Rnd(23);
        StringBuilder bodies = new StringBuilder(), rims = new StringBuilder(), wins = new StringBuilder();
        int x = -30;
        while (x < W + 30) {
            int w = r.randint(54, 120);
            double h = r.randint(90, 220) + (r.random() < 0.18 ? 1 : 0) * r.randint(50, 110);
            h *= 1 - 0.45 * nearSun(x, w);
            double y = BASE - 18 - h;
            bodies.append(rect(x, y, w, BASE - y));
            if (r.random() < 0.3) { // remate escalonado
                double sw = w * r.uniform(0.35, 0.6);
                int sh = r.randint(18, 40);
                bodies.append(rect(x + (w - sw) / 2, y - sh, sw, sh));
            }
            double glow = 0.25 + 0.55 * Math.max(0.0, 1 - Math.abs(x + w / 2.0 - SUN_X) / 900);
            rims.append(rim(x, y, w, BASE - y, "rgba(255,186,118," + glowColor(glow) + ")", 1.6));
            for (int wy = (int) y + 10; wy < BASE - 30; wy += 13) {
                for (int wx = x + 6; wx < x + w - 8; wx += 10) {
                    if (r.random() < 0.16) wins.append(rect(wx, wy, 4, 6));
                }
            }
            x += w + r.randint(-10, 10);
        }
        String defs = "<linearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">"
                + "<stop offset=\"0\" stop-color=\"#5a3d5c\"/><stop offset=\"1\" stop-color=\"#2a2034\"/></linearGradient>";
        String body = "<g fill=\"url(#g)\">" + bodies + "</g><g>" + rims + "</g>"
                + "<g fill=\"#ffcf8a\" opacity=\".8\">" + wins + "</g>";
        return svg(body, defs);
    }

    // ---------------------------------------------------------------- cercana
    /** Devuelve {near.svg, lights.svg}. */
    static String[] near() {
        Rnd r = new Rnd(37);
        StringBuilder bodies = new StringBuilder(), facades = new StringBuilder(), rims = new StringBuilder();
        StringBuilder extra = new StringBuilder(), lit = new StringBuilder();

        int x = -40;
        String[] kinds = {"step", "plain", "slant", "plain", "dome", "plain", "step", "slant"};
        int i = 0;
        while (x < W + 40) {
            int w = r.randint(90, 170);
            double open = nearSun(x, w);
            double h = (r.randint(220, 400) + (r.random() < 0.22 ? 1 : 0) * r.randint(70, 130)) * (1 - 0.72 * open);
            if (open > 0.55) h = r.randint(40, 70); // delante del sol: plazas y edificios bajos
            String kind = open < 0.4 ? kinds[i % kinds.length] : "plain";

            double y = BASE - h;
            bodies.append(rect(x, y, w, h));
            double top = y;
            switch (kind) {
                case "step" -> { // torre escalonada
                    double sw = w * 0.62; int sh = r.randint(36, 70);
                    bodies.append(rect(x + (w - sw) / 2, y - sh, sw, sh));
                    double sw2 = sw * 0.55; int sh2 = r.randint(20, 40);
                    bodies.append(rect(x + (w - sw2) / 2, y - sh - sh2, sw2, sh2));
                    extra.append(rect(x + w / 2.0 - 1, y - sh - sh2 - 34, 2.2, 34));
                    top = y - sh - sh2;
                }
                case "slant" -> { // techo inclinado contemporáneo
                    int rise = r.randint(26, 48);
                    bodies.append("<polygon points=\"" + x + "," + f(y) + " " + (x + w) + "," + f(y) + " " + (x + w) + "," + f(y - rise) + "\"/>");
                }
                case "dome" -> {
                    double rad = w * 0.36; double cx = x + w / 2.0;
                    bodies.append(rect(cx - rad - 6, y - 14, 2 * rad + 12, 14));
                    bodies.append("<path d=\"M" + f(cx - rad) + " " + f(y - 14) + "A" + f(rad) + " " + f(rad) + " 0 0 1 " + f(cx + rad) + " " + f(y - 14) + "Z\"/>");
                    extra.append(rect(cx - 1.2, y - 14 - rad - 22, 2.4, 22));
                    rims.append("<path d=\"M" + f(cx - rad) + " " + f(y - 14) + "A" + f(rad) + " " + f(rad) + " 0 0 1 " + f(cx + rad) + " " + f(y - 14)
                            + "\" fill=\"none\" stroke=\"rgba(255,196,128,.55)\" stroke-width=\"2\"/>");
                }
                default -> { }
            }
            // Fachada con patrón de ventanas (apagadas) y algunas encendidas, alineadas a la retícula.
            int fx0 = x + 8, fx1 = x + w - 8;
            double fy0 = y + 14, fy1 = BASE - 26;
            facades.append(rect(fx0, fy0, fx1 - fx0, fy1 - fy0));
            List<Integer> cols = new ArrayList<>();
            for (int c = 0; c < W; c += 12) if (fx0 <= c + 3 && c + 9 <= fx1) cols.add(c);
            List<Integer> rows = new ArrayList<>();
            for (int rw = 0; rw < BASE; rw += 16) if (fy0 <= rw + 4 && rw + 13 <= fy1) rows.add(rw);
            for (int c : cols) for (int rw : rows) if (r.random() < 0.34) lit.append(rect(c + 3, rw + 4, 6, 9));
            // Vestíbulo iluminado a nivel de calle.
            if (r.random() < 0.6) {
                double lw = w * r.uniform(0.35, 0.7);
                lit.append("<rect x=\"" + f(x + (w - lw) / 2) + "\" y=\"" + (BASE - 22) + "\" width=\"" + f(lw) + "\" height=\"16\" opacity=\".85\"/>");
            }
            double glow = 0.4 + 0.6 * Math.max(0.0, 1 - Math.abs(x + w / 2.0 - SUN_X) / 900);
            rims.append(rim(x, top, w, BASE - top, "rgba(255,190,120," + glowColor(glow) + ")", 2.6));

            x += w + r.randint(14, 46);
            i++;
        }

        // Grúa de obra a contraluz (izquierda).
        int cx = 300, cy = BASE - 500;
        StringBuilder lattice = new StringBuilder();
        for (int k = 0; k < (BASE - cy) / 22; k++) {
            lattice.append("<line x1=\"" + cx + "\" y1=\"" + (cy + 12 + k * 22) + "\" x2=\"" + (cx + 8) + "\" y2=\"" + (cy + 23 + k * 22) + "\"/>");
        }
        extra.append("<g>")
                .append(rect(cx, cy, 8, BASE - cy))
                .append(rect(cx - 120, cy, 330, 6))
                .append(rect(cx - 120, cy + 6, 44, 18))
                .append("<polygon points=\"" + (cx - 6) + "," + cy + " " + (cx + 4) + "," + (cy - 38) + " " + (cx + 14) + "," + cy + "\"/>")
                .append(rect(cx + 168, cy + 6, 1.4, 120))
                .append(rect(cx + 160, cy + 126, 18, 12))
                .append("<g stroke=\"#0b0a12\" stroke-width=\"1.4\">").append(lattice).append("</g></g>");
        extra.append("<circle cx=\"" + (cx + 4) + "\" cy=\"" + (cy - 40) + "\" r=\"3.2\" fill=\"#ff5a4d\"/>");

        // Calle, árboles y faroles.
        String ground = "<rect x=\"0\" y=\"" + (BASE - 6) + "\" width=\"" + W + "\" height=\"" + (H - BASE + 6) + "\" fill=\"#08070d\"/>"
                + "<rect x=\"0\" y=\"" + (BASE + 18) + "\" width=\"" + W + "\" height=\"2\" fill=\"rgba(255,196,128,.18)\"/>";
        StringBuilder trees = new StringBuilder();
        for (int tx = 20; tx < W; tx += 64) {
            if (r.random() < 0.72) {
                double s = r.uniform(0.8, 1.25);
                int ty = BASE - 4;
                trees.append(rect(tx - 1.5, ty - 22 * s, 3, 22 * s));
                for (int k = 0; k < 4; k++) {
                    double ccx = tx + r.uniform(-11, 11) * s;
                    double ccy = ty - (26 + r.uniform(0, 16)) * s;
                    double rr = r.uniform(9, 14) * s;
                    trees.append("<circle cx=\"" + f(ccx) + "\" cy=\"" + f(ccy) + "\" r=\"" + f(rr) + "\"/>");
                }
            }
        }
        StringBuilder lamps = new StringBuilder(), halos = new StringBuilder();
        for (int lx = 90; lx < W; lx += 180) {
            lamps.append(rect(lx, BASE - 52, 2, 52)).append(rect(lx, BASE - 52, 14, 2));
            halos.append("<circle cx=\"" + (lx + 13) + "\" cy=\"" + (BASE - 48) + "\" r=\"16\" fill=\"url(#halo)\"/>")
                    .append("<circle cx=\"" + (lx + 13) + "\" cy=\"" + (BASE - 49) + "\" r=\"2.4\" fill=\"#ffe2b0\"/>");
        }

        String defs = "<linearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">"
                + "<stop offset=\"0\" stop-color=\"#261c2e\"/><stop offset=\"1\" stop-color=\"#0c0a13\"/></linearGradient>"
                + "<pattern id=\"win\" width=\"12\" height=\"16\" patternUnits=\"userSpaceOnUse\">"
                + "<rect x=\"3\" y=\"4\" width=\"6\" height=\"9\" fill=\"#2a2434\"/></pattern>"
                + "<radialGradient id=\"halo\"><stop offset=\"0\" stop-color=\"#ffcf8a\" stop-opacity=\".55\"/>"
                + "<stop offset=\"1\" stop-color=\"#ffcf8a\" stop-opacity=\"0\"/></radialGradient>";
        String body = "<g fill=\"url(#g)\">" + bodies + extra + "</g>"
                + "<g fill=\"url(#win)\">" + facades + "</g>"
                + "<g>" + rims + "</g>" + ground
                + "<g fill=\"#07060b\">" + trees + lamps + "</g>" + halos;
        return new String[] {svg(body, defs), svg("<g fill=\"#ffcf8a\">" + lit + "</g>", "")};
    }

    public static void main(String[] args) throws IOException {
        Path out = Path.of(args.length > 0 ? args[0] : "web/assets/scene");
        Files.createDirectories(out);
        String[] near = near();
        String[][] files = {{"far.svg", far()}, {"mid.svg", mid()}, {"near.svg", near[0]}, {"lights.svg", near[1]}};
        for (String[] file : files) {
            Path p = out.resolve(file[0]);
            Files.writeString(p, file[1], StandardCharsets.UTF_8);
            System.out.println(file[0] + " " + Files.size(p) + " bytes");
        }
    }
}
