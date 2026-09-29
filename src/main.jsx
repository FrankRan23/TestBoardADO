import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, ArrowUpRight, Bug, CheckCircle2, CircleDot, Clock3, GitPullRequest, Layers3, Search, Ticket, TrendingUp } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import './style.css';

const color = { New: '#7c89a4', Active: '#5576e9', Resolved: '#f0a557', Closed: '#43b79b', Done: '#43b79b' };
const fmt = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
const date = value => value ? fmt.format(new Date(value)) : '—';
const stateName = state => ({ 'To Do': 'New', Committed: 'Active' }[state] || state || 'New');

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Todos');
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/dashboard.json`, { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setData).catch(e => setError(e.message));
  }, []);
  const items = data?.items || [];
  const ado = items.filter(i => i.source === 'Azure DevOps');
  const github = items.filter(i => i.source === 'GitHub');
  const states = ['New', 'Active', 'Resolved', 'Closed'];
  const counts = states.map(s => ({ name: s, value: ado.filter(i => stateName(i.state) === s).length }));
  const done = ado.filter(i => ['Closed', 'Done'].includes(stateName(i.state))).length;
  const bugs = ado.filter(i => i.type === 'Bug').length;
  const types = ['Epic', 'Feature', 'User Story', 'Task', 'Bug'].map(t => ({ name: t, value: ado.filter(i => i.type === t).length }));
  const view = useMemo(() => items.filter(i => (filter === 'Todos' || i.source === filter) && `${i.title} ${i.id} ${i.type}`.toLowerCase().includes(query.toLowerCase())).slice(0, 100), [items, filter, query]);
  return <div className="shell">
    <aside className="side"><div className="brand"><span className="brandmark"><Activity size={20}/></span><span>Board<span className="accent">ADO</span><small>ANALYTICS</small></span></div>
      <div className="side-label">WORKSPACE</div><div className="nav active"><Layers3 size={18}/> Vista general</div><div className="nav"><Ticket size={18}/> Tickets <span>{items.length}</span></div>
      <div className="side-label sources">FUENTES DE DATOS</div><div className="source"><span className="dot blue"/> Azure DevOps <b>{ado.length}</b></div><div className="source"><span className="dot violet"/> GitHub <b>{github.length}</b></div>
      <div className="side-bottom"><span className="pulse"/> {data?.mode === 'demo' ? 'Modo demostración' : 'Sincronización activa'}<small>Actualización: {date(data?.generatedAt)}</small></div>
    </aside>
    <main><header><div className="crumb">Workspace <span>/</span> Dashboard</div><div className="header-right"><span className="live"><span className="pulse"/> {data?.mode === 'demo' ? 'Datos de ejemplo' : 'Datos sincronizados'}</span><div className="avatar">FR</div></div></header>
      <div className="content"><div className="eyebrow">PANEL DE ANALÍTICA <span>·</span> AZURE DEVOPS + GITHUB</div><div className="heading"><div><h1>Resumen de tickets</h1><p>Visibilidad del trabajo, prioridades y avance en un solo lugar.</p></div><div className="updated"><Clock3 size={16}/> Actualizado {date(data?.generatedAt)}</div></div>
      {error && <div className="notice">No se pudo cargar dashboard.json: {error}</div>}
      {data?.mode === 'demo' && <div className="notice">Vista de demostración. Configura el secreto AZURE_DEVOPS_PAT para sincronizar tickets reales.</div>}
      <div className="cards"><Metric icon={<Ticket/>} label="Tickets ADO" value={ado.length} note="En el proyecto" tone="blue"/><Metric icon={<CircleDot/>} label="En progreso" value={counts[1].value} note="Trabajo activo" tone="indigo"/><Metric icon={<CheckCircle2/>} label="Completados" value={done} note={`${ado.length ? Math.round(done / ado.length * 100) : 0}% del total ADO`} tone="green"/><Metric icon={<Bug/>} label="Bugs" value={bugs} note="Incidencias registradas" tone="amber"/></div>
      <div className="charts"><section className="panel"><div className="panel-head"><div><h2>Flujo de trabajo</h2><p>Distribución actual por estado</p></div><span className="chip">Azure DevOps</span></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={counts} barSize={44} margin={{top:10,right:8,left:-25,bottom:0}}><CartesianGrid stroke="#edf0f6" vertical={false}/><XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fill:'#77849b',fontSize:12}}/><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{fill:'#9aa5b8',fontSize:11}}/><Tooltip cursor={{fill:'#f5f7fb'}}/><Bar dataKey="value" radius={[6,6,0,0]}>{counts.map(x=><Cell key={x.name} fill={color[x.name]}/>)}</Bar></BarChart></ResponsiveContainer></div></section>
      <section className="panel"><div className="panel-head"><div><h2>Composición del backlog</h2><p>Tickets por tipo de trabajo</p></div><Layers3 size={18} color="#8c9ab0"/></div><div className="type-list">{types.map((x,i)=><div className="type-row" key={x.name}><div className="type-title"><span>{x.name}</span><strong>{x.value}</strong></div><div className="track"><div style={{width:`${ado.length ? x.value / ado.length * 100 : 0}%`,background:['#667ce7','#8b9df0','#a7b4f7','#63c7b4','#e7a371'][i]}}/></div></div>)}</div></section></div>
      <section className="panel table-panel"><div className="panel-head"><div><h2>Tickets recientes</h2><p>Elementos de todas las fuentes conectadas</p></div><span className="chip">{items.length} elementos</span></div><div className="toolbar"><div className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por ID, título o tipo..."/></div><div className="tabs">{['Todos','Azure DevOps','GitHub'].map(s=><button className={filter===s?'selected':''} key={s} onClick={()=>setFilter(s)}>{s}</button>)}</div></div><div className="table-wrap"><table><thead><tr><th>ID</th><th>TÍTULO</th><th>TIPO</th><th>ESTADO</th><th>PRIORIDAD</th><th>FUENTE</th><th>ACTUALIZADO</th></tr></thead><tbody>{view.map(i=><tr key={`${i.source}-${i.id}`}><td className="id">#{i.id}</td><td className="title">{i.url?<a href={i.url} target="_blank" rel="noreferrer">{i.title} <ArrowUpRight size={13}/></a>:i.title}</td><td>{i.type}</td><td><span className="status"><i style={{background:color[stateName(i.state)]||'#a4aaba'}}/>{stateName(i.state)}</span></td><td>{i.priority ? `P${i.priority}` : '—'}</td><td><span className="src-badge">{i.source}</span></td><td>{date(i.changedAt)}</td></tr>)}</tbody></table>{!view.length && <div className="empty">No hay tickets que coincidan con los filtros.</div>}</div></section>
      <footer>BoardADO <span>·</span> Datos generados el {date(data?.generatedAt)} <span>·</span> Los datos publicados son visibles para cualquiera con el enlace.</footer></div>
    </main></div>;
}
function Metric({icon,label,value,note,tone}) { return <div className="metric"><div className={`metric-icon ${tone}`}>{icon}</div><span>{label}</span><strong>{value}</strong><small>{note}</small></div> }
createRoot(document.getElementById('root')).render(<App/>);
