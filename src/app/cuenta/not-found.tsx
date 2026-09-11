import Link from "next/link";
import { EmptyState } from "@/components/ui/misc";

export default function AccountNotFound() {
  return <EmptyState title="No encontrado" text="El elemento que buscas no existe o fue eliminado." action={<Link href="/cuenta" className="btn-primary">Ir a mi cuenta</Link>} />;
}
