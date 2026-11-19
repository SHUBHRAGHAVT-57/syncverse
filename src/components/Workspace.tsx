import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, FilePlus2, FileText, Github, Layers3, Search, ShieldAlert, Trash2, UserRound } from 'lucide-react';
import { formatTime, RECENTS_KEY } from '../lib/documents';
import type { Profile, RecentDocument } from '../lib/documents';
import { forgetDocument, loadRecents } from '../lib/storage';
interface Props { onOpen: (room: string) => void; onNew: () => void; profile: Profile; onEditProfile: () => void }
export default function Workspace({ onOpen, onNew, profile, onEditProfile }: Props) {
  const [recents, setRecents] = useState<RecentDocument[]>(() => loadRecents());
  const [query, setQuery] = useState('');
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === RECENTS_KEY || event.key === null) setRecents(loadRecents());
    };
    setRecents(loadRecents());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const filtered = useMemo(() => recents.filter(doc => doc.title.toLowerCase().includes(query.toLowerCase())), [recents, query]);
  return <div className="app-frame">
    <aside className="sidebar" aria-label="Workspace">
      <a className="brand" href="./" aria-label="SyncVerse workspace"><span className="brand-symbol"><Layers3 size={21}/></span><span>sync<span className="brand-highlight">verse</span></span></a>
      <nav aria-label="Workspace navigation"><a className="nav-item active" href="#documents" aria-current="page"><FileText size={18}/> Your documents <span className="nav-count">{recents.length}</span></a></nav>
      <div className="sidebar-bottom">
        <p className="workspace-note">A shared space for your next draft.<br/>Your recent list stays on this device.</p>
        <button className="profile" onClick={onEditProfile} title="Edit display name"><span className="avatar" style={{background:profile.color}}>{profile.name[0]?.toUpperCase()}</span><span><strong>{profile.name}</strong><small>Edit your profile</small></span><UserRound size={17}/></button>
      </div>
    </aside>
    <main className="main-column" id="documents">
      <header className="topbar"><span className="breadcrumbs">Workspace</span><div className="top-actions"><a className="github-link" href="https://github.com/SHUBHRAGHAVT-57" target="_blank" rel="noreferrer"><Github size={17}/> GitHub <ArrowUpRight size={13}/></a><button className="mobile-profile-button" aria-label="Edit display name" title="Edit profile" onClick={onEditProfile}><UserRound size={18}/></button></div></header>
      <div className="workspace-content">
        <header className="library-heading"><div><h1>Your documents</h1><p>Pick up a draft or make room for a new idea.</p></div><button className="primary-btn" onClick={onNew}><FilePlus2 size={18}/> Create a document</button></header>
        <section className="documents" aria-label="Recent documents">
          <div className="library-toolbar"><h2>Recent <span>{recents.length}</span></h2><label className="search"><Search size={17}/><input aria-label="Search documents" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by title" type="search"/></label></div>
          <p className="results-count" role="status">{query ? `${filtered.length} ${filtered.length === 1 ? 'document' : 'documents'} matching “${query}”` : 'Created or opened on this device'}</p>
          {filtered.length ? <div className="document-grid">{filtered.map(doc=><article className="doc-card" key={doc.id}><button className="doc-body" onClick={()=>onOpen(doc.id)}><span className="doc-icon"><FileText size={21}/></span><span className="doc-copy"><h3>{doc.title}</h3><span className="doc-description">Markdown document</span></span><span className="doc-footer">Opened {formatTime(doc.updatedAt)}<ArrowUpRight size={17}/></span></button><button className="forget-btn" aria-label={`Remove ${doc.title} from recent documents`} title="Remove from recent list (not delete)" onClick={()=>setRecents(forgetDocument(doc.id))}><Trash2 size={17}/></button></article>)}</div> : <div className="empty-state"><span className="empty-illustration"><FileText size={28}/></span><h3>{query ? 'No matching documents' : 'Your first draft starts here'}</h3><p>{query ? 'Try a different title, or clear your search to see all recent documents.' : 'Create a Markdown document, then share its link to write together. Documents you open will appear here.'}</p>{query ? <button className="secondary-btn" onClick={()=>setQuery('')}>Clear search</button> : <p className="empty-detail">Have a shared document? Open its link to add it to your workspace.</p>}</div>}
        </section>
        <footer className="workspace-footer"><p><ShieldAlert size={17}/> Shared links allow anyone with the URL to edit. Keep confidential information out of shared documents.</p><a href="https://github.com/yjs/yjs" rel="noreferrer" target="_blank">Built with Yjs <ArrowUpRight size={14}/></a></footer>
      </div>
    </main>
  </div>;
}
