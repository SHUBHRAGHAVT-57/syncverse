import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Check, ChevronDown, Clipboard, Cloud, CloudOff, Download, Edit3, Eye, FileText, Link2, LoaderCircle, Pencil, ShieldAlert, Wifi, Users, UserRound } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cleanTitle } from '../lib/documents';
import { connectionState } from '../lib/connection-status';
import type { Profile } from '../lib/documents';
import { makeSession, participantsFromAwareness } from '../lib/collaboration';
import type { CollaborationSession, ConnectionState, Participant } from '../lib/collaboration';
import { rememberDocument } from '../lib/storage';
import MarkdownEditor from './MarkdownEditor';
interface Props { roomId: string; profile: Profile; onBack: () => void; onEditProfile: () => void }
function downloadText(content: string, title: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${cleanTitle(title).replace(/[^a-z0-9 _-]+/gi, '').replace(/\s+/g, '-') || 'syncverse-document'}.md`;
  document.body.appendChild(link);
  link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function DocumentRoom({ roomId, profile, onBack, onEditProfile }: Props) {
  const [session] = useState<CollaborationSession>(() => makeSession(roomId, profile, import.meta.env.VITE_SYNCVERSE_WS_URL));
  const [title, setTitle] = useState(() => cleanTitle(session.metadata.get('title')));
  const [draftTitle, setDraftTitle] = useState(title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>(() => connectionState(session.provider));
  const [syncPaused, setSyncPaused] = useState(false);
  const [cacheLoaded, setCacheLoaded] = useState(() => session.persistence.synced);
  const [participants, setParticipants] = useState<Participant[]>(() => participantsFromAwareness(session.awareness, session.document.clientID));
  const [text, setText] = useState(() => session.content.toString());
  const [tab, setTab] = useState<'edit'|'preview'>('edit');
  const [copied, setCopied] = useState(false);
  const shareUrl = useMemo(() => `${window.location.origin}${window.location.pathname}?room=${roomId}`, [roomId]);
  useEffect(() => {
    const onMeta = () => {
      const next = cleanTitle(session.metadata.get('title'));
      setTitle(next);
      rememberDocument({ id: roomId, title: next, updatedAt: Date.now() });
    };
    const onContent = () => setText(session.content.toString());
    const onMembers = () => setParticipants(participantsFromAwareness(session.awareness, session.document.clientID));
    const onStatus = () => setConnection(connectionState(session.provider));
    session.metadata.observe(onMeta);
    session.content.observe(onContent);
    session.awareness.on('change', onMembers);
    session.provider?.on('status', onStatus);
    session.provider?.on('sync', onStatus);
    session.persistence.on('synced', onLocalSync);
    function onLocalSync() { setCacheLoaded(true); onMeta(); }
    onStatus();
    onContent();
    onMeta();
    onMembers();
    setCacheLoaded(session.persistence.synced);
    return () => {
      session.metadata.unobserve(onMeta);
      session.content.unobserve(onContent);
      session.awareness.off('change', onMembers);
      session.provider?.off('status', onStatus);
      session.provider?.off('sync', onStatus);
      session.persistence.off('synced', onLocalSync);
      session.destroy();
    };
  }, [roomId, session]);
  useEffect(() => { session.awareness.setLocalStateField('user', { ...profile, colorLight: `${profile.color}40` }); }, [profile, session]);
  useEffect(() => { if (!editingTitle) setDraftTitle(title); }, [title, editingTitle]);
  const saveTitle = useCallback(() => {
    const cleaned = cleanTitle(draftTitle);
    session.metadata.set('title', cleaned);
    setEditingTitle(false);
  }, [draftTitle, session]);
  function toggleSync() {
    if (!session.provider) return;
    if (syncPaused) {
      setConnection('connecting');
      session.provider.connect();
      setSyncPaused(false);
    } else {
      session.provider.disconnect();
      setConnection('offline');
      setSyncPaused(true);
    }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); window.setTimeout(() => setCopied(false), 2400); }
    catch { window.prompt('Copy the document link:', shareUrl); }
  }
  const statusName = syncPaused ? 'Sync paused · Edits pending sync' : connection === 'live' ? 'Connected · Live sync' : connection === 'connecting' ? 'Connecting and synchronizing…' : connection === 'offline' ? 'Disconnected · Edits pending sync' : 'Local only · Configure a sync server';
  return <div className="room-shell">
    <header className="room-header">
      <div className="room-header-left"><button className="back-button" aria-label="Back to workspace" title="Back to workspace" onClick={onBack}><ArrowLeft size={19}/></button><span className="room-header-divider"/><span className="brand-symbol mini"><FileText size={18}/></span>
        <div className="room-title-group"><div className="room-title-row">{editingTitle ? <input autoFocus aria-label="Document title" className="room-title-input" value={draftTitle} maxLength={100} onChange={e => setDraftTitle(e.target.value)} onBlur={saveTitle} onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setDraftTitle(title); setEditingTitle(false); } }}/> : <button onClick={()=>setEditingTitle(true)} className="title-button" aria-label="Rename document">{title}<Pencil size={13}/></button>}</div><span className="room-path">SyncVerse / Shared document</span></div></div>
      <div className="room-header-right"><button className="mobile-profile-button" aria-label="Edit display name" title="Edit profile" onClick={onEditProfile}><UserRound size={18}/></button><div className="status" title={statusName}><span className={`status-dot ${connection}`}/><span className="status-label">{connection === 'live' ? 'Live' : connection === 'connecting' ? 'Connecting' : connection === 'local' ? 'Local only' : 'Offline'}</span></div><div className="vertical-rule"/><button type="button" className="sync-toggle" aria-label={syncPaused ? "Resume sync" : "Pause sync"} title={syncPaused ? "Resume collaboration" : "Work offline temporarily"} aria-pressed={syncPaused} disabled={!session.provider} onClick={toggleSync}>{syncPaused ? <CloudOff size={17}/> : <Wifi size={17}/>}</button><button className="share-btn" aria-label={copied ? "Link copied" : "Copy document link"} onClick={copyLink}>{copied ? <Check size={17}/> : <Link2 size={17}/>}<span>{copied ? 'Copied!' : 'Share link'}</span></button></div>
    </header>
    <div className="room-grid">
      <aside className="room-rail"><div className="rail-top"><span className="rail-kicker">Document</span><div className="rail-section-active"><FileText size={17}/> Content</div></div><div className="rail-divider"/><div className="rail-top"><span className="rail-kicker">In this document <span className="member-count">{participants.length}</span></span><div className="members">{participants.map(person => <div className="member" key={person.clientId}><span className="member-avatar" style={{background:person.color}}>{person.name.charAt(0).toUpperCase()}</span><div><b>{person.name}</b><small>{person.local ? 'You' : 'Editing this document'}</small></div><span className="member-online"/></div>)}</div><button className="invite-link" onClick={copyLink}><Link2 size={15}/> Invite by link <ArrowUpRight size={14}/></button></div><div className="rail-spacer"/><div className="privacy-note"><ShieldAlert size={18}/><b>Link access enabled</b><p>Anyone with the URL can edit this document. Do not enter confidential information.</p></div><button className="rail-profile" onClick={onEditProfile}>Edit display name <ChevronDown size={15}/></button></aside>
      <main className="room-main"><div className="editor-heading"><div><h1>{title}</h1><p>Markdown, with room for every idea.</p></div><div className="editor-actions"><button className="tool-button" title="Download Markdown file" onClick={()=>downloadText(text, title)}><Download size={17}/> <span>Export</span></button></div></div>
        <div className="editor-panel"><div className="editor-toolbar"><div className="tab-switch"><button aria-pressed={tab === 'edit'} className={tab === 'edit' ? 'selected' : ''} onClick={()=>setTab('edit')}><Edit3 size={16}/> Write</button><button aria-pressed={tab === 'preview'} className={tab === 'preview' ? 'selected' : ''} onClick={()=>setTab('preview')}><Eye size={16}/> Preview</button></div><div className="editor-meta"><span className="markdown-pill">MARKDOWN</span><span className="toolbar-dot"/><span>{text.trim() ? text.trim().split(/\s+/).length : 0} words</span></div></div>
          {tab === 'edit' ? <MarkdownEditor session={session}/> : <article className="markdown-preview">{text.trim() ? <ReactMarkdown skipHtml components={{ img: ({ alt }) => <span className="blocked-image">[External image blocked{alt ? `: ${alt}` : ''}]</span>, a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> }}>{text}</ReactMarkdown> : <p className="preview-empty">Your Markdown preview will appear here as you write.</p>}</article>}
          <div className="editor-bottom"><div className="sync-status" role="status">{connection === 'live' ? <Wifi size={15}/> : connection === 'connecting' ? <LoaderCircle size={15}/> : <CloudOff size={15}/>} <span>{statusName}</span></div><div className="storage-status"><Cloud size={15}/> {cacheLoaded ? 'Offline cache loaded' : 'Loading offline cache...'}</div></div>
        </div><p className="editor-hint"><ShieldAlert size={16}/> Anyone with this document's link can edit. Collaboration requires a configured sync server.</p>
      </main>
    </div>
  </div>;
}
