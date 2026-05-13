require('dotenv').config()
const mongoose     = require('mongoose')
const User         = require('../models/User')
const Appointment  = require('../models/Appointment')
const Review       = require('../models/Review')
const Notification = require('../models/Notification')

// NOTE: We set password as plain text and let the pre-save hook hash it
const PASSWORD = '000000000'

const DOCTORS = [
  { name:'Dr. Sarah Johnson',   specialty:'Cardiology',    location:'Cairo, Nasr City',     price:350, yearsExperience:12, languages:['English','Arabic'], bio:'Board-certified cardiologist with 12 years specializing in preventive cardiology.', rating:4.9, reviewCount:0, isVerified:true },
  { name:'Dr. Michael Chen',    specialty:'Neurology',     location:'Cairo, Heliopolis',    price:300, yearsExperience:8,  languages:['English','Arabic'], bio:'Expert neurologist focusing on headache disorders and epilepsy.', rating:4.8, reviewCount:0, isVerified:true },
  { name:'Dr. Emily Rodriguez', specialty:'Dermatology',   location:'Giza, Dokki',          price:250, yearsExperience:10, languages:['English','Arabic','Spanish'], bio:'Skilled dermatologist with expertise in cosmetic and medical dermatology.', rating:4.7, reviewCount:0, isVerified:true },
  { name:'Dr. James Wilson',    specialty:'Orthopedics',   location:'Cairo, Maadi',         price:400, yearsExperience:15, languages:['English','Arabic'], bio:'Orthopedic surgeon specializing in sports injuries and joint replacement.', rating:4.9, reviewCount:0, isVerified:true },
  { name:'Dr. Aisha Patel',     specialty:'Pediatrics',    location:'Alexandria, Smouha',   price:200, yearsExperience:6,  languages:['English','Arabic','Hindi'], bio:'Compassionate pediatrician dedicated to children from birth to adolescence.', rating:4.6, reviewCount:0, isVerified:true },
  { name:'Dr. Robert Kim',      specialty:'Psychiatry',    location:'Cairo, Zamalek',       price:280, yearsExperience:9,  languages:['English','Arabic'], bio:'Licensed psychiatrist specializing in mood disorders and anxiety.', rating:4.8, reviewCount:0, isVerified:true },
  { name:'Dr. Fatima Al-Rashid',specialty:'Ophthalmology', location:'Cairo, Mohandessin',  price:320, yearsExperience:11, languages:['English','Arabic'], bio:'Ophthalmologist with expertise in cataract surgery and LASIK.', rating:4.7, reviewCount:0, isVerified:true },
  { name:'Dr. Ahmed Hassan',    specialty:'Cardiology',    location:'Cairo, New Cairo',     price:380, yearsExperience:14, languages:['Arabic','English'], bio:'Interventional cardiologist with experience in cardiac catheterization.', rating:4.8, reviewCount:0, isVerified:true },
  { name:'Dr. Nour Khalil',     specialty:'Gynecology',    location:'Giza, 6th of October', price:270, yearsExperience:7,  languages:['Arabic','English'], bio:'Dedicated gynecologist providing comprehensive women\'s health services.', rating:4.9, reviewCount:0, isVerified:false },
  { name:'Dr. Omar Farid',      specialty:'Dentistry',     location:'Cairo, Heliopolis',    price:180, yearsExperience:5,  languages:['Arabic','English'], bio:'General dentist focused on preventive and cosmetic dentistry.', rating:4.5, reviewCount:0, isVerified:true },
  { name:'Dr. Layla Hassan',    specialty:'Neurology',     location:'Alexandria, Stanley',  price:310, yearsExperience:9,  languages:['Arabic','English','French'], bio:'Neurologist specializing in stroke management and neurological rehabilitation.', rating:4.7, reviewCount:0, isVerified:true },
  { name:'Dr. Khaled Mansour',  specialty:'Orthopedics',   location:'Cairo, Nasr City',     price:350, yearsExperience:13, languages:['Arabic','English'], bio:'Experienced orthopedic surgeon with focus on minimally invasive techniques.', rating:4.6, reviewCount:0, isVerified:true },
]

