import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PropertyListing } from "@/components/site/listing";
import { propertyQuerySchema } from "@/server/modules/properties/schema";
import { listProperties } from "@/server/modules/properties/service";
import { listCities } from "@/server/modules/locations/service";
import { listCategories } from "@/server/modules/categories/service";
import { listFeatures } from "@/server/modules/features/service";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const t = await getTranslations("list");
  const title = sp.type === "SALE" ? t("titleSale") : sp.type === "RENT" ? t("titleRent") : t("titleAll");
  return { title };
}

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const t = await getTranslations("list");
  const parsed = propertyQuerySchema.safeParse({ ...sp, perPage: sp.view === "map" ? "10" : "12" });
  const q = parsed.success ? parsed.data : propertyQuerySchema.parse({});
  const [{ items, meta }, cities, categories, features] = await Promise.all([listProperties(q), listCities(), listCategories(true), listFeatures(true)]);
  const title = q.type === "SALE" ? t("titleSale") : q.type === "RENT" ? t("titleRent") : t("titleAll");
  const mapQuery = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" && k !== "page" && k !== "view" && k !== "bbox" ? [[k, v]] : []))).toString();

  return (
    <div className="container-x py-10">
      <div className="mb-8">
        <p className="eyebrow mb-2">Habitta</p>
        <h1 className="section-title">{title}</h1>
        <p className="mt-2 text-ink-soft">{t("subtitle", { count: meta.total })}</p>
      </div>
      <PropertyListing items={items} meta={meta} cities={cities} categories={categories} features={features} mapQuery={mapQuery} />
    </div>
  );
}
