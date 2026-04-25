import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import qrImage from './assets/qr.png'

const PRESET_AMOUNTS = [51, 101, 251, 501]
const UPI_ID = 'chineshsoni2@oksbi'

export default function App() {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [customAmount, setCustomAmount] = useState(false)
  const [step, setStep] = useState('form')
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchDonors()
    const channel = supabase
      .channel('donations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'donations' }, fetchDonors)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchDonors() {
    const { data } = await supabase
      .from('donations')
      .select('donor_name, amount, created_at')
      .eq('display_publicly', true)
      .order('created_at', { ascending: false })
    if (data) {
      setDonors(data)
      setTotal(data.reduce((sum, d) => sum + Number(d.amount), 0))
    }
  }



  function handleSubmit() {
    if (!name.trim() || !amount) return;
    setStep('pay');
  }

  function copyUPI() {
    navigator.clipboard.writeText(UPI_ID)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDone() {
    setLoading(true);
    const { error } = await supabase.from('donations').insert({
      donor_name: name.trim(),
      amount: Number(amount),
      display_publicly: true,
    });
    setLoading(false);
    if (!error) {
      setStep('done');
      fetchDonors();
    }
  }



  function resetForm() {
    setStep('form')
    setName('')
    setAmount('')
    setCustomAmount(false)
  }

  return (
    <div className="mobile-wrapper">
      <div className="app-container">

        {/* HEADER */}
        <div className="header">
          <span className="brand">MR.SAFFRONYT</span>

          <h1 className="title">
            HELP BUILD<br />
            <span className="highlight">THE WEBSITE</span>
          </h1>

          <p className="subtitle">
            Support <strong>Chinesh Soni</strong> in building something great for the community.
          </p>

          <div className="total-box">
            <span className="total-label">Total raised</span>
            <span className="separator" />
            <span className="total-amount">₹{total.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* STEP: FORM */}
        {step === 'form' && (
          <div className="card">
            <h2 className="section-title">YOUR CONTRIBUTION</h2>

            <label className="form-label">Your Name</label>
            <input
              className="form-input"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={e => setName(e.target.value)}
            />

            <label className="form-label" style={{ marginTop: '20px' }}>Select Amount</label>
            <div className="amount-grid">
              {PRESET_AMOUNTS.map(a => (
                <button
                  key={a}
                  onClick={() => { setAmount(a); setCustomAmount(false) }}
                  className={`amount-btn ${amount === a && !customAmount ? 'active' : ''}`}
                >₹{a}</button>
              ))}
            </div>

            <button
              onClick={() => { setCustomAmount(true); setAmount('') }}
              className={`custom-amount-btn ${customAmount ? 'active' : ''}`}
            >+ Enter custom amount</button>

            {customAmount && (
              <input
                className="form-input custom-input"
                placeholder="₹ Enter amount"
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
              />
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !name.trim() || !amount}
              className="primary-btn"
            >{loading ? 'Processing...' : 'PROCEED TO PAY →'}</button>

            <div className="paypal-container" style={{ marginTop: '20px', textAlign: 'center' }}>
              <p style={{ margin: '10px 0', color: '#888', fontSize: '14px' }}>Or pay internationally via PayPal</p>
              <a 
                href="https://paypal.me/ChineshSoni" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#0070ba',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  textAlign: 'center',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#005ea6'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#0070ba'}
              >
                PAY WITH PAYPAL
              </a>
            </div>
          </div>
        )}

        {/* STEP: PAY */}
        {step === 'pay' && (
          <div className="card pay-card">
            <h2 className="pay-title">SCAN & PAY</h2>
            <p className="pay-subtitle">Scan the QR code or tap an app below</p>

            {/* Summary */}
            <div className="summary-box">
              <span>{name}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <strong>₹{Number(amount).toLocaleString('en-IN')}</strong>
            </div>

            {/* QR */}
            <div className="qr-box">
              <img src={qrImage} alt="UPI QR Code" />
            </div>

            {/* UPI ID */}
            <div className="upi-box">
              <div>
                <div className="upi-label">UPI ID</div>
                <div className="upi-value">{UPI_ID}</div>
              </div>
              <button onClick={copyUPI} className={`copy-btn ${copied ? 'active' : ''}`}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            {/* App buttons removed */}
            
            <button onClick={handleDone} className="pay-done-btn">I HAVE PAID ✓</button>

            <button onClick={() => setStep('form')} className="back-btn">← Go back</button>
          </div>
        )}

        {/* STEP: DONE */}
        {step === 'done' && (
          <div className="card pay-card">
            <div className="done-icon">🎉</div>
            <h2 className="done-title">THANK YOU!</h2>
            <p className="done-text">
              Your support means everything. Your name will appear on the donor wall below.
            </p>
            <button onClick={resetForm} className="done-btn">Donate again</button>
          </div>
        )}

        {/* DONOR WALL */}
        <div className="donor-wall">
          <div className="donor-header">
            <h2 className="donor-title">
              DONOR <span className="highlight">WALL</span>
            </h2>
            <span className="donor-count">
              {donors.length} supporter{donors.length !== 1 ? 's' : ''}
            </span>
          </div>

          {donors.length === 0 ? (
            <div className="donor-empty">Be the first to support! 🚀</div>
          ) : (
            <div className="donor-list">
              {donors.map((d, i) => (
                <div key={i} className={`donor-card ${i === 0 ? 'top' : ''}`}>
                  <div className="donor-info">
                    <div className="donor-avatar">
                      {d.donor_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="donor-name">{d.donor_name}</div>
                      <div className="donor-date">
                        {new Date(d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <span className="donor-amount">₹{Number(d.amount).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}