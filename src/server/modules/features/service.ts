import { z } from "zod";
import { db } from "@/server/db";

export const featureSchema = z.object({ name: z.string().min(2), icon: z.string().optional().nullable(), isActive: z.coerce.boolean().default(true) });

export const listFeatures = (onlyActive = false) => db.feature.findMany({ where: onlyActive ? { isActive: true } : {}, orderBy: { name: "asc" } });
export const createFeature = (input: z.infer<typeof featureSchema>) => db.feature.create({ data: input });
export const updateFeature = (id: string, input: Partial<z.infer<typeof featureSchema>>) => db.feature.update({ where: { id }, data: input });
export const deleteFeature = (id: string) => db.feature.delete({ where: { id } });
