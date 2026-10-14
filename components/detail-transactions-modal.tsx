// "use client"

// import * as React from "react"
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog"

// type Transaction = any

// interface Props {
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   data: Transaction | null
// }

// export function DetailTransactionsModal({
//   open,
//   onOpenChange,
//   data,
// }: Props) {
//   if (!data) return null

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-3xl">
//         <DialogHeader>
//           <DialogTitle>Detail Transaksi</DialogTitle>
//         </DialogHeader>

//         <div className="space-y-4 text-sm">
          
//           {/* CUSTOMER */}
//           <div className="grid grid-cols-2 gap-3">
//             <div>
//               <div className="text-muted-foreground">Nama</div>
//               <div className="font-medium">
//                 {data.buyer_name || "-"}
//               </div>
//             </div>

//             <div>
//               <div className="text-muted-foreground">No HP</div>
//               <div className="font-medium">
//                 {data.buyer_phone || "-"}
//               </div>
//             </div>

//             <div className="col-span-2">
//               <div className="text-muted-foreground">Alamat</div>
//               <div className="font-medium">
//                 {data.buyer_address || "-"}
//               </div>
//             </div>
//           </div>

//           {/* SHIPPING */}
//           <div className="border-t pt-3">
//             <div className="font-medium mb-1">Shipping</div>
//             <div>
//               {data.shipping_courier || "-"} - {data.shipping_service || "-"}
//             </div>
//           </div>

//           {/* PRODUCTS */}
//           <div className="border-t pt-3 space-y-2">
//             <div className="font-medium">Produk</div>

//             {data.products?.map((p: any, i: number) => (
//               <div key={i} className="flex gap-3 items-center">
//                 <img
//                   src={p.image}
//                   className="w-10 h-10 rounded border object-cover"
//                 />

//                 <div className="flex-1">
//                   <div className="font-medium">{p.name}</div>

//                   {(p.variantName || p.snapshot?.variantName) && (
//                     <div className="text-xs text-muted-foreground">
//                       Varian: {p.variantName || p.snapshot?.variantName}
//                     </div>
//                   )}
//                 </div>

//                 <div className="font-medium">x{p.qty}</div>
//               </div>
//             ))}
//           </div>

//           {/* TOTAL */}
//           <div className="border-t pt-3 flex justify-between font-semibold">
//             <span>Total</span>
//             <span>
//               {data.total?.toLocaleString("id-ID") || 0}
//             </span>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   )
// }