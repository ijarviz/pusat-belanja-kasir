import "server-only"

import mysql, {
  type Pool,
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise"

/*
 * Koneksi MariaDB (database `pusatbelanja`, skema di
 * ../docs/db-pusatbelanja-mariadb.sql).
 *
 * Konversi tipe dibuat sedekat mungkin dengan hasil Supabase supaya
 * kode lama yang membaca row tetap jalan:
 * - BOOLEAN (TINYINT(1)) -> true/false
 * - DATETIME             -> string ISO UTC ("2026-10-14T05:11:55.153Z")
 * - DECIMAL              -> number
 * - UUID                 -> string
 * Kolom JSON (products.variant_config, transactions.products) tetap
 * string dari driver; parse dengan parseJson().
 */

declare global {
  var __pusatbelanjaPool: Pool | undefined
}

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? "pusatbelanja",
    connectionLimit: Number(process.env.DB_POOL_SIZE ?? 10),
    // Server MariaDB memakai UTC; semua waktu disimpan UTC.
    timezone: "Z",
    dateStrings: true,
    decimalNumbers: true,
    typeCast(field, next) {
      if (field.type === "TINY" && field.length === 1) {
        const value = field.string()
        return value === null ? null : value === "1"
      }

      if (
        field.type === "DATETIME" ||
        field.type === "TIMESTAMP"
      ) {
        const value = field.string()
        return value === null
          ? null
          : `${value.replace(" ", "T")}Z`
      }

      return next()
    },
  })
}

export function getPool(): Pool {
  if (!globalThis.__pusatbelanjaPool) {
    globalThis.__pusatbelanjaPool = createPool()
  }

  return globalThis.__pusatbelanjaPool
}

// Row hasil query tanpa tipe eksplisit; sama longgarnya dengan data
// Supabase yang dulu dipakai kode ini.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>

export type DbExecutor = Pick<Pool, "query"> | Pick<PoolConnection, "query">

export async function query<T extends Row = Row>(
  sql: string,
  params: unknown[] = [],
  db: DbExecutor = getPool()
): Promise<T[]> {
  const [rows] = await db.query<RowDataPacket[]>(sql, params)
  return rows as T[]
}

export async function queryOne<T extends Row = Row>(
  sql: string,
  params: unknown[] = [],
  db: DbExecutor = getPool()
): Promise<T | null> {
  const rows = await query<T>(sql, params, db)
  return rows[0] ?? null
}

export async function execute(
  sql: string,
  params: unknown[] = [],
  db: DbExecutor = getPool()
): Promise<ResultSetHeader> {
  const [result] = await db.query<ResultSetHeader>(sql, params)
  return result
}

/*
 * Jalankan fn dengan satu koneksi yang sudah di-set
 * @app_user_id (pengganti auth.uid() Supabase). Wajib dipakai
 * untuk CALL add_stock / remove_stock / calculate_stock.
 */
export async function withUserConnection<T>(
  userId: string,
  fn: (conn: PoolConnection) => Promise<T>
): Promise<T> {
  const conn = await getPool().getConnection()

  try {
    await conn.query("SET @app_user_id = ?", [userId])
    return await fn(conn)
  } finally {
    try {
      await conn.query("SET @app_user_id = NULL")
    } finally {
      conn.release()
    }
  }
}

/*
 * CALL procedure dan kembalikan result set pertama.
 */
export async function callProcedure<T extends Row = Row>(
  conn: PoolConnection,
  name: string,
  args: unknown[]
): Promise<T[]> {
  if (!/^[a-z_]+$/.test(name)) {
    throw new Error(`Nama procedure tidak valid: ${name}`)
  }

  const placeholders = args.map(() => "?").join(", ")
  const [results] = await conn.query<RowDataPacket[][]>(
    `CALL ${name}(${placeholders})`,
    args
  )

  return (Array.isArray(results[0]) ? results[0] : []) as T[]
}

export function parseJson<T = unknown>(value: unknown): T | null {
  if (value === null || value === undefined) return null
  if (typeof value !== "string") return value as T

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export function toJson(value: unknown): string | null {
  return value === null || value === undefined
    ? null
    : JSON.stringify(value)
}

/*
 * Ubah string ISO dari client (mis. new Date().toISOString())
 * menjadi format DATETIME MariaDB dalam UTC.
 */
export function toDbDate(
  value: string | Date | null | undefined
): string | null {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return date.toISOString().replace("T", " ").replace("Z", "")
}

export function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "ER_DUP_ENTRY"
  )
}

/*
 * Pesan dari SIGNAL di procedure MariaDB (mis. "Stok tidak mencukupi...").
 */
export function dbErrorMessage(
  error: unknown,
  fallback = "Terjadi kesalahan database"
) {
  if (typeof error === "object" && error !== null) {
    const sqlMessage = (error as { sqlMessage?: string }).sqlMessage
    if (sqlMessage) return sqlMessage
  }

  return error instanceof Error ? error.message : fallback
}
