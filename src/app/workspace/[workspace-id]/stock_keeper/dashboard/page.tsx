'use client';
import NotificationArea from "./NotificationArea";
import QuickSummary from "./QuickSummary";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1 flex flex-col gap-6">
        <QuickSummary />
        <NotificationArea />
      </div>
      <div className="lg:w-1/4 flex flex-col gap-4">
        {/* <Link href="../requests">
          <button className="w-full bg-primary text-white rounded-md py-3 px-4 font-semibold shadow hover:bg-primary/90 transition">
            Go to Requests
          </button>
        </Link> */}
      </div>
    </div>
  );
}
