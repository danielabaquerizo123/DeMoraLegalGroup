type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p className="eyebrow">En preparacion</p>
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}
