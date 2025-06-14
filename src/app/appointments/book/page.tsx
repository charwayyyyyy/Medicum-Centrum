'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline'

interface Doctor {
  id: string
  firstName: string
  lastName: string
  specialization: string
}

interface TimeSlot {
  id: string
  time: string
  available: boolean
}

export default function BookAppointmentPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  const [appointmentType, setAppointmentType] = useState('')
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [error, setError] = useState('')

  const appointmentTypes = [
    'General Checkup',
    'Follow-up',
    'Consultation',
    'Vaccination',
    'Laboratory Test',
  ]

  const handleDateChange = async (date: string) => {
    setSelectedDate(date)
    // Fetch available doctors for the selected date
    try {
      const response = await fetch(`/api/appointments/available-doctors?date=${date}`)
      const data = await response.json()
      setDoctors(data)
    } catch (error) {
      setError('Failed to fetch available doctors')
    }
  }

  const handleDoctorChange = async (doctorId: string) => {
    setSelectedDoctor(doctorId)
    // Fetch available time slots for the selected doctor and date
    try {
      const response = await fetch(
        `/api/appointments/time-slots?date=${selectedDate}&doctorId=${doctorId}`
      )
      const data = await response.json()
      setTimeSlots(data)
    } catch (error) {
      setError('Failed to fetch available time slots')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor,
          date: selectedDate,
          timeSlot: selectedTimeSlot,
          type: appointmentType,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to book appointment')
      }

      router.push('/appointments?booked=true')
    } catch (error) {
      setError('Failed to book appointment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Book Appointment</h3>
            <p className="mt-1 text-sm text-gray-600">
              Schedule an appointment with one of our healthcare professionals.
            </p>
          </div>
        </div>

        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">{error}</h3>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Appointment Type</label>
                  <select
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    required
                  >
                    <option value="">Select type</option>
                    {appointmentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>

                {doctors.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Doctor</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <select
                        value={selectedDoctor}
                        onChange={(e) => handleDoctorChange(e.target.value)}
                        className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                        required
                      >
                        <option value="">Select doctor</option>
                        {doctors.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {timeSlots.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time Slot</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ClockIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <select
                        value={selectedTimeSlot}
                        onChange={(e) => setSelectedTimeSlot(e.target.value)}
                        className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                        required
                      >
                        <option value="">Select time</option>
                        {timeSlots
                          .filter((slot) => slot.available)
                          .map((slot) => (
                            <option key={slot.id} value={slot.id}>
                              {slot.time}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}