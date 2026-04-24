import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import qrImage from './assets/qr.png'

const UPI_ID = 'chineshsoni2@okhdfcbank'
const PRESET_AMOUNTS = [51, 101, 251, 501]

const upiAppBtn = (bg) => ({
  padding: '13px 0',
  borderRadius: 10,
  border: 'none',
  background: bg,
  color: '#fff',
  fontFamily: 'Bebas Neue',
  fontSize: 17,
  letterSpacing: '0.06em',
  cursor: 'pointer',
  transition: 'opacity 0.2s',
})

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.12em',
  color: 'var(--muted)',
  marginBottom: 8,
  textTransform: 'uppercase',
}

const inputStyle = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'var(--navy3)',
  color: 'var(--white)',
  fontSize: 15,
  outline: 'none',
  marginBottom: 4,
  fontFamily: 'DM Sans, sans-serif',
}

export default function App() {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [customAmount, setCustomAmount] = useState(false)
  const [step, setStep] = useState('form')
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [total, setTotal] = useState(0)

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
  // Validate inputs before proceeding to payment step
  if (!name.trim() || !amount) {
    return;
  }
  setStep('pay');
}

  function copyUPI() {
    navigator.clipboard.writeText(UPI_ID)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Async function to finalize donation after payment
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
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '32px 16px 80px' }}>

      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <span style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, var(--saffron), #e8920a)',
          borderRadius: 8,
          padding: '4px 14px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: '#0a0f1e',
          marginBottom: 14,
        }}>MR.SAFFRONYT</span>

        <h1 style={{ fontSize: 40, lineHeight: 1.08, color: 'var(--white)', marginBottom: 10 }}>
          HELP BUILD<br />
          <span style={{ color: 'var(--saffron)' }}>THE WEBSITE</span>
        </h1>

        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
          Support <strong style={{ color: 'var(--white)' }}>Chinesh Soni</strong> in building something great for the community.
        </p>

        <div style={{
          marginTop: 24,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          background: 'var(--navy3)',
          border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: 50,
          padding: '10px 24px',
        }}>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>Total raised</span>
          <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 24, color: 'var(--saffron)', letterSpacing: '0.04em' }}>
            ₹{total.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* STEP: FORM */}
      {step === 'form' && (
        <div style={{
          background: 'var(--navy2)',
          border: '1px solid rgba(245,166,35,0.12)',
          borderRadius: 20,
          padding: '28px 24px',
        }}>
          <h2 style={{ fontSize: 20, color: 'var(--saffron)', marginBottom: 24, letterSpacing: '0.04em' }}>
            YOUR CONTRIBUTION
          </h2>

          <label style={labelStyle}>Your Name</label>
          <input
            style={inputStyle}
            placeholder="e.g. Rahul Sharma"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <label style={{ ...labelStyle, marginTop: 20 }}>Select Amount</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            {PRESET_AMOUNTS.map(a => (
              <button
                key={a}
                onClick={() => { setAmount(a); setCustomAmount(false) }}
                style={{
                  padding: '13px 0',
                  borderRadius: 10,
                  border: amount === a && !customAmount
                    ? '2px solid var(--saffron)'
                    : '1px solid rgba(255,255,255,0.08)',
                  background: amount === a && !customAmount
                    ? 'rgba(245,166,35,0.1)'
                    : 'var(--navy3)',
                  color: amount === a && !customAmount ? 'var(--saffron)' : 'var(--white)',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >₹{a}</button>
            ))}
          </div>

          <button
            onClick={() => { setCustomAmount(true); setAmount('') }}
            style={{
              width: '100%',
              padding: '11px 0',
              borderRadius: 10,
              border: customAmount ? '1px solid var(--cyan)' : '1px dashed rgba(255,255,255,0.15)',
              background: 'transparent',
              color: customAmount ? 'var(--cyan)' : 'var(--muted)',
              fontSize: 13,
              cursor: 'pointer',
              marginBottom: customAmount ? 10 : 0,
              transition: 'all 0.15s',
            }}
          >+ Enter custom amount</button>

          {customAmount && (
            <input
              style={{ ...inputStyle, marginTop: 0 }}
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
            style={{
              width: '100%',
              marginTop: 24,
              padding: '16px 0',
              borderRadius: 12,
              border: 'none',
              background: (!name.trim() || !amount)
                ? 'rgba(245,166,35,0.25)'
                : 'linear-gradient(135deg, var(--saffron), #e8920a)',
              color: '#0a0f1e',
              fontFamily: 'Bebas Neue',
              fontSize: 20,
              letterSpacing: '0.08em',
              cursor: (!name.trim() || !amount) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >{loading ? 'Saving...' : 'PROCEED TO PAY →'}</button>
        </div>
      )}

      {/* STEP: PAY */}
      {step === 'pay' && (
        <div style={{
          background: 'var(--navy2)',
          border: '1px solid rgba(0,212,255,0.12)',
          borderRadius: 20,
          padding: '28px 24px',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: 22, color: 'var(--cyan)', marginBottom: 6 }}>SCAN & PAY</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
            Scan the QR code or tap an app below
          </p>

          {/* Summary */}
          <div style={{
            background: 'rgba(245,166,35,0.07)',
            border: '1px solid rgba(245,166,35,0.18)',
            borderRadius: 10,
            padding: '10px 16px',
            fontSize: 13,
            color: 'var(--saffron)',
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
          }}>
            <span>{name}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <strong>₹{Number(amount).toLocaleString('en-IN')}</strong>
          </div>

          {/* QR */}
          <div style={{
            background: '#fff',
            borderRadius: 14,
            padding: 12,
            display: 'inline-block',
            boxShadow: '0 0 40px rgba(0,212,255,0.08)',
            marginBottom: 16,
          }}>
            <img src={qrImage} alt="UPI QR Code" style={{ width: 210, height: 210, display: 'block' }} />
          </div>

          {/* UPI ID */}
          <div style={{
            background: 'var(--navy3)',
            borderRadius: 10,
            padding: '11px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>UPI ID</span>
            <span style={{ fontSize: 13, color: 'var(--white)', fontWeight: 500 }}>{UPI_ID}</span>
            <button onClick={copyUPI} style={{
              background: copied ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: 7,
              padding: '5px 12px',
              color: copied ? 'var(--cyan)' : 'var(--muted)',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}>{copied ? '✓ Copied' : 'Copy'}</button>
          </div>

          {/* App buttons */}
          <p style={{ color: 'var(--muted)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            📱 Tap to open on mobile
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            <button onClick={() => window.location.href = `gpay://upi/pay?pa=${UPI_ID}&pn=Chinesh%20Soni&am=${amount}&cu=INR`}
              style={upiAppBtn('#1A73E8')}>Google Pay</button>
            <button onClick={() => window.location.href = `phonepe://pay?pa=${UPI_ID}&pn=Chinesh%20Soni&am=${amount}&cu=INR`}
              style={upiAppBtn('#5f259f')}>PhonePe</button>
            <button onClick={() => window.location.href = `paytmmp://pay?pa=${UPI_ID}&pn=Chinesh%20Soni&am=${amount}&cu=INR`}
              style={upiAppBtn('#00BAF2')}>Paytm</button>
            <button onClick={() => window.location.href = `upi://pay?pa=${UPI_ID}&pn=Chinesh%20Soni&am=${amount}&cu=INR`}
              style={upiAppBtn('#374151')}>Any UPI App</button>
          </div>

          <button
            onClick={handleDone}
            style={{
              width: '100%',
              padding: '15px 0',
              borderRadius: 12,
              border: '1px solid rgba(0,212,255,0.25)',
              background: 'transparent',
              color: 'var(--cyan)',
              fontFamily: 'Bebas Neue',
              fontSize: 20,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              marginBottom: 10,
            }}
          >I HAVE PAID ✓</button>

          <button
            onClick={() => setStep('form')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              fontSize: 13,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >← Go back</button>
        </div>
      )}

      {/* STEP: DONE */}
      {step === 'done' && (
        <div style={{
          background: 'var(--navy2)',
          border: '1px solid rgba(0,212,255,0.12)',
          borderRadius: 20,
          padding: '40px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 28, color: 'var(--cyan)', marginBottom: 10 }}>THANK YOU!</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, maxWidth: 280, margin: '0 auto 24px' }}>
            Your support means everything. Your name will appear on the donor wall below.
          </p>
          <button
            onClick={resetForm}
            style={{
              padding: '12px 32px',
              borderRadius: 12,
              border: '1px solid rgba(245,166,35,0.3)',
              background: 'transparent',
              color: 'var(--saffron)',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >Donate again</button>
        </div>
      )}

      {/* DONOR WALL */}
      <div style={{ marginTop: 48 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 24 }}>
            DONOR <span style={{ color: 'var(--saffron)' }}>WALL</span>
          </h2>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            {donors.length} supporter{donors.length !== 1 ? 's' : ''}
          </span>
        </div>

        {donors.length === 0 ? (
          <div style={{
            background: 'var(--navy2)',
            borderRadius: 14,
            padding: '36px 20px',
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: 14,
            border: '1px dashed rgba(255,255,255,0.07)',
          }}>Be the first to support! 🚀</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {donors.map((d, i) => (
              <div key={i} style={{
                background: 'var(--navy2)',
                border: i === 0
                  ? '1px solid rgba(245,166,35,0.25)'
                  : '1px solid rgba(255,255,255,0.05)',
                borderRadius: 14,
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: i === 0 ? 'rgba(245,166,35,0.15)' : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    fontWeight: 600,
                    color: i === 0 ? 'var(--saffron)' : 'var(--muted)',
                    flexShrink: 0,
                  }}>
                    {d.donor_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--white)' }}>{d.donor_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {new Date(d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <span style={{
                  fontFamily: 'Bebas Neue',
                  fontSize: 20,
                  color: i === 0 ? 'var(--saffron)' : 'var(--cyan)',
                  letterSpacing: '0.04em',
                }}>₹{Number(d.amount).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}