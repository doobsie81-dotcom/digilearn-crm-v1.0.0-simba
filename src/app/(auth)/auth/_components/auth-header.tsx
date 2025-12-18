"use client";

export default function AuthHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
  showLogo?: boolean;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
