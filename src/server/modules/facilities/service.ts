import { z } from "zod";
import { db } from "@/server/db";

export const facilitySchema = z.object({ name: z.string().min(2), icon: z.string().optional().nullable(), isActive: z.coerce.boolean().default(true) });

export const listFacilities = (onlyActive = false) => db.facility.findMany({ where: onlyActive ? { isActive: true } : {}, orderBy: { name: "asc" } });
export const createFacility = (input: z.infer<typeof facilitySchema>) => db.facility.create({ data: input });
export const updateFacility = (id: string, input: Partial<z.infer<typeof facilitySchema>>) => db.facility.update({ where: { id }, data: input });
export const deleteFacility = (id: string) => db.facility.delete({ where: { id } });
