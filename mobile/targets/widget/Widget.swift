// Aegis · Critical CVEs — iOS home-screen widget (WidgetKit, small + medium families).
//
// UNTESTED: written on Windows without Xcode. Data flow:
//   app (src/widgets/data.ts) --ExtensionStorage.set("widget-payload", json)--> UserDefaults(suiteName: App Group)
//   widget (this file) reads the same key and decodes WidgetPayload. The app calls
//   WidgetCenter.reloadTimelines(ofKind: "AegisWidget") after writing (src/widgets/refresh.ts).
// Keep `kind`, the App Group id and the key in sync with IOS_WIDGET_KIND / IOS_APP_GROUP / WIDGET_PAYLOAD_KEY in data.ts.

import SwiftUI
import WidgetKit

let appGroup = "group.ca.neeraj.aegis"
let payloadKey = "widget-payload"
let widgetKind = "AegisWidget"

// MARK: - Payload (mirrors WidgetPayload in src/widgets/data.ts)

struct WidgetCve: Codable, Identifiable {
    let id: String
    let score: Double?
    let summary: String
}

struct WidgetPayload: Codable {
    let updatedAt: Double // epoch milliseconds
    let critical: [WidgetCve]
    let watchlistHits: Int

    static let empty = WidgetPayload(updatedAt: 0, critical: [], watchlistHits: 0)

    static let placeholder = WidgetPayload(
        updatedAt: Date().timeIntervalSince1970 * 1000,
        critical: [
            WidgetCve(id: "CVE-2026-21412", score: 9.8, summary: "Remote code execution in Example Gateway via crafted packet"),
            WidgetCve(id: "CVE-2026-20987", score: 9.9, summary: "Authentication bypass in Acme VPN appliance admin portal"),
            WidgetCve(id: "CVE-2026-20633", score: 9.1, summary: "Deserialization flaw allows unauthenticated RCE"),
        ],
        watchlistHits: 2
    )

    /// Reads the JSON string the app stored through ExtensionStorage.set(key, jsonString) -> setString.
    /// Accept a Data value too, in case the payload is ever written with setObject.
    static func load() -> WidgetPayload? {
        guard let defaults = UserDefaults(suiteName: appGroup) else { return nil }
        let data: Data?
        if let s = defaults.string(forKey: payloadKey) {
            data = s.data(using: .utf8)
        } else {
            data = defaults.data(forKey: payloadKey)
        }
        guard let d = data else { return nil }
        return try? JSONDecoder().decode(WidgetPayload.self, from: d)
    }

    var updatedLabel: String {
        guard updatedAt > 0 else { return "never updated" }
        let seconds = max(0, Date().timeIntervalSince1970 - updatedAt / 1000)
        if seconds < 60 { return "updated just now" }
        let m = Int(seconds / 60)
        if m < 60 { return "updated \(m)m ago" }
        let h = m / 60
        if h < 24 { return "updated \(h)h ago" }
        return "updated \(h / 24)d ago"
    }
}

// MARK: - Timeline

struct AegisEntry: TimelineEntry {
    let date: Date
    let payload: WidgetPayload
    let isPlaceholder: Bool
}

struct AegisProvider: TimelineProvider {
    func placeholder(in context: Context) -> AegisEntry {
        AegisEntry(date: Date(), payload: .placeholder, isPlaceholder: true)
    }

    func getSnapshot(in context: Context, completion: @escaping (AegisEntry) -> Void) {
        let payload = context.isPreview ? WidgetPayload.placeholder : (WidgetPayload.load() ?? .placeholder)
        completion(AegisEntry(date: Date(), payload: payload, isPlaceholder: context.isPreview))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<AegisEntry>) -> Void) {
        // The widget itself never hits the network: the app refreshes the shared payload and calls
        // reloadTimelines. We still ask WidgetKit to re-read the store every 30 minutes so the
        // "updated X ago" label stays honest.
        let entry = AegisEntry(date: Date(), payload: WidgetPayload.load() ?? .empty, isPlaceholder: false)
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date().addingTimeInterval(1800)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

// MARK: - Views

private let bg = Color(red: 0x0b / 255, green: 0x12 / 255, blue: 0x20 / 255)
private let cyan = Color(red: 0x22 / 255, green: 0xd3 / 255, blue: 0xee / 255)
private let muted = Color(red: 0x94 / 255, green: 0xa3 / 255, blue: 0xb8 / 255)
private let rowBg = Color(red: 0x11 / 255, green: 0x1a / 255, blue: 0x2e / 255)
private let critical = Color(red: 0xef / 255, green: 0x44 / 255, blue: 0x44 / 255)
private let textColor = Color(red: 0xe2 / 255, green: 0xe8 / 255, blue: 0xf0 / 255)

struct CveRow: View {
    let cve: WidgetCve
    var showSummary = true

    var body: some View {
        // Per-row deep link: Link works in medium widgets; in small widgets taps fall through to widgetURL.
        Link(destination: URL(string: "aegis://cve/\(cve.id)") ?? URL(string: "aegis://")!) {
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(cve.id)
                        .font(.system(size: 11, weight: .bold, design: .monospaced))
                        .foregroundColor(cyan)
                        .lineLimit(1)
                    Spacer(minLength: 4)
                    Text(cve.score.map { String(format: "%.1f", $0) } ?? "N/A")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 5)
                        .padding(.vertical, 1)
                        .background(critical)
                        .clipShape(Capsule())
                }
                if showSummary {
                    Text(cve.summary.isEmpty ? "No description" : cve.summary)
                        .font(.system(size: 10))
                        .foregroundColor(textColor)
                        .lineLimit(1)
                }
            }
            .padding(.horizontal, 7)
            .padding(.vertical, 4)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(rowBg)
            .cornerRadius(7)
        }
    }
}

struct AegisWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: AegisEntry

    var rows: [WidgetCve] {
        Array(entry.payload.critical.prefix(family == .systemSmall ? 2 : 3))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(family == .systemSmall ? "AEGIS · CVEs" : "AEGIS · Critical CVEs")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(cyan)
                    .lineLimit(1)
                Spacer()
                if family != .systemSmall {
                    Text(entry.payload.updatedLabel)
                        .font(.system(size: 9))
                        .foregroundColor(muted)
                }
            }
            if rows.isEmpty {
                Spacer()
                Text("No critical CVEs this week")
                    .font(.system(size: 11))
                    .foregroundColor(muted)
                Spacer()
            } else {
                ForEach(rows) { cve in
                    CveRow(cve: cve, showSummary: family != .systemSmall)
                }
                Spacer(minLength: 0)
            }
            Text("Watchlist: \(entry.payload.watchlistHits) new")
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(entry.payload.watchlistHits > 0 ? cyan : muted)
        }
        .padding(10)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        // Tapping anywhere outside a row (or anywhere in the small family) opens the app root.
        .widgetURL(URL(string: "aegis://"))
        .containerBackground(for: .widget) { bg }
    }
}

// MARK: - Widget

struct AegisWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: widgetKind, provider: AegisProvider()) { entry in
            AegisWidgetView(entry: entry)
        }
        .configurationDisplayName("Aegis · Critical CVEs")
        .description("The newest critical CVEs and your watchlist hits.")
        .supportedFamilies([.systemSmall, .systemMedium])
        .contentMarginsDisabled()
    }
}

@main
struct AegisWidgetBundle: WidgetBundle {
    var body: some Widget {
        AegisWidget()
    }
}
