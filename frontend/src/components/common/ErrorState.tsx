type ErrorStateProps = {
  message?: string;
};

export function ErrorState({ message = "No pudimos cargar esta informacion." }: ErrorStateProps) {
  return (
    <div className="state-block state-block--error" role="alert">
      <p>{message}</p>
    </div>
  );
}
