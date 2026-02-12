import SwiftUI

struct ChatBubble: View {
  enum Side { case left, right }

  let side: Side
  let title: String
  let text: String
  let subtitle: String?

  var body: some View {
    HStack {
      if side == .right { Spacer(minLength: 24) }
      VStack(alignment: .leading, spacing: 4) {
        Text(title).font(.caption).foregroundStyle(.secondary)
        Text(text).font(.body)
        if let subtitle, !subtitle.isEmpty {
          Text(subtitle).font(.footnote).foregroundStyle(.secondary)
        }
      }
      .padding(10)
      .background(side == .right ? Color.accentColor.opacity(0.15) : Color.gray.opacity(0.15))
      .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
      if side == .left { Spacer(minLength: 24) }
    }
  }
}

