// export function printInvoice(
//   transactionId: string
// ) {
//   return new Promise<void>(
//     (resolve, reject) => {
//       const iframe =
//         document.createElement("iframe")

//       iframe.style.position = "fixed"
//       iframe.style.width = "0"
//       iframe.style.height = "0"
//       iframe.style.border = "0"
//       iframe.style.opacity = "0"
//       iframe.style.pointerEvents = "none"

//       iframe.src =
//         `/order/${transactionId}`

//       let cleaned = false

//       const cleanup = () => {
//         if (cleaned) return

//         cleaned = true

//         window.setTimeout(() => {
//           iframe.remove()
//           resolve()
//         }, 100)
//       }

//       iframe.onload = () => {
//         try {
//           const printWindow =
//             iframe.contentWindow

//           if (!printWindow) {
//             reject(
//               new Error(
//                 "Jendela print tidak tersedia."
//               )
//             )

//             iframe.remove()
//             return
//           }

//           const handleAfterPrint =
//             () => {
//               printWindow.removeEventListener(
//                 "afterprint",
//                 handleAfterPrint
//               )

//               cleanup()
//             }

//           printWindow.addEventListener(
//             "afterprint",
//             handleAfterPrint
//           )

//           /*
//            * Beri sedikit waktu supaya
//            * browser menyelesaikan rendering
//            * layout invoice.
//            */
//           window.setTimeout(() => {
//             printWindow.focus()
//             printWindow.print()
//           }, 300)
//         } catch (error) {
//           iframe.remove()

//           reject(error)
//         }
//       }

//       iframe.onerror = () => {
//         iframe.remove()

//         reject(
//           new Error(
//             "Gagal memuat invoice untuk dicetak."
//           )
//         )
//       }

//       document.body.appendChild(
//         iframe
//       )
//     }
//   )
// }