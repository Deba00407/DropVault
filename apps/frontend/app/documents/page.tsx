"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/(utils)/auth";
import { DocumentList } from "@/app/(components)/DocumentList";
import { Loader } from "@/app/(components)/Loader";
import { NavBar } from "@/app/(components)/NavBar";
import { FilePdf } from "@phosphor-icons/react";

const DocumentsPage = () => {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/getting-started/sign-in");
    }
  }, [session, isPending, router]);

  if (isPending || !session) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-[#F4F1E8] text-[#1C1B18]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DBD5C6] px-6 py-4 md:px-16">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#1C1B18]">
            DropVault
          </h1>
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#8A8370]">
            Documents
          </span>
        </div>
        <NavBar />
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 md:px-16">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FilePdf className="h-6 w-6 text-[#B54708]" weight="duotone" />
            <h2 className="font-serif text-lg font-medium text-[#1C1B18]">
              Your Documents
            </h2>
          </div>
        </div>

        <DocumentList />
      </main>
    </div>
  );
};

export default DocumentsPage;
