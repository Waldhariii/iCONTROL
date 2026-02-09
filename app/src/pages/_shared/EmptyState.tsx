export function EmptyState(props: { title: string; details?: string }){
  return (
    <div className="ic-empty-state">
      <div className="ic-empty-title">{props.title}</div>
      {props.details ? <div className="ic-empty-details">{props.details}</div> : null}
    </div>
  );
}
