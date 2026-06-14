type PlanCardProps = {
  name: string;
  description: string;
  features: string[];
  purchaseUrl: string;
  highlighted?: boolean;
};

export default function PlanCard({
  name,
  description,
  features,
  purchaseUrl,
  highlighted = false,
}: PlanCardProps) {
  return (
    <article
      className={[
        "rounded-2xl border bg-[#0d1017] p-6",
        highlighted
          ? "border-orange-400/40 shadow-[0_0_35px_rgba(249,115,22,0.08)]"
          : "border-white/10",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-white">
          {name}
        </h3>

        {highlighted && (
          <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300">
            Advanced
          </span>
        )}
      </div>

      <p className="mt-3 text-sm leading-6 text-zinc-400">
        {description}
      </p>

      <ul className="mt-5 space-y-3">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-3 text-sm text-zinc-300"
          >
            <span className="h-2 w-2 rounded-full bg-orange-400" />
            {feature}
          </li>
        ))}
      </ul>

      <a
        href={purchaseUrl}
        className={[
          "mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition",
          highlighted
            ? "bg-orange-500 text-black hover:bg-orange-400"
            : "border border-orange-400/30 text-orange-300 hover:bg-orange-500/10",
        ].join(" ")}
      >
        View plan on Evilink
      </a>
    </article>
  );
}