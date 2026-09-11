"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/misc";

const chartLoading = () => <Skeleton className="h-[260px]" />;
export const ActivityChart = dynamic(() => import("@/components/admin/dashboard-charts").then((m) => m.ActivityChart), { ssr: false, loading: chartLoading });
export const CityChart = dynamic(() => import("@/components/admin/dashboard-charts").then((m) => m.CityChart), { ssr: false, loading: chartLoading });
export const RevenueChart = dynamic(() => import("@/components/admin/dashboard-charts").then((m) => m.RevenueChart), { ssr: false, loading: chartLoading });
