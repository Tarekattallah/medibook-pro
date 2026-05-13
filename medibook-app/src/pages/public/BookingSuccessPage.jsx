import { Link } from 'react-router-dom'
export default function BookingSuccessPage() {
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f8f9ff',padding:24}}>
      <div style={{textAlign:'center',maxWidth:440}}>
        <div style={{width:88,height:88,borderRadius:'50%',background:'#ecfdf5',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px'}}>
          <span className="icon icon-filled" style={{fontSize:48,color:'#059669'}}>check_circle</span>
        </div>
        <h1 style={{fontSize:30,fontWeight:800,color:'#0b1c30',marginBottom:10}}>Booking Confirmed!</h1>
        <p style={{fontSize:15,color:'#64748b',lineHeight:1.7,marginBottom:8}}>Your appointment has been successfully booked. A confirmation will be sent to your email.</p>
        <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:32,flexWrap:'wrap'}}>
          <Link to="/patient/appointments" className="btn btn-secondary" style={{fontSize:14}}>View Appointments</Link>
          <Link to="/" className="btn btn-primary" style={{fontSize:14}}>Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
