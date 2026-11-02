import type { Metadata } from "next";
import { AttendancePage } from "@/features/attendance/server/components/attendance-page";
import { routes } from "@/lib/routes";
import { PAGE_COPY } from "@/lib/seo/page-copy";
import { buildPageShareMetadata } from "@/lib/seo/share-metadata";

export const metadata: Metadata = {
  title: PAGE_COPY.attendance.title,
  description: PAGE_COPY.attendance.description,
  alternates: {
    canonical: routes.attendance(),
  },
  ...buildPageShareMetadata({
    ...PAGE_COPY.attendance,
    path: routes.attendance(),
  }),
};

export default function AttendanceRoute() {
  return <AttendancePage />;
}
