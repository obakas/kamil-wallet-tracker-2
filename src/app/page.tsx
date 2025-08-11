// app/page.tsx
// import AddWalletForm from "@/components/AddWalletForm";
import TraceFlowUI from "@/components/TraceFlowUI";

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto py-10">
      <TraceFlowUI />
      {/* <AddWalletForm /> */}
    </main>
  );
}
