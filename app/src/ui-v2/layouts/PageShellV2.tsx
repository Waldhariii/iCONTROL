export function PageShellV2(props:{title:string,children:any}) {
  return (
    <div style={{
      background:"var(--ui-bg)",
      color:"var(--ui-text)",
      minHeight:"100vh",
      fontFamily:"var(--ui-font)",
      padding:"24px"
    }}>
      <h1>{props.title}</h1>
      <div style={{marginTop:"24px"}}>{props.children}</div>
    </div>
  );
}
