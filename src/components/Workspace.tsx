import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, FilePlus2, FileText, Github, Layers3, Link2, Search, ShieldAlert, Sparkles, Trash2, Users, WifiOff } from 'lucide-react';
import { formatTime } from '../lib/documents';
import type { Profile, RecentDocument } from '../lib/documents';
import { forgetDocument, loadRecents } from '../lib/storage';
interface Props { onOpen: (room: string) => void; onNew: () => void; profile: Profile; onEditProfile: () => void }
export default function Workspace({ onOpen, onNew, profile, onEditProfile }: Props) {
  const [recents, setRecents] = useState<RecentDocument[]>(() => loadRecents());
  const [query, setQuery] = useState('');
  useEffect(() => { setRecents(loadRecents()); }, []);
  const filtered = useMemo(() => recents.filter(doc => doc.title.toLowerCase().includes(query.toLowerCase())), [recents, query]);
  return <div className="app-frame">
    <aside className="sidebar">
      <div className="brand"><span className="brand-symbol"><Layers3 size={21}/></span><span>sync<span className="brand-highlight">verse</span><small>COLLABORATIVE STUDIO</small></span></div>
      <div className="side-label">WORKSPACE</div>
      <div className="nav-item active"><Layers3 size={17}/> Overview <span className="nav-dot"/></div>
      <div className="nav-item"><FileText size={17}/> Documents <span className="nav-count">{recents.length}</span></div>
      <div className="sidebar-bottom">
        <div className="side-tip"><Sparkles size={18}/><b>Make room for ideas.</b><p>Every document lives on your device and syncs with collaborators when connected.</p></div>
        <button className="profile" onClick={onEditProfile} title="Edit display name"><span className="avatar" style={{background:profile.color}}>{profile.name[0]?.toUpperCase()}</span><span><strong>{profile.name}</strong><small>Personal workspace</small></span><ArrowUpRight size={15}/></button>
      </div>
    </aside>
    <main className="main-column">
      <header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> <b>Overview</b></div><div className="top-actions"><a className="github-link" href="https://github.com/SHUBHRAGHAVT-57" target="_blank" rel="noreferrer"><Github size={17}/> GitHub</a><span className="top-separator"/><span className="online-indicator"><span/> Offline-ready</span></div></header>
      <section className="workspace-content">
        <div className="eyebrow"><span className="eyebrow-line"/> YOUR CREATIVE SPACE <span className="eyebrow-line"/></div>
        <section className="hero"><div className="hero-glow"/><div className="hero-content"><div className="hero-kicker"><Sparkles size={15}/> THE SPACE BETWEEN IDEAS AND EXECUTION</div><h1>Great things happen<br/><em>when minds connect.</em></h1><p>A calm space for focused writing, real-time collaboration, and ideas that never get left behind.</p><button className="primary-btn" onClick={onNew}><FilePlus2 size={18}/> Create a document <ArrowUpRight size={16}/></button></div><div className="hero-orb" aria-hidden="true"><span className="orbit orbit-one"/><span className="orbit orbit-two"/><span className="orb-core"><Layers3 size={44}/></span><span className="orb-node node-a"/><span className="orb-node node-b"/><span className="orb-node node-c"/></div></section>
        <div className="metrics"><div><span className="metric-icon violet"><FileText size={20}/></span><div><strong>{recents.length.toString().padStart(2, '0')}</strong><small>Recent documents</small></div></div><div><span className="metric-icon teal"><Users size={20}/></span><div><strong>∞</strong><small>Ideas to explore</small></div></div><div><span className="metric-icon amber"><WifiOff size={20}/></span><div><strong>Ready</strong><small>Local-first editing</small></div></div></div>
        <section className="documents"><div className="section-heading"><div><span className="eyebrow left">PICK UP WHERE YOU LEFT OFF</span><h2>Your documents</h2><p>Everything you've created or opened on this device.</p></div><label className="search"><Search size={16}/><input aria-label="Search documents" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a document..."/></label></div>
          {filtered.length ? <div className="document-grid">{filtered.map(doc=><article className="doc-card" key={doc.id}><button className="doc-body" onClick={()=>onOpen(doc.id)}><div className="doc-icon"><FileText size={20}/></div><h3>{doc.title}</h3><p>Collaborative Markdown document</p><div className="doc-footer"><span>Opened {formatTime(doc.updatedAt)}</span><ArrowUpRight size={16}/></div></button><button className="forget-btn" aria-label={`Remove ${doc.title} from recent documents`} title="Remove from recent list (not delete)" onClick={()=>setRecents(forgetDocument(doc.id))}><Trash2 size={14}/></button></article>)}</div> : <div className="empty-state"><span className="empty-illustration"><FileText size={30}/></span><h3>{query ? 'No documents found' : 'A blank page. Endless possibilities.'}</h3><p>{query ? 'Try another title.' : 'Create your first document, then invite someone in with a shareable link.'}</p>{!query && <button onClick={onNew} className="secondary-btn"><FilePlus2 size={17}/> Start writing</button>}</div>}
        </section>
        <footer className="workspace-footer"><span><ShieldAlert size={15}/> Preview: shared links are not private or access-controlled.</span><a href="https://github.com/yjs/yjs" rel="noreferrer" target="_blank">Built on Yjs <ArrowUpRight size={14}/></a></footer>
      </section>
    </main>
  </div>;
}
