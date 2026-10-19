using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public class Program {
    public static void Main(string[] args) {
        string baseDir = args.Length > 0 ? args[0] : "public/assets";
        Generate(System.IO.Path.Combine(baseDir, "icon-dark.png"), 512, true);
        Generate(System.IO.Path.Combine(baseDir, "icon-light.png"), 512, false);
        Generate(System.IO.Path.Combine(baseDir, "icon.png"), 512, true);
        Generate(System.IO.Path.Combine(baseDir, "composer-icon.png"), 128, true);
    }

    public static void Generate(string path, int size, bool isDark) {
        using (Bitmap bmp = new Bitmap(size, size)) {
            using (Graphics g = Graphics.FromImage(bmp)) {
                g.SmoothingMode = SmoothingMode.AntiAlias;
                g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;

                float scale = size / 512.0f;

                Color cBg1 = isDark ? Color.FromArgb(255, 11, 19, 43) : Color.FromArgb(255, 248, 250, 252);
                Color cBg2 = isDark ? Color.FromArgb(255, 58, 80, 107) : Color.FromArgb(255, 226, 232, 240);

                Rectangle bgRect = new Rectangle(0, 0, size, size);
                using (LinearGradientBrush bgBrush = new LinearGradientBrush(bgRect, cBg1, cBg2, 45.0f)) {
                    using (GraphicsPath pathBg = new GraphicsPath()) {
                        int radius = (int)(108 * scale);
                        int d = radius * 2;
                        pathBg.AddArc(0, 0, d, d, 180, 90);
                        pathBg.AddArc(size - d, 0, d, d, 270, 90);
                        pathBg.AddArc(size - d, size - d, d, d, 0, 90);
                        pathBg.AddArc(0, size - d, d, d, 90, 90);
                        pathBg.CloseFigure();
                        g.FillPath(bgBrush, pathBg);
                    }
                }

                Color ringColor = isDark ? Color.FromArgb(180, 42, 56, 89) : Color.FromArgb(180, 203, 213, 225);
                using (Pen ringPen = new Pen(ringColor, 4 * scale)) {
                    ringPen.DashPattern = new float[] { 4.0f, 2.0f };
                    float r = 180 * scale;
                    g.DrawEllipse(ringPen, 256 * scale - r, 256 * scale - r, r * 2, r * 2);
                }

                Color d1 = Color.FromArgb(255, 0, 201, 167);
                Color d2 = Color.FromArgb(255, 0, 128, 128);
                Rectangle dRect = new Rectangle((int)(160 * scale), (int)(160 * scale), (int)(192 * scale), (int)(192 * scale));
                using (LinearGradientBrush dBrush = new LinearGradientBrush(dRect, d1, d2, 45.0f)) {
                    using (Pen dPen = new Pen(dBrush, 20 * scale)) {
                        dPen.LineJoin = LineJoin.Round;
                        PointF[] pts = new PointF[] {
                            new PointF(160 * scale, 256 * scale),
                            new PointF(256 * scale, 160 * scale),
                            new PointF(352 * scale, 256 * scale),
                            new PointF(256 * scale, 352 * scale)
                        };
                        g.DrawPolygon(dPen, pts);
                    }
                }

                PointF[] hexPts = new PointF[] {
                    new PointF(256 * scale, 196 * scale),
                    new PointF(308 * scale, 226 * scale),
                    new PointF(308 * scale, 286 * scale),
                    new PointF(256 * scale, 316 * scale),
                    new PointF(204 * scale, 286 * scale),
                    new PointF(204 * scale, 226 * scale)
                };
                Color hexFillColor = isDark ? Color.FromArgb(255, 11, 19, 43) : Color.FromArgb(255, 255, 255);
                using (SolidBrush hexFill = new SolidBrush(hexFillColor)) {
                    g.FillPolygon(hexFill, hexPts);
                }

                Color g1 = Color.FromArgb(255, 100, 223, 223);
                Color g2 = Color.FromArgb(255, 72, 191, 227);
                using (LinearGradientBrush glowBrush = new LinearGradientBrush(dRect, g1, g2, 45.0f)) {
                    using (Pen hexPen = new Pen(glowBrush, 10 * scale)) {
                        g.DrawPolygon(hexPen, hexPts);
                    }

                    using (Pen tailPen = new Pen(glowBrush, 16 * scale)) {
                        tailPen.StartCap = LineCap.Round;
                        tailPen.EndCap = LineCap.Round;
                        g.DrawLine(tailPen, 272 * scale, 272 * scale, 320 * scale, 320 * scale);
                    }
                }

                using (SolidBrush qFill = new SolidBrush(d1)) {
                    float qr = 28 * scale;
                    g.FillEllipse(qFill, 256 * scale - qr, 256 * scale - qr, qr * 2, qr * 2);
                }

                using (SolidBrush nodeBrush = new SolidBrush(g1)) {
                    float nr = 16 * scale;
                    float[][] nodes = new float[][] {
                        new float[] { 256, 160 },
                        new float[] { 352, 256 },
                        new float[] { 256, 352 },
                        new float[] { 160, 256 }
                    };
                    foreach (var n in nodes) {
                        float nx = n[0] * scale;
                        float ny = n[1] * scale;
                        g.FillEllipse(nodeBrush, nx - nr, ny - nr, nr * 2, nr * 2);
                    }
                }
            }
            bmp.Save(path, ImageFormat.Png);
        }
        Console.WriteLine("Successfully created: " + path + " (" + size + "x" + size + ")");
    }
}
