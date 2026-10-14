import CekHargaClient from "@/components/cek-harga-client"
import { getProducts } from "@/lib/products/queries"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cek Harga",
}

export default async function Page() {
  const products = await getProducts()

  return (
    <div className="container mx-auto py-4">
      <CekHargaClient
        initialProducts={products || []}
      />
    </div>
  )
}