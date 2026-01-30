export function ButtonV2(props:{label:string,onClick?:()=>void}) {
  return (
    <button
      onClick={props.onClick}
      style={{
        background:"var(--ui-accent)",
        color:"#fff",
        border:"0",
        borderRadius:"var(--ui-radius)",
        padding:"10px 14px",
        fontFamily:"var(--ui-font)",
        cursor:"pointer"
      }}
    >
      {props.label}
    </button>
  );
}