const DAYS  = ['Mon','Tue','Wed','Thu','Fri']
const SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00']

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('🔌 Connected to MongoDB')

    await Promise.all([
      User.deleteMany({}),
      Appointment.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({}),
    ])
    console.log('🗑  Cleared existing data')

    const avail = DAYS.map(d => ({ day: d, slots: SLOTS }))

    // Plain text passwords — pre-save hook will hash them
    const admin = await User.create({
      name:'Admin User', email:'admin@demo.com',
      password: PASSWORD, role:'admin'
    })

    const patient = await User.create({
      name:'Ahmed Mohamed', email:'patient@demo.com',
      password: PASSWORD, role:'patient',
      phone:'+20 10 1234 5678', dateOfBirth: new Date('1990-05-15'), bloodType:'A+'
    })

    const demoDoctor = await User.create({
      name:'Dr. Sarah Johnson', email:'doctor@demo.com',
      password: PASSWORD, role:'doctor',
      specialty:'Cardiology', location:'Cairo, Nasr City',
      price:350, yearsExperience:12, languages:['English','Arabic'],
      bio:'Board-certified cardiologist with 12 years experience.',
      rating:4.9, reviewCount:2, isVerified:true, availability:avail,
    })

    const doctors = []
    for (const doc of DOCTORS) {
      const email = doc.name.toLowerCase()
        .replace(/dr\.\s/,'').replace(/\s+/g,'.') + '@medibook.com'
      const d = await User.create({
        ...doc, email, password: PASSWORD, role:'doctor', availability:avail
      })
      doctors.push(d)
    }
    console.log(`✅ ${doctors.length + 1} doctors created`)

    const pastDate1  = new Date(); pastDate1.setDate(pastDate1.getDate() - 10)
    const pastDate2  = new Date(); pastDate2.setDate(pastDate2.getDate() - 3)
    const futureDate = new Date(); futureDate.setDate(futureDate.getDate() + 5)

    const [apt1, apt2, apt3] = await Promise.all([
      Appointment.create({ patient:patient._id, doctor:demoDoctor._id, date:pastDate1, timeSlot:'10:00', type:'in-person', status:'completed', price:350 }),
      Appointment.create({ patient:patient._id, doctor:doctors[1]._id, date:pastDate2,  timeSlot:'14:30', type:'video',     status:'completed', price:300 }),
      Appointment.create({ patient:patient._id, doctor:demoDoctor._id, date:futureDate, timeSlot:'09:30', type:'in-person', status:'confirmed', price:350 }),
    ])
    console.log('✅ 3 sample appointments created')

    await Promise.all([
      Review.create({ patient:patient._id, doctor:demoDoctor._id, appointment:apt1._id, rating:5, comment:'Dr. Johnson was thorough and very professional!' }),
      Review.create({ patient:patient._id, doctor:doctors[1]._id,  appointment:apt2._id, rating:5, comment:'Excellent consultation. Very knowledgeable.' }),
    ])
    await User.findByIdAndUpdate(demoDoctor._id, { rating:5.0, reviewCount:1 })
    await User.findByIdAndUpdate(doctors[1]._id,  { rating:5.0, reviewCount:1 })
    console.log('✅ 2 sample reviews created')

    await Promise.all([
      Notification.create({ user:patient._id, type:'appointment', title:'Appointment Confirmed', body:`Your appointment with Dr. Sarah Johnson on ${futureDate.toLocaleDateString('en',{month:'short',day:'numeric'})} at 09:30 is confirmed.`, link:'/patient/appointments', read:false }),
      Notification.create({ user:patient._id, type:'review',      title:'How was your visit?',  body:'Your appointment with Dr. Michael Chen is complete. Leave a review!', link:`/doctor/${doctors[1]._id}`, read:false }),
      Notification.create({ user:patient._id, type:'system',      title:'Welcome to MediBook Pro!', body:'Complete your profile to get personalized recommendations.', link:'/settings', read:true }),
      Notification.create({ user:demoDoctor._id, type:'appointment', title:'New Appointment', body:'Ahmed Mohamed booked an appointment with you.', link:'/doctor/dashboard', read:false }),
    ])
    console.log('✅ Sample notifications created')

    console.log('\n🎉 Database seeded!\n')
    console.log('  Admin:   admin@demo.com   / password')
    console.log('  Patient: patient@demo.com / password')
    console.log('  Doctor:  doctor@demo.com  / password\n')

    process.exit(0)
  } catch (err) {
    console.error('❌ Seed failed:', err.message)
    process.exit(1)
  }
}

seed()
