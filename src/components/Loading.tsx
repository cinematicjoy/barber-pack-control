interface LoadingProps {
  text?: string;
}

export function Loading({ text = 'Cargando...' }: LoadingProps) {
  return (
    <div className="loading">
      <div className="loading__spinner" />
      <p>{text}</p>
    </div>
  );
}