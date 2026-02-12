import SwiftUI

struct SummaryView: View {
  let report: LessonReport

  var body: some View {
    List {
      Section("Summary") {
        Text(report.summary_ru)
      }

      Section("Skill scores") {
        LabeledContent("Fluency") { Text(String(format: "%.2f", report.skill_scores.fluency)) }
        LabeledContent("Accuracy") { Text(String(format: "%.2f", report.skill_scores.accuracy)) }
        LabeledContent("Comprehension") { Text(String(format: "%.2f", report.skill_scores.comprehension)) }
      }

      Section("Vocab to learn") {
        ForEach(report.vocab_to_learn, id: \.self) { v in
          VStack(alignment: .leading, spacing: 4) {
            HStack {
              Text(v.he).font(.headline)
              Spacer()
              if let priority = v.priority {
                Text("P\(priority)").font(.caption).foregroundStyle(.secondary)
              }
            }
            Text(v.ru).foregroundStyle(.secondary)
            Divider()
            Text(v.example_he).font(.footnote)
            Text(v.example_ru).font(.footnote).foregroundStyle(.secondary)
          }
          .padding(.vertical, 4)
        }
      }

      if let corrections = report.corrections, !corrections.isEmpty {
        Section("Corrections") {
          ForEach(corrections, id: \.self) { c in
            VStack(alignment: .leading, spacing: 6) {
              Text(c.type.rawValue.uppercased()).font(.caption).foregroundStyle(.secondary)
              Text("You: \(c.user_he)").font(.subheadline)
              Text("Fix: \(c.fixed_he)").font(.subheadline).fontWeight(.semibold)
              Text(c.explain_ru).font(.footnote).foregroundStyle(.secondary)
            }
            .padding(.vertical, 4)
          }
        }
      }

      Section("Next steps") {
        ForEach(report.next_steps_ru, id: \.self) { step in
          Text(step)
        }
      }

      Section("Transcript") {
        ForEach(report.transcript, id: \.self) { t in
          ChatBubble(
            side: t.role == .user ? .right : .left,
            title: t.role == .user ? "You" : "AI",
            text: t.he,
            subtitle: t.ru
          )
          .listRowSeparator(.hidden)
        }
      }
    }
    .listStyle(.plain)
    .navigationTitle("Summary")
    .navigationBarTitleDisplayMode(.inline)
  }
}

