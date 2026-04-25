import { notFound } from "next/navigation";
import { getMetodBySlug } from "@/lib/firestore/admin-metodlar";
import { MetodDetayClient } from "@/components/metod/metod-detay-client";

type Props = { params: Promise<{ slug: string }> };

export default async function MetodDetayPage({ params }: Props) {
  const { slug } = await params;
  const metod = await getMetodBySlug(slug);
  if (!metod) notFound();

  return <MetodDetayClient title={metod.title} bolumler={metod.bolumler ?? []} />;
}
