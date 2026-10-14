import { columns, Transaction } from "./columns"
import { DataTable } from "./data-table"

async function getData(): Promise<Transaction[]> {
  // Fetch data from your API here.
  return [
    {
      id: "728ed52f",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
    // ...
  ]
}

export default async function DemoPage() {
  const data = await getData()

  return (
    // <div className="container mx-auto py-10">
    //   <DataTable columns={columns} data={data} />
    // </div>
    <div className="container mx-auto py-4">
      <DataTable
        columns={columns}
        data={data}
      />
    </div>
  )
}