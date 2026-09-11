import { PageHeader } from "@/components/ui/misc";
import { MediaLibrary } from "@/components/admin/media-library";

export default function MediaPage() {
  return <div><PageHeader title="Biblioteca de medios" subtitle="Todos los archivos subidos al sistema." /><MediaLibrary /></div>;
}
