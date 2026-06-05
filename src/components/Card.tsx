interface CardProps {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Card({ title, children, footer }: CardProps) {
  return (
    <section className="card">
      {title ? <h2 className="card__title">{title}</h2> : null}
      <div className="card__body">{children}</div>
      {footer ? <div className="card__footer">{footer}</div> : null}
    </section>
  );
}