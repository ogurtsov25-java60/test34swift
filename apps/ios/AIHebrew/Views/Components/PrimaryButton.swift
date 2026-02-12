import SwiftUI

struct PrimaryButton: View {
  let title: String
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      Text(title)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
    }
    .buttonStyle(.borderedProminent)
  }
}

