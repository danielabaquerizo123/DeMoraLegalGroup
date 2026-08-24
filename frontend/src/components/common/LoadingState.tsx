type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Cargando informacion" }: LoadingStateProps) {
  return (
    <div className="state-block" role="status" aria-live="polite">
      <span className="state-line" />
      <p>{label}</p>
    </div>
  );
}
