import React, { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE = 'acl-roomgrid-18rooms-v1';
const rooms = ['A1-203', 'A2-106', 'A2-107', 'A3-208', 'A3-209', 'B1-205', 'B1-206', 'B1-207', 'B2-104', 'B2-105', 'B3-301', 'C1-102', 'C1-103', 'C2-201', 'C2-202', 'C3-101', 'C3-102', 'D1-101'];
// End dates are exclusive; all sample reservations use non-overlapping date ranges.
const sampleRows = [
  ['A1-203', '2026-11-09', '2026-11-11', 'Peer tutoring', 'other'],
  ['A1-203', '2026-11-13', '2026-11-15', 'Architecture workshop', 'other'],
  ['A1-203', '2026-11-17', '2026-11-19', 'Group assignment', 'you'],
  ['A2-106', '2026-11-10', '2026-11-13', 'Seminar preparation', 'other'],
  ['A2-106', '2026-11-16', '2026-11-19', 'Study circle', 'other'],
  ['A2-107', '2026-11-09', '2026-11-10', 'Student club planning', 'you'],
  ['A2-107', '2026-11-12', '2026-11-15', 'Project demo rehearsal', 'other'],
  ['A2-107', '2026-11-16', '2026-11-19', 'Study meeting', 'other'],
  ['A3-208', '2026-11-11', '2026-11-14', 'Presentation practice', 'other'],
  ['A3-208', '2026-11-16', '2026-11-18', 'Tutorial group', 'other'],
  ['A3-209', '2026-11-10', '2026-11-12', 'Study session', 'other'],
  ['B1-205', '2026-11-09', '2026-11-11', 'Meeting', 'other'],
  ['B1-205', '2026-11-13', '2026-11-15', 'Team discussion', 'other'],
  ['B1-205', '2026-11-16', '2026-11-18', 'Course project', 'other'],
  ['B1-206', '2026-11-11', '2026-11-13', 'Exam revision', 'other'],
  ['B1-206', '2026-11-17', '2026-11-20', 'Debate practice', 'you'],
  ['B1-207', '2026-11-10', '2026-11-12', 'Group study', 'you'],
  ['B1-207', '2026-11-16', '2026-11-19', 'Engineering project', 'other'],
  ['B2-104', '2026-11-09', '2026-11-11', 'Weekly study group', 'you'],
  ['B2-104', '2026-11-13', '2026-11-15', 'Team planning', 'other'],
  ['B2-104', '2026-11-17', '2026-11-19', 'Workshop preparation', 'other'],
  ['B2-105', '2026-11-12', '2026-11-15', 'Club meeting', 'other'],
  ['B2-105', '2026-11-16', '2026-11-18', 'Student committee', 'other'],
  ['B3-301', '2026-11-09', '2026-11-10', 'Debate practice', 'other'],
  ['B3-301', '2026-11-11', '2026-11-13', 'Group preparation', 'other'],
  ['B3-301', '2026-11-18', '2026-11-20', 'Portfolio review', 'other'],
  ['C1-102', '2026-11-10', '2026-11-14', 'Capstone meeting', 'other'],
  ['C1-102', '2026-11-16', '2026-11-19', 'Revision session', 'other'],
  ['C1-103', '2026-11-09', '2026-11-12', 'Group project', 'other'],
  ['C1-103', '2026-11-14', '2026-11-16', 'Student society', 'you'],
  ['C2-201', '2026-11-12', '2026-11-15', 'Project sprint', 'other'],
  ['C2-201', '2026-11-16', '2026-11-19', 'Robotics club', 'other'],
  ['C2-202', '2026-11-09', '2026-11-11', 'Lab preparation', 'other'],
  ['C2-202', '2026-11-18', '2026-11-20', 'Teaching assistant session', 'other'],
  ['C3-101', '2026-11-12', '2026-11-14', 'Presentation rehearsal', 'you'],
  ['C3-101', '2026-11-14', '2026-11-16', 'Design workshop', 'other'],
  ['C3-101', '2026-11-18', '2026-11-20', 'Study group', 'other'],
  ['C3-102', '2026-11-11', '2026-11-15', 'Research meeting', 'other'],
  ['D1-101', '2026-11-10', '2026-11-13', 'Team check-in', 'other'],
  ['D1-101', '2026-11-16', '2026-11-18', 'Group assignment', 'you'],
];
const seed = sampleRows.map(([roomNumber, startDate, endDate, purpose, owner], index) => ({ id: `demo-${index + 1}`, roomNumber, startDate, endDate, purpose, owner }));
const formEmpty = { roomNumber: '', startDate: '', endDate: '', purpose: '' };

function read() { try { const a = JSON.parse(localStorage.getItem(STORAGE)); return Array.isArray(a) ? a : seed; } catch { return seed; } }
function addDays(iso, days) { const t = new Date(`${iso}T12:00:00Z`); t.setUTCDate(t.getUTCDate() + days); return t.toISOString().slice(0, 10); }
function human(iso) { return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' }); }
function weekDay(iso) { return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short' }); }
function daysBetween(a, b) { return Math.round((new Date(`${b}T12:00:00Z`) - new Date(`${a}T12:00:00Z`)) / 86400000); }
function weekStart(iso) { const dow = (new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7; return addDays(iso, -dow); }
function canonicalRoom(text) { const t = text.trim().toLowerCase(); return rooms.find(r => r.toLowerCase() === t) || ''; }

// Stored end dates are exclusive. Show people the days they actually get, e.g. "Tue 17 Nov – Wed 18 Nov · 2 days".
function rangeLabel(start, end) {
  const n = daysBetween(start, end);
  const last = addDays(end, -1);
  const first = `${weekDay(start)} ${human(start)}`;
  return n > 1 ? `${first} – ${weekDay(last)} ${human(last)} · ${n} days` : `${first} · 1 day`;
}

// Returns null, or { field, message } so errors can be shown next to the field that caused them.
function issue(form, bookings, id) {
  const typed = form.roomNumber.trim();
  if (!typed) return { field: 'roomNumber', message: 'Choose a room.' };
  const room = canonicalRoom(typed);
  if (!room) return { field: 'roomNumber', message: `"${typed}" is not a room in the directory. Pick one from the list.` };
  if (!form.startDate) return { field: 'startDate', message: 'Choose a start date.' };
  if (!form.endDate) return { field: 'endDate', message: 'Choose an end date.' };
  if (form.endDate <= form.startDate) return { field: 'endDate', message: 'End date must be after the start date (the end date itself is not booked).' };
  const clash = bookings.find(b => b.id !== id && b.roomNumber.toLowerCase() === room.toLowerCase() && form.startDate < b.endDate && form.endDate > b.startDate);
  if (clash) return { field: 'dates', message: `${room} is already booked ${rangeLabel(clash.startDate, clash.endDate)}${clash.owner === 'you' ? ' (your other booking)' : ''}. Choose other dates or another room.` };
  return null;
}

export default function App() {
  const [bookings, setBookings] = useState(read);
  const [week, setWeek] = useState('2026-11-09');
  const [view, setView] = useState('All rooms');
  const [form, setForm] = useState({ ...formEmpty });
  const [editing, setEditing] = useState(null);
  const [attempted, setAttempted] = useState(false);
  const [notice, setNotice] = useState('');
  const [anchor, setAnchor] = useState(null); // first click of a two-click range selection
  const formRef = useRef(null);
  const fieldRefs = { roomNumber: useRef(null), startDate: useRef(null), endDate: useRef(null) };

  useEffect(() => { try { localStorage.setItem(STORAGE, JSON.stringify(bookings)); } catch { /* storage unavailable */ } }, [bookings]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(week, i)), [week]);
  const myBookings = bookings.filter(b => b.owner === 'you').sort((a, b) => a.startDate.localeCompare(b.startDate));
  const roomList = view === 'All rooms' ? rooms : rooms.filter(r => r === view);
  const occupied = (room, date) => bookings.find(b => b.roomNumber === room && date >= b.startDate && date < b.endDate);
  const editingRow = bookings.find(b => b.id === editing);

  const problem = issue(form, bookings, editing);
  const complete = Boolean(form.roomNumber.trim() && form.startDate && form.endDate);
  const selRoom = canonicalRoom(form.roomNumber);
  const hasRange = Boolean(selRoom && form.startDate && form.endDate > form.startDate);
  const invalid = f => Boolean(problem && (attempted || complete) && (problem.field === f || (problem.field === 'dates' && f !== 'roomNumber')));
  const fieldError = f => (attempted && !complete && problem && problem.field === f ? problem.message : '');

  function scrollToForm() { formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function focusField(field) { const ref = fieldRefs[field === 'dates' ? 'startDate' : field]; ref?.current?.focus({ preventScroll: true }); }
  function update(field, value) { setForm(f => ({ ...f, [field]: value })); setNotice(''); if (field !== 'purpose') setAnchor(null); }

  function pick(room, date) {
    const b = occupied(room, date);
    if (b && b.id !== editing) { if (b.owner === 'you') edit(b); return; }
    setNotice('');
    setAttempted(false);
    if (anchor && anchor.room === room && date > anchor.date) {
      // Second click in the same row: extend the selection to include this day.
      setForm(f => ({ ...f, roomNumber: room, startDate: anchor.date, endDate: addDays(date, 1) }));
      setAnchor(null);
      scrollToFormIfStacked();
    } else {
      setForm(f => ({ ...f, roomNumber: room, startDate: date, endDate: addDays(date, 1) }));
      setAnchor({ room, date });
    }
  }
  function scrollToFormIfStacked() { if (window.matchMedia('(max-width:1200px)').matches) scrollToForm(); }

  function edit(row) {
    if (row.owner !== 'you') return;
    setEditing(row.id);
    setForm({ roomNumber: row.roomNumber, startDate: row.startDate, endDate: row.endDate, purpose: row.purpose });
    setAttempted(false); setNotice(''); setAnchor(null);
    setWeek(weekStart(row.startDate));
    if (view !== 'All rooms' && view !== row.roomNumber) setView('All rooms');
    scrollToForm();
    fieldRefs.startDate.current?.focus({ preventScroll: true });
  }

  function cancelEdit() { setEditing(null); setForm({ ...formEmpty }); setAttempted(false); setAnchor(null); setNotice(''); }

  function submit(e) {
    e.preventDefault();
    setNotice('');
    setAttempted(true);
    if (problem) { focusField(problem.field); return; }
    const payload = { roomNumber: selRoom, startDate: form.startDate, endDate: form.endDate, purpose: form.purpose.trim(), owner: 'you' };
    const summary = `${payload.roomNumber}, ${rangeLabel(payload.startDate, payload.endDate)}`;
    if (editing) { setBookings(bookings.map(b => (b.id === editing ? { ...b, ...payload } : b))); setNotice(`Booking updated: ${summary}.`); }
    else { setBookings([...bookings, { ...payload, id: 'b-' + Date.now() }]); setNotice(`Room reserved: ${summary}. It is listed under "Your bookings".`); }
    setForm({ ...formEmpty }); setEditing(null); setAttempted(false); setAnchor(null);
  }

  function check() {
    setAttempted(true);
    setNotice('');
    if (problem) focusField(problem.field);
    else setNotice('No conflict detected for the selected dates.');
  }

  function reset() {
    if (!window.confirm('Restore the example bookings? Any bookings you created or changed in this browser will be lost.')) return;
    setBookings(seed); setForm({ ...formEmpty }); setEditing(null); setAttempted(false); setAnchor(null);
    setWeek('2026-11-09'); setView('All rooms'); setNotice('Example bookings restored.');
  }

  function cell(room, day) {
    const b = occupied(room, day);
    const beingEdited = Boolean(b && b.id === editing);
    const kind = !b || beingEdited ? 'available' : b.owner === 'you' ? 'mine' : 'taken';
    const inSel = hasRange && selRoom === room && day >= form.startDate && day < form.endDate;
    const conflict = inSel && kind !== 'available';
    const label = beingEdited ? 'Editing' : kind === 'mine' ? 'Yours' : kind === 'taken' ? 'Booked' : 'Open';
    const sub = conflict ? 'Conflict' : inSel ? 'Selected' : kind === 'mine' ? 'Click to change' : kind === 'taken' ? 'Unavailable' : '';
    const description = kind === 'taken' ? 'reserved by someone else'
      : kind === 'mine' ? `your booking (${b.purpose || 'no purpose'}), select to change it`
      : beingEdited ? 'the booking you are changing' : 'available';
    return (
      <button
        key={room + day}
        type="button"
        className={`slot ${kind}${inSel ? ' selected' : ''}${conflict ? ' conflict' : ''}${anchor && anchor.room === room && anchor.date === day ? ' anchor' : ''}`}
        disabled={kind === 'taken'}
        aria-pressed={inSel}
        aria-label={`${room}, ${weekDay(day)} ${human(day)}: ${description}${inSel ? ', in your selection' : ''}`}
        title={`${room}, ${weekDay(day)} ${human(day)}: ${description}`}
        onClick={() => pick(room, day)}
      >
        <span>{label}</span>{sub && <small>{sub}</small>}
      </button>
    );
  }

  const hint = anchor
    ? <>Start: <strong>{anchor.room}, {weekDay(anchor.date)} {human(anchor.date)}</strong>. Click a later open day in the same row to extend, or <button type="button" className="linkish" onClick={scrollToForm}>continue in the form</button>.</>
    : 'Click an open day to start a booking, then a later day in the same row to extend it. Click one of your bookings to change it.';

  return (
    <div className="room-app">
      <header className="topbar">
        <div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div>
        <nav aria-label="Page sections">
          <a href="#calendar">Availability</a>
          <a href="#my-reservations">My bookings ({myBookings.length})</a>
          <button type="button" className="reset-button" onClick={reset}>Reset demo data</button>
        </nav>
        <div className="member"><span>Signed in as You</span><div className="profile">YOU</div></div>
      </header>

      <main>
        <section className="intro">
          <div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Pick an open day in the calendar, check the dates in the form, then confirm your booking.</p></div>
          <div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2, '0')}</strong><span>YOUR BOOKINGS</span><strong>{myBookings.length.toString().padStart(2, '0')}</strong></div>
        </section>

        <div className="pagegrid">
          <section className="calendar-pane" id="calendar">
            <div className="calendar-head">
              <div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div>
              <div className="weeknav">
                <button type="button" aria-label="Previous week" onClick={() => setWeek(addDays(week, -7))}>←</button>
                <strong aria-live="polite">{human(week)} – {human(addDays(week, 6))}</strong>
                <button type="button" aria-label="Next week" onClick={() => setWeek(addDays(week, 7))}>→</button>
              </div>
            </div>

            <div className="calendar-controls">
              <label>Room <select value={view} onChange={e => setView(e.target.value)}><option>All rooms</option>{rooms.map(r => <option key={r}>{r}</option>)}</select></label>
              <span className="legend"><i className="free" /> Open</span>
              <span className="legend"><i className="booked" /> Booked</span>
              <span className="legend"><i className="mine" /> Yours</span>
              <span className="legend"><i className="sel" /> Selected</span>
            </div>
            <p className="selection-hint" aria-live="polite">{hint}{anchor && <> <button type="button" className="linkish" onClick={() => setAnchor(null)}>Clear</button></>}</p>

            <div className="calendar-scroll">
              <div className="room-cal">
                <div className="corner">ROOM / DATE</div>
                {days.map(d => <div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}
                {roomList.map(room => (
                  <React.Fragment key={room}>
                    <div className={`roomname${selRoom === room ? ' active' : ''}`}><strong>{room}</strong><small>Study room · {room[0]}</small></div>
                    {days.map(day => cell(room, day))}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <p className="calendar-note">Each cell is one day. A booking's end date is not included: a booking ending on 19 Nov frees the room on 19 Nov.</p>

            <section id="my-reservations" className="reservations">
              <div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div>
              <div className="reservations-list">
                {myBookings.map(b => (
                  <article key={b.id} className={`reservation${b.id === editing ? ' active' : ''}`}>
                    <div className="room-chip">{b.roomNumber}</div>
                    <div className="reservation-body"><strong>{rangeLabel(b.startDate, b.endDate)}</strong><small>{b.purpose || 'No purpose entered'}</small></div>
                    {b.id === editing
                      ? <span className="editing-tag">Editing</span>
                      : <button type="button" onClick={() => edit(b)} aria-label={`Change booking for ${b.roomNumber}, ${rangeLabel(b.startDate, b.endDate)}`}>Change</button>}
                  </article>
                ))}
                {myBookings.length === 0 && <p>No reservations yet. Pick an open day in the calendar to make one.</p>}
              </div>
            </section>
          </section>

          <aside className={`booking-pane${editing ? ' is-editing' : ''}`} id="booking-form" ref={formRef}>
            <div className="panel-tag"><span>{editing ? 'CHANGE A BOOKING' : 'BOOK A ROOM'}</span><span>FORM 01</span></div>
            <h2>{editing ? 'Change reservation' : 'Make a reservation'}</h2>
            {editingRow
              ? <p className="edit-banner">You are changing <strong>{editingRow.roomNumber}, {rangeLabel(editingRow.startDate, editingRow.endDate)}</strong>. Edit the fields, or click days in the calendar to pick new dates.</p>
              : <p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>}
            {notice && <div className="success" role="status">{notice}</div>}

            <form onSubmit={submit} noValidate>
              <label>
                <span>Room number</span>
                <input ref={fieldRefs.roomNumber} list="rooms" placeholder="e.g., B2-104" value={form.roomNumber}
                  aria-invalid={invalid('roomNumber')} aria-describedby="room-error availability-status"
                  onChange={e => update('roomNumber', e.target.value)} />
                <datalist id="rooms">{rooms.map(r => <option key={r} value={r} />)}</datalist>
                {fieldError('roomNumber') && <em className="field-error" id="room-error">{fieldError('roomNumber')}</em>}
              </label>
              <div className="date-pair">
                <label>
                  <span>Start date</span>
                  <input ref={fieldRefs.startDate} type="date" value={form.startDate}
                    aria-invalid={invalid('startDate')} aria-describedby="start-error availability-status"
                    onChange={e => update('startDate', e.target.value)} />
                  {fieldError('startDate') && <em className="field-error" id="start-error">{fieldError('startDate')}</em>}
                </label>
                <label>
                  <span>End date <small>(not included)</small></span>
                  <input ref={fieldRefs.endDate} type="date" value={form.endDate} min={form.startDate ? addDays(form.startDate, 1) : undefined}
                    aria-invalid={invalid('endDate')} aria-describedby="end-error availability-status"
                    onChange={e => update('endDate', e.target.value)} />
                  {fieldError('endDate') && <em className="field-error" id="end-error">{fieldError('endDate')}</em>}
                </label>
              </div>

              <div id="availability-status" aria-live="polite">
                {complete && (problem
                  ? <div className="status bad">✕ {problem.message}</div>
                  : <div className="status ok">✓ {selRoom} is available: <strong>{rangeLabel(form.startDate, form.endDate)}</strong></div>)}
              </div>

              <label><span>Purpose / optional</span><textarea rows="4" placeholder="Meeting, group study..." value={form.purpose} onChange={e => update('purpose', e.target.value)} /></label>
              <p className="helper">Room and both dates are required. Reservations cannot overlap existing bookings for the same room.</p>
              <button className="availability-check" type="button" onClick={check}>Check availability</button>
              <button className="reserve-button" type="submit">{editing ? 'Save changes' : 'Confirm booking'}</button>
              {editing && <button className="cancel-edit" type="button" onClick={cancelEdit}>Cancel editing (keep original booking)</button>}
            </form>
            <div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div>
          </aside>
        </div>
      </main>
      <footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
    </div>
  );
}
