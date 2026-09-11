import Link from "next/link";
import { Children, cloneElement, isValidElement, useId } from "react";
import { ArrowRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeader({ eyebrow, title, subtitle, href, hrefLabel, className, align = "left" }: { eyebrow?: string; title: string; subtitle?: string; href?: string; hrefLabel?: string; className?: string; align?: "left" | "center" }) {
  return (
    <div className={cn("mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", align === "center" && "items-center text-center sm:flex-col sm:items-center", className)}>
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="mt-2 text-ink-soft">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-strong">
          {hrefLabel ?? "Ver todo"}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export function EmptyState({ title, text, action, icon: Icon = Inbox, className }: { title: string; text?: string; action?: React.ReactNode; icon?: React.ComponentType<{ className?: string }>; className?: string }) {
  return (
    <div className={cn("card flex flex-col items-center justify-center px-6 py-16 text-center", className)}>
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-ink-muted">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-ink-soft">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-muted", className)} aria-hidden />;
}

export function PageHeader({ title, subtitle, children, className }: { title: string; subtitle?: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

const CONTROL_TAGS = new Set(["input", "select", "textarea"]);

/**
 * Campo de formulario: asocia la etiqueta al control (htmlFor/id), y enlaza el mensaje de error
 * o la ayuda mediante aria-describedby. Si el hijo directo es un input/select/textarea recibe el id;
 * en otro caso la etiqueta actúa como agrupador.
 */
export function Field({ label, error, hint, children, className, required, id: givenId }: { label?: string; error?: string; hint?: string; children: React.ReactNode; className?: string; required?: boolean; id?: string }) {
  const autoId = useId();
  const id = givenId ?? `f${autoId}`;
  const descId = `${id}-desc`;
  const hasDesc = !!(error || hint);
  let control = children;
  let labelFor: string | undefined;
  const only = Children.count(children) === 1 ? Children.only(children) : null;
  if (only && isValidElement(only) && typeof only.type === "string" && CONTROL_TAGS.has(only.type)) {
    const el = only as React.ReactElement<Record<string, unknown>>;
    const props = el.props;
    labelFor = (props.id as string | undefined) ?? id;
    control = cloneElement(el, {
      id: labelFor,
      "aria-invalid": error ? true : props["aria-invalid"],
      "aria-describedby": hasDesc ? [props["aria-describedby"], descId].filter(Boolean).join(" ") : props["aria-describedby"],
      "aria-required": required ? true : props["aria-required"],
    });
  }
  return (
    <div className={className}>
      {label && (
        <label className="label" htmlFor={labelFor}>
          {label} {required && <span className="text-danger" aria-hidden>*</span>}
        </label>
      )}
      {control}
      {hint && !error && <p id={descId} className="mt-1 text-xs text-ink-muted">{hint}</p>}
      {error && <p id={descId} role="alert" className="mt-1 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn("inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)} role="status" aria-label="Cargando" />;
}
