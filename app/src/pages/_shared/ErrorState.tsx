export function ErrorState(props: { title: string; details?: string }){
  return (
    <div className="ic-error-state">
      <div className="ic-error-title">{props.title}</div>
      {props.details ? <pre className="ic-error-details">{props.details}</pre> : null}
    </div>
  );
}
