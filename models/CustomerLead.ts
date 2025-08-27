import mongoose from 'mongoose'

export interface ICustomerLead {
  _id: string
  name: string
  phone?: string
  email?: string
  tableNumber: string
  createdAt: Date
}

const customerLeadSchema = new mongoose.Schema<ICustomerLead>({
  name: { type: String, required: true },
  phone: String,
  email: String,
  tableNumber: { type: String, default: 'T1' }, // single-table MVP
  createdAt: { type: Date, default: Date.now },
}, {
  collection: 'customerleads'
})

export default mongoose.models.CustomerLead || mongoose.model<ICustomerLead>('CustomerLead', customerLeadSchema)
