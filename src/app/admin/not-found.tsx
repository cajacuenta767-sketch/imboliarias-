import Link from "next/link";
import { EmptyState } from "@/components/ui/misc";

export default function AdminNotFound() {
  return <EmptyState title="No encontrado" text="El elemento que buscas no existe o fue eliminado." action={<Link href="/admin" className="btn-primary">Ir al panel</Link>} />;
}
