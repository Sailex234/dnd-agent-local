import Link from "next/link";
import { getSheet } from "@/lib/api";
import Sheet from "./Sheet";

export const dynamic = "force-dynamic";

export default async function SheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = await getSheet(slug);

  if (detail === null) {
    return (
      <main>
        <Link href="/" className="back">
          &larr; Volver
        </Link>
        <h1 className="page-title">Personaje no encontrado</h1>
        <p className="notice">No existe una hoja con el identificador &quot;{slug}&quot;.</p>
      </main>
    );
  }

  return (
    <main>
      <Sheet slug={slug} initial={detail.sheet} />
    </main>
  );
}
