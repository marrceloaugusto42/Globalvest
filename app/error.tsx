"use client";
export default function ErrorPage({error,reset}:{error:Error & {digest?:string};reset:()=>void}) {
 return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,fontFamily:"Arial",background:"#f5f7fa",color:"#111827"}}>
 <section style={{maxWidth:480,padding:24,background:"#fff",borderRadius:16}}>
 <h1>Globalvest couldn’t load</h1><p>Diagnostic information:</p>
 <pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",fontSize:13,color:"#9a3412"}}>{error?.message || String(error) || "No message"}</pre>
 {error?.digest ? <p>Reference: {error.digest}</p> : null}
 <button onClick={reset} style={{padding:12,background:"#16a34a",color:"white",border:0,borderRadius:8}}>Try again</button>
 </section></main>;
}