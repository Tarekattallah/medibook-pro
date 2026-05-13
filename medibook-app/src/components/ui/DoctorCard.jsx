import { Link } from 'react-router-dom'

export default function DoctorCard({ doctor }) {
  const { _id, name, specialty, location, rating, reviewCount, price, yearsExperience, isVerified, languages } = doctor
  const initials = name?.split(' ').filter(w => w.startsWith('Dr')?false:true).map(w=>w[0]).slice(0,2).join('') || 'DR'

  return (
    <div className="card fade-in" style={{padding:20,display:'flex',gap:16,transition:'all .2s',cursor:'default'}}>
      {/* Avatar */}
      <div style={{flexShrink:0}}>
        <div style={{width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#bae6fd,#0ea5e9)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'#fff'}}>
          {initials}
        </div>
      </div>

      {/* Info */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <Link to={`/doctor/${_id}`} style={{fontWeight:700,fontSize:16,color:'#0b1c30',textDecoration:'none'}}
                onMouseEnter={e=>e.target.style.color='#0ea5e9'} onMouseLeave={e=>e.target.style.color='#0b1c30'}>
                {name}
              </Link>
              {isVerified && <span className="badge badge-verified" style={{fontSize:11}}><span className="icon" style={{fontSize:13}}>verified</span> Verified</span>}
            </div>
            <div style={{fontSize:14,color:'#0ea5e9',fontWeight:600,marginTop:2}}>{specialty}</div>
            <div style={{fontSize:13,color:'#64748b',marginTop:2,display:'flex',alignItems:'center',gap:4}}>
              <span className="icon" style={{fontSize:15}}>location_on</span>{location}
            </div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:20,fontWeight:800,color:'#0b1c30'}}>EGP {price}</div>
            <div style={{fontSize:12,color:'#94a3b8'}}>per session</div>
          </div>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:16,marginTop:12,flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:4}}>
            <span className="stars">{'★'.repeat(Math.round(rating || 0))}</span>
            <span style={{fontSize:13,fontWeight:700}}>{rating?.toFixed(1)}</span>
            <span style={{fontSize:12,color:'#94a3b8'}}>({reviewCount} reviews)</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:4,fontSize:13,color:'#64748b'}}>
            <span className="icon" style={{fontSize:15}}>work</span>{yearsExperience} yrs exp
          </div>
          {languages?.length > 0 && (
            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
              {languages.map(l => <span key={l} className="tag" style={{fontSize:11}}>{l}</span>)}
            </div>
          )}
        </div>

        <div style={{display:'flex',gap:8,marginTop:14}}>
          <Link to={`/doctor/${_id}`} className="btn btn-secondary" style={{flex:1,fontSize:13,padding:'8px 14px'}}>View Profile</Link>
          <Link to={`/book/${_id}`} className="btn btn-primary" style={{flex:1,fontSize:13,padding:'8px 14px'}}>Book Now</Link>
        </div>
      </div>
    </div>
  )
}
