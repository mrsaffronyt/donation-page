import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import qrImage from './assets/qr.png'

const UPI_ID = 'chineshsoni2@okhdfcbank'
const PRESET_AMOUNTS = [51, 101, 251, 501]

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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'donations' }, () => fetchDonors())
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

  async function handleSubmit() {
    if (!name.trim() || !amount) return
    setLoading(true)
    const { error } = await supabase.from('donations').insert({
      donor_name: name.trim(),
      amount: Number(amount),
      display_publicly: true,
    })
    setLoading(false)
    if (!error) {
      setStep('pay')
    }
  }

  function handleUPIPay() {
    const upiLink = `upi://pay?pa=chineshsoni2@okhdfcbank&pn=Chinesh%20Soni&am=${amount}&cu=INR&tn=Donation`
    window.location.href = upiLink
  }

  function copyUPI() {
    navigator.clipboard.writeText(UPI_ID)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDone() {
    setStep('done')
    fetchDonors()
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 80px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, var(--saffron), #ff8c00)',
          borderRadius: 12,
          padding: '6px 18px',
          marginBottom: 12,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.12em',
          color: '#0a0f1e'
        }}>MR.SAFFRONYT</div>
        <h1 style={{ fontSize: 38, lineHeight: 1.1, color: 'var(--white)' }}>
          HELP BUILD<br />
          <span style={{ color: 'var(--saffron)' }}>THE WEBSITE</span>
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: 10, fontSize: 14 }}>
          Every contribution by <strong style={{ color: 'var(--cyan)' }}>Chinesh Soni</strong> goes directly into building something amazing.
        </p>

        {/* Total raised */}
        <div style={{
          marginTop: 20,
          background: 'var(--navy3)',
          border: '1px solid rgba(0,212,255,0.2)',
          borderRadius: 14,
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>Total raised</span>
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: 'var(--saffron)', letterSpacing: '0.04em' }}>
            ₹{total.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* STEP: FORM */}
      {step === 'form' && (
        <div style={{
          background: 'var(--navy2)',
          border: '1px solid rgba(245,166,35,0.15)',
          borderRadius: 20,
          padding: 24
        }}>
          <h2 style={{ fontSize: 22, marginBottom: 20, color: 'var(--saffron)' }}>YOUR CONTRIBUTION</h2>

          <label style={labelStyle}>Your Name</label>
          <input
            style={inputStyle}
            placeholder="e.g. Rahul Sharma"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <label style={{ ...labelStyle, marginTop: 18 }}>Select Amount</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {PRESET_AMOUNTS.map(a => (
              <button
                key={a}
                onClick={() => { setAmount(a); setCustomAmount(false) }}
                style={{
                  padding: '12px 0',
                  borderRadius: 10,
                  border: amount === a && !customAmount
                    ? '2px solid var(--saffron)'
                    : '1px solid rgba(255,255,255,0.1)',
                  background: amount === a && !customAmount
                    ? 'rgba(245,166,35,0.12)'
                    : 'var(--navy3)',
                  color: amount === a && !customAmount ? 'var(--saffron)' : 'var(--white)',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >₹{a}</button>
            ))}
          </div>

          <button
            onClick={() => { setCustomAmount(true); setAmount('') }}
            style={{
              width: '100%',
              padding: '10px 0',
              borderRadius: 10,
              border: customAmount ? '2px solid var(--cyan)' : '1px dashed rgba(255,255,255,0.2)',
              background: 'transparent',
              color: customAmount ? 'var(--cyan)' : 'var(--muted)',
              fontSize: 14,
              cursor: 'pointer',
              marginBottom: customAmount ? 10 : 0,
              transition: 'all 0.2s'
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
              padding: '15px 0',
              borderRadius: 12,
              border: 'none',
              background: (!name.trim() || !amount)
                ? 'rgba(245,166,35,0.3)'
                : 'linear-gradient(135deg, var(--saffron), #e8920a)',
              color: '#0a0f1e',
              fontFamily: 'Bebas Neue',
              fontSize: 20,
              letterSpacing: '0.08em',
              cursor: (!name.trim() || !amount) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >{loading ? 'Saving...' : 'PROCEED TO PAY →'}</button>
        </div>
      )}

      {/* STEP: PAY */}
      {step === 'pay' && (
        <div style={{
          background: 'var(--navy2)',
          border: '1px solid rgba(0,212,255,0.2)',
          borderRadius: 20,
          padding: 24,
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: 24, color: 'var(--cyan)', marginBottom: 4 }}>SCAN & PAY</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
            Choose how you want to pay
          </p>

          {/* Amount + name summary */}
          <div style={{
            marginBottom: 20,
            background: 'rgba(245,166,35,0.08)',
            border: '1px solid rgba(245,166,35,0.2)',
            borderRadius: 12,
            padding: '10px 16px',
            fontSize: 13,
            color: 'var(--saffron)'
          }}>
            Paying: <strong>₹{Number(amount).toLocaleString('en-IN')}</strong> · {name}
          </div>

          {/* UPI Section */}
          <div style={{
            background: 'var(--navy3)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Pay via UPI / Scan
            </p>

            <div style={{
              background: '#fff',
              borderRadius: 12,
              padding: 10,
              display: 'inline-block',
              boxShadow: '0 0 30px rgba(0,212,255,0.1)',
              marginBottom: 12
            }}>
              <img src={qrImage} alt="UPI QR Code" style={{ width: 200, height: 200, display: 'block' }} />
            </div>

            {/* UPI ID row */}
            <div style={{
              background: 'var(--navy2)',
              borderRadius: 10,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>UPI ID</span>
              <span style={{ fontSize: 13, color: 'var(--white)', fontWeight: 500 }}>{UPI_ID}</span>
              <button onClick={copyUPI} style={{
                background: copied ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.06)',
                border: 'none',
                borderRadius: 8,
                padding: '6px 12px',
                color: copied ? 'var(--cyan)' : 'var(--muted)',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>{copied ? '✓ Copied' : 'Copy'}</button>
            </div>

            {/* UPI deep link button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
  <p style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 4 }}>
    📱 Tap to open on mobile:
  </p>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
    <button onClick={() => window.location.href = `gpay://upi/pay?pa=${UPI_ID}&pn=Chinesh%20Soni&am=${amount}&cu=INR`}
      style={upiAppBtn('#1A73E8')}>Google Pay</button>
    <button onClick={() => window.location.href = `phonepe://pay?pa=${UPI_ID}&pn=Chinesh%20Soni&am=${amount}&cu=INR`}
      style={upiAppBtn('#5f259f')}>PhonePe</button>
    <button onClick={() => window.location.href = `paytmmp://pay?pa=${UPI_ID}&pn=Chinesh%20Soni&am=${amount}&cu=INR`}
      style={upiAppBtn('#00BAF2')}>Paytm</button>
    <button onClick={() => window.location.href = `upi://pay?pa=${UPI_ID}&pn=Chinesh%20Soni&am=${amount}&cu=INR`}
      style={upiAppBtn('#6B7280')}>Any UPI App</button>
  </div>
</div>
          </div>

          {/* I have paid button */}
          <button
            onClick={handleDone}
            style={{
              width: '100%',
              padding: '15px 0',
              borderRadius: 12,
              border: '1px solid rgba(0,212,255,0.3)',
              background: 'transparent',
              color: 'var(--cyan)',
              fontFamily: 'Bebas Neue',
              fontSize: 20,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              marginBottom: 8
            }}
          >I HAVE PAID ✓</button>

          <button
            onClick={() => setStep('form')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              fontSize: 13,
              marginTop: 4,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >← Go back</button>
        </div>
      )}

      {/* STEP: DONE */}
      {step === 'done' && (
        <div style={{
          background: 'var(--navy2)',
          border: '1px solid rgba(0,212,255,0.2)',
          borderRadius: 20,
          padding: 32,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
          <h2 style={{ fontSize: 28, color: 'var(--cyan)', marginBottom: 8 }}>THANK YOU!</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
            Your name will appear in the donor wall below once the payment is confirmed.
          </p>
          <button
            onClick={() => { setStep('form'); setName(''); setAmount(''); setCustomAmount(false) }}
            style={{
              marginTop: 24,
              padding: '12px 32px',
              borderRadius: 12,
              border: '1px solid rgba(245,166,35,0.3)',
              background: 'transparent',
              color: 'var(--saffron)',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >Donate again</button>
        </div>
      )}

      {/* DONOR WALL */}
      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 26, marginBottom: 4 }}>
          DONOR <span style={{ color: 'var(--saffron)' }}>WALL</span>
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
          {donors.length} supporter{donors.length !== 1 ? 's' : ''} so far
        </p>

        {donors.length === 0 ? (
          <div style={{
            background: 'var(--navy2)',
            borderRadius: 14,
            padding: '32px 20px',
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: 14,
            border: '1px dashed rgba(255,255,255,0.08)'
          }}>Be the first to donate! 🚀</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {donors.map((d, i) => (
              <div key={i} style={{
                background: 'var(--navy2)',
                border: i === 0 ? '1px solid rgba(245,166,35,0.3)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14,
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: i === 0 ? 'rgba(245,166,35,0.2)' : 'rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    fontWeight: 600,
                    color: i === 0 ? 'var(--saffron)' : 'var(--muted)'
                  }}>
                    {d.donor_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{d.donor_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {new Date(d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
                <span style={{
                  fontFamily: 'Bebas Neue',
                  fontSize: 20,
                  color: i === 0 ? 'var(--saffron)' : 'var(--cyan)',
                  letterSpacing: '0.04em'
                }}>₹{Number(d.amount).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.1em',
  color: 'var(--muted)',
  marginBottom: 8,
  textTransform: 'uppercase'
}

const inputStyle = { You 
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'var(--navy3)',
  color: 'var(--white)',
  fontSize: 15,
  outline: 'none',
  marginBottom: 4,
  fontFamily: 'DM Sans, sans-serif'
}


const upiAppBtn = (bg) => ({
  padding: '12px 0',
  borderRadius: 10,
  border: 'none',
  background: bg,
  color: '#fff',
  fontFamily: 'Bebas Neue',
  fontSize: 16,
  letterSpacing: '0.06em',
  cursor: 'pointer'
})