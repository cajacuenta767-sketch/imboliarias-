import { requireUser } from "@/server/auth/guards";
import { getUser } from "@/server/modules/users/service";
import { listCities } from "@/server/modules/locations/service";
import { PageHeader } from "@/components/ui/misc";
import { ProfileForm } from "@/components/account/profile-form";

export default async function ProfilePage() {
  const user = await requireUser();
  const [u, cities] = await Promise.all([getUser(user.id), listCities()]);
  const { passwordHash, ...safe } = u;
  void passwordHash;
  return (
    <div>
      <PageHeader title="Mi perfil" subtitle="Tus datos de contacto y tu perfil público como asesor." />
      <ProfileForm user={JSON.parse(JSON.stringify(safe))} cities={cities.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
