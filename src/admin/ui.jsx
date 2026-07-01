export const inp = 'adm-input';

export function Field({ label, children, cls = '' }) {
  return <div className={`adm-field ${cls}`}><label>{label}</label>{children}</div>;
}

export function Stat({ icon, n, label, tone = '' }) {
  return (
    <div className="adm-stat">
      <div className="adm-stat-ico">{icon}</div>
      <div><div className={`adm-stat-n ${tone}`}>{n}</div><div className="adm-stat-label">{label}</div></div>
    </div>
  );
}

export function Modal({ title, onClose, onSave, saveLabel = 'Save', children }) {
  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-head"><h3>{title}</h3><button onClick={onClose}>✕</button></div>
        <div className="adm-modal-body">{children}</div>
        <div className="adm-modal-foot">
          <button className="adm-btn ghost" onClick={onClose}>Cancel</button>
          <button className="adm-btn primary" onClick={onSave}>{saveLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function Confirm({ title, sub, onCancel, onConfirm }) {
  return (
    <div className="adm-modal-backdrop" onClick={onCancel}>
      <div className="adm-modal sm" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-body">
          <h3 style={{ margin: '4px 0 6px' }}>{title}</h3>
          {sub && <p style={{ color: 'var(--ig-text-secondary)', fontSize: 13 }}>{sub}</p>}
        </div>
        <div className="adm-modal-foot">
          <button className="adm-btn ghost" onClick={onCancel}>Cancel</button>
          <button className="adm-btn danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
