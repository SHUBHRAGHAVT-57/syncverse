import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Check, Palette, UserRound, X } from 'lucide-react';
import DocumentRoom from './components/DocumentRoom';
import Workspace from './components/Workspace';
import { isRoomId, PALETTE, PROFILE_KEY, roomFromSearch } from './lib/documents';
import type { Profile } from './lib/documents';
import { loadProfile, saveProfile } from './lib/storage';
function readRoom() { return roomFromSearch(window.location.search); }
export default function App() {
  const profileDialog = useRef<HTMLDialogElement>(null);
  const [room, setRoom] = useState<string|null>(readRoom);
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [editingProfile, setEditingProfile] = useState(false);
  const [draft, setDraft] = useState(profile);
  useEffect(() => { const onPop = () => setRoom(readRoom()); window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop); }, []);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === PROFILE_KEY || event.key === null) setProfile(loadProfile());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  function navigate(next: string|null) { const url = new URL(window.location.href); if(next) url.searchParams.set('room', next); else url.searchParams.delete('room'); window.history.pushState({}, '', url); setRoom(next); window.scrollTo(0, 0); }
  function newDocument() { navigate(crypto.randomUUID()); }
  useEffect(() => {
    if (editingProfile) {
      profileDialog.current?.showModal();
      profileDialog.current?.querySelector('input')?.focus();
    }
  }, [editingProfile]);
  function closeProfile() { profileDialog.current?.close(); setEditingProfile(false); }
  function openProfile() { setDraft(profile); setEditingProfile(true); }
  function containProfileFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const controls = event.currentTarget.querySelectorAll<HTMLElement>('button, input');
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (document.activeElement === (event.shiftKey ? first : last)) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus();
    }
  }
  function commitProfile() { const next = { name: draft.name.trim().slice(0,32) || 'Guest creator', color: draft.color }; saveProfile(next); setProfile(next); closeProfile(); }
  return <><div className="app-root">{room === 'invalid' || (room && !isRoomId(room)) ? <div className="invalid-room"><h1>That document link doesn't look right.</h1><p>SyncVerse uses randomly generated document identifiers. Check the URL and try again.</p><button className="primary-btn" onClick={()=>navigate(null)}>Back to workspace</button></div> : room ? <DocumentRoom key={room} roomId={room} profile={profile} onBack={()=>navigate(null)} onEditProfile={openProfile}/> : <Workspace onNew={newDocument} onOpen={id=>navigate(id)} profile={profile} onEditProfile={openProfile}/>}</div>
  {editingProfile && <dialog ref={profileDialog} className="modal-backdrop" aria-labelledby="identity-title" aria-describedby="identity-description" onCancel={closeProfile} onKeyDown={containProfileFocus} onMouseDown={e=>{ if(e.currentTarget===e.target) closeProfile(); }}><div className="identity-modal"><div className="modal-title"><span className="modal-icon"><UserRound size={21}/></span><button aria-label="Close" onClick={closeProfile}><X size={19}/></button></div><h2 id="identity-title">Your profile</h2><p id="identity-description">Your display name and color are visible to collaborators in shared documents.</p><label className="form-label" htmlFor="display-name">DISPLAY NAME</label><input id="display-name" autoFocus maxLength={32} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="Your display name"/><div className="form-label"><Palette size={14}/> CHOOSE YOUR COLOR</div><div className="color-options">{PALETTE.map(color=><button key={color} type="button" aria-label={`Use color ${color}`} aria-pressed={draft.color===color} style={{background:color}} onClick={()=>setDraft({...draft,color})}>{draft.color === color && <Check size={16}/>}</button>)}</div><div className="modal-footer"><button className="secondary-btn" onClick={closeProfile}>Cancel</button><button className="primary-btn" onClick={commitProfile}>Save profile</button></div></div></dialog>}</>;
}
