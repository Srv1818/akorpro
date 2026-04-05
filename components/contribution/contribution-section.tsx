import { ContributionFormClient } from "@/components/contribution/contribution-form-client";
import { ContributionListClient } from "@/components/contribution/contribution-list-client";

export function ContributionSection() {
  return (
    <div className="grid gap-10 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <h3 className="text-lg font-semibold text-foreground">Yeni katkı gönder</h3>
        <div className="mt-4">
          <ContributionFormClient />
        </div>
      </div>
      <div className="lg:col-span-2">
        <h3 className="text-lg font-semibold text-foreground">Katkılarım</h3>
        <div className="mt-4">
          <ContributionListClient />
        </div>
      </div>
    </div>
  );
}
