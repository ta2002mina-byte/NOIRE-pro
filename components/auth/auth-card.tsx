interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-4xl sm:text-5xl">{title}</h1>
        <p className="text-mute">{description}</p>
      </header>
      {children}
      {footer ? <p className="text-center text-sm text-mute">{footer}</p> : null}
    </div>
  );
}

export const authLinkClass = "text-ivory underline underline-offset-4 hover:text-ivory/80";
