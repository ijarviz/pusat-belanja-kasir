import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function NonaktifPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Akses Dinonaktifkan</CardTitle>

          <CardDescription>
            Kamu tidak memiliki akses aktif ke outlet saat ini.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <p className="text-sm leading-6 text-muted-foreground">
            Akses akun kamu ke outlet ini sedang
            dinonaktifkan. Silakan hubungi owner atau
            administrator outlet untuk mendapatkan akses
            kembali.
          </p>

          <Button asChild className="w-full">
            <Link href="/auth/login">
              Kembali ke Login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}