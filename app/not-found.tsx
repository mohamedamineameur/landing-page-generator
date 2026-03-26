import Image from "next/image";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 py-10">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-8 rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
        <div className="space-y-5">
          <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
            Erreur 404
          </span>
          <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Cette page est introuvable
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-600">
            Le lien demande n&apos;existe pas ou n&apos;est plus disponible. Retourne a l&apos;accueil ou continue sur
            ton espace de travail.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              href="/"
            >
              Retour a l&apos;accueil
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
              href="/projects"
            >
              Aller aux projets
            </Link>
          </div>
        </div>
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 p-2">
          <Image
            alt="Illustration erreur 404"
            className="h-auto w-full rounded-[18px]"
            height={1200}
            priority
            src="/404.png"
            width={1200}
          />
        </div>
      </div>
    </main>
  );
}

