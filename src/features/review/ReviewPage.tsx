import { useState } from "react";
import { useApp } from "@context/AppContext";
import { PageHeader, TabPanel, Tabs } from "@ui/index";
import { reviewCounts } from "@lib/deck";
import { ReviewSession } from "./ReviewSession";
import { CardsManager } from "./CardsManager";

export default function ReviewPage() {
  const { state } = useApp();
  const [tab, setTab] = useState("review");
  const counts = reviewCounts(state);
  return (
    <>
      <PageHeader eyebrow="Train" title="Review" subtitle="Spaced repetition (FSRS): each card returns just before you'd forget it. A few minutes a day keeps every pattern sharp." />
      <Tabs
        value={tab}
        onValueChange={setTab}
        label="Review views"
        tabs={[
          { value: "review", label: "Review", count: counts.total },
          { value: "cards", label: "Cards" },
        ]}
      >
        <TabPanel value="review">
          <div style={{ marginTop: 24 }}>
            <ReviewSession />
          </div>
        </TabPanel>
        <TabPanel value="cards">
          <div style={{ marginTop: 24 }}>
            <CardsManager />
          </div>
        </TabPanel>
      </Tabs>
    </>
  );
}
