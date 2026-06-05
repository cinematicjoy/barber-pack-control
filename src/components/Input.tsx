import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="field" htmlFor={inputId}>
      <span className="field__label">{label}</span>
      <input id={inputId} className="field__input" {...props} />
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}