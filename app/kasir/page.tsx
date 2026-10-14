import KasirClient from "@/components/kasir/kasir-client"
import { getProducts } from "@/lib/products/queries"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kasir",
}

export default async function Page() {
  const products = await getProducts()

  return (
    <div className="container mx-auto py-4">
      <KasirClient
        initialProducts={products || []}
      />
    </div>
  )
}