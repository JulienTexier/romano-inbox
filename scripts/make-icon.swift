// Draws the Romano app icon at 1024x1024.
// Usage: swift scripts/make-icon.swift <out.png>
import AppKit
let size = 1024.0
let out = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 1024, pixelsHigh: 1024, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
out.size = NSSize(width: size, height: size)
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: out)
let g = NSGradient(starting: NSColor(red: 0.16, green: 0.55, blue: 0.33, alpha: 1), ending: NSColor(red: 0.08, green: 0.36, blue: 0.22, alpha: 1))!
g.draw(in: NSRect(x: 0, y: 0, width: size, height: size), angle: -90)
for i in stride(from: 0, to: 8, by: 2) {
  NSColor(white: 1, alpha: 0.05).setFill()
  NSRect(x: Double(i) * size / 8, y: 0, width: size / 8, height: size).fill()
}
NSColor(white: 1, alpha: 0.18).setStroke()
let c = NSBezierPath(ovalIn: NSRect(x: size*0.18, y: size*0.18, width: size*0.64, height: size*0.64)); c.lineWidth = 20; c.stroke()
let ball = "⚽" as NSString
let attrs: [NSAttributedString.Key: Any] = [.font: NSFont.systemFont(ofSize: size * 0.42)]
let bs = ball.size(withAttributes: attrs)
ball.draw(at: NSPoint(x: (size - bs.width) / 2, y: (size - bs.height) / 2 + size * 0.02), withAttributes: attrs)
NSGraphicsContext.restoreGraphicsState()
try! out.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: CommandLine.arguments[1]))
