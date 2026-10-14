// import { AutoPrint } from "@/components/printer/auto-print"
import { queryOne } from "@/lib/db"
import { getActiveOutlet } from "@/lib/outlet"
import { normalizeTransaction } from "@/lib/transactions/queries"
import { formatCurrency } from "@/lib/utils/format-currency"
import { formatReceiptPaymentMethod } from "@/lib/transactions/receipt"

type PageProps = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    print?: string
  }>
}

export default async function OrderPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params
  const { print } = await searchParams

  const { activeOutlet } = await getActiveOutlet()

  let transaction: ReturnType<typeof normalizeTransaction> | null = null

  try {
    const row = await queryOne(
      `SELECT
         id, outlet_id, outlet_name, order_date, status, payment_method,
         buyer_name, products, subtotal, shipping_cost, admin_fee,
         discount, total, payment_status, payment_type, paid_at,
         invoice, processed_by_name
       FROM transactions
       WHERE id = ? AND outlet_id = ?`,
      [id, activeOutlet.id]
    )

    transaction = row ? normalizeTransaction(row) : null
  } catch (error) {
    console.error(
      "[OrderPage] Failed to fetch transaction:",
      error
    )
  }

  if (!transaction) {
    return (
      <div className="p-6">
        Transaksi tidak ditemukan.
      </div>
    )
  }

  const products =
    Array.isArray(transaction.products)
      ? transaction.products
      : []

  return (
    <>
      {/* {print === "1" && (
        <AutoPrint />
      )} */}

      <style>{`
        @page {
          size: 80mm auto;
          margin: 0;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: white;
        }

        .receipt {
          width: 80mm;
          box-sizing: border-box;
          padding: 12mm 4mm 5mm;
          margin: 0 auto;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size: 12px;
          line-height: 1.35;
          color: #000;
          background: #fff;
        }

        .receipt-divider {
          border-top: 1px dashed #000;
          margin: 10px 0;
        }

        .receipt-header {
          text-align: center;
        }

        .receipt-header img {
          max-width: 42mm;
          max-height: 18mm;
          object-fit: contain;
          margin: 0 auto 6px;
        }

        .receipt-outlet {
          font-size: 16px;
          font-weight: 700;
        }

        .receipt-address {
          margin-top: 3px;
          white-space: pre-line;
        }

        .receipt-meta {
          display: grid;
          gap: 3px;
        }

        .receipt-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        .receipt-row > span:first-child {
          flex: 1;
        }

        .receipt-row > span:last-child {
          text-align: right;
          max-width: 60%;
          word-break: break-word;
        }

        .receipt-product {
          margin-bottom: 8px;
        }

        .receipt-product-name {
          font-weight: 600;
        }

        .receipt-product-variant {
          font-size: 11px;
          color: #555;
        }

        .receipt-product-price {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-top: 2px;
        }

        .receipt-summary {
          display: grid;
          gap: 4px;
        }

        .receipt-total {
          font-size: 14px;
          font-weight: 700;
        }

        .receipt-footer {
          text-align: center;
          margin-top: 12px;
        }

        @media screen {
          body {
            background: #f5f5f5;
          }

          .receipt {
            min-height: 100vh;
            background: white;
          }
        }

        @media print {
          body {
            background: white;
          }

          .receipt {
            margin: 0;
            width: 80mm;
          }
        }
      `}</style>

      <main className="receipt">

        {/* HEADER */}

        <header className="receipt-header">

          {activeOutlet.image_url && (
            <img
              src={activeOutlet.image_url}
              alt={activeOutlet.name}
            />
          )}

          <div className="receipt-outlet">
            {activeOutlet.name}
          </div>

          {activeOutlet.address && (
            <div className="receipt-address">
              {activeOutlet.address}
            </div>
          )}

        </header>

        <div className="receipt-divider" />

        {/* META */}

        <section className="receipt-meta">

          {/* <div className="receipt-row">
            <span>
              No. Transaksi
            </span>

            <span>
              {transaction.invoice ||
                transaction.id.slice(0, 8)}
            </span>
          </div> */}

          <div className="receipt-row">
            <span>
              Tanggal
            </span>

            <span>
              {new Date(
                transaction.order_date
              ).toLocaleString(
                "id-ID",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </span>
          </div>

          <div className="receipt-row">
            <span>
              Pembeli
            </span>

            <span>
              {transaction.buyer_name ||
                "-"}
            </span>
          </div>

          <div className="receipt-row">
            <span>
              Kasir
            </span>

            <span>
              {transaction.processed_by_name ||
                "-"}
            </span>
          </div>

        </section>

        <div className="receipt-divider" />

        {/* PRODUCTS */}

        <section>

          {products.map(
            (product: any, index: number) => {
              const name =
                product.name ??
                product.snapshot?.name ??
                "-"

              const variant =
                product.variantName ??
                product.snapshot?.variantName ??
                null

              const qty =
                Number(
                  product.qty ?? 0
                )

              const price =
                Number(
                  product.price ??
                  product.snapshot?.price ??
                  0
                )

              const subtotal =
                qty * price

              return (
                <div
                  key={
                    product.variantId ??
                    product.productId ??
                    index
                  }
                  className="receipt-product"
                >

                  <div className="receipt-product-name">
                    {name}
                  </div>

                  {variant && (
                    <div className="receipt-product-variant">
                      {variant}
                    </div>
                  )}

                  <div className="receipt-product-price">

                    <span>
                      {qty} x{" "}
                      {formatCurrency(
                        price
                      )}
                    </span>

                    <span>
                      {formatCurrency(
                        subtotal
                      )}
                    </span>

                  </div>

                </div>
              )
            }
          )}

        </section>

        <div className="receipt-divider" />

        {/* SUMMARY */}

        <section className="receipt-summary">

          <div className="receipt-row">
            <span>
              Subtotal
            </span>

            <span>
              {formatCurrency(
                Number(
                  transaction.subtotal ?? 0
                )
              )}
            </span>
          </div>

          {Number(
            transaction.discount ?? 0
          ) > 0 && (
            <div className="receipt-row">
              <span>
                Diskon
              </span>

              <span>
                -
                {formatCurrency(
                  Number(
                    transaction.discount
                  )
                )}
              </span>
            </div>
          )}

          {Number(
            transaction.shipping_cost ?? 0
          ) > 0 && (
            <div className="receipt-row">
              <span>
                Pengiriman
              </span>

              <span>
                {formatCurrency(
                  Number(
                    transaction.shipping_cost
                  )
                )}
              </span>
            </div>
          )}

          {Number(
            transaction.admin_fee ?? 0
          ) > 0 && (
            <div className="receipt-row">
              <span>
                Biaya Admin
              </span>

              <span>
                {formatCurrency(
                  Number(
                    transaction.admin_fee
                  )
                )}
              </span>
            </div>
          )}

          <div className="receipt-divider" />

          <div className="receipt-row receipt-total">
            <span>
              Total Bayar
            </span>

            <span>
              {formatCurrency(
                Number(
                  transaction.total ?? 0
                )
              )}
            </span>
          </div>

          <div className="receipt-row">
            <span>
              Pembayaran
            </span>

            <span>
              {formatReceiptPaymentMethod(
                transaction.payment_method
              )}
            </span>
          </div>

        </section>

        <div className="receipt-divider" />

        {/* FOOTER */}

        <footer className="receipt-footer">
          Terima kasih telah berbelanja di {activeOutlet.name}
        </footer>

      </main>
    </>
  )
}