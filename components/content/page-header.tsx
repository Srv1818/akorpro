import type { ReactNode } from "react";

export type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  leading?: ReactNode;
};

/** Şu an görünür başlık kullanılmıyor; prop’lar sayfa/metadata tutarlılığı için korunur. */
export function PageHeader(_props: PageHeaderProps) {
  return null;
}