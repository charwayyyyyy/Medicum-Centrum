'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

interface Doctor {
  id: string
  firstName: string
  lastName: string
  specialization: string
  schedule: Schedule[]
}

interface Nurse {
  id: string
  firstName: string
  lastName: string
  schedule: Schedule[]
}

interface Schedule {
  id: string
  userId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
}

export default function AdminSchedulingPage() {
  const { data: session } = useSession()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [nurses, setNurses] = useState<Nurse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [staffType, setStaffType] = useState<'DOCTOR' | 'NURSE'>('DOCTOR')
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({
    dayOfWeek: '1',
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: true,
  })

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ]

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        const [doctorsResponse, nursesResponse] = await Promise.all([
          fetch('/api/admin/doctors'),
          fetch('/api/admin/nurses'),
        ])

        if (!doctorsResponse.ok || !nursesResponse.ok) {
          throw new Error('Failed to fetch staff data')
        }

        const doctorsData = await doctorsResponse.json()
        const nursesData = await nursesResponse.json()

        setDoctors(doctorsData)
        setNurses(nursesData)
      } catch (error) {
        setError('Failed to load staff data')
      } finally {
        setLoading(false)
      }
    }

    fetchStaffData()
  }, [])

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedStaff,
          userType: staffType,
          ...scheduleForm,
          dayOfWeek: parseInt(scheduleForm.dayOfWeek),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create schedule')
      }

      const newSchedule = await response.json()

      // Update local state
      if (staffType === 'DOCTOR') {
        setDoctors(doctors.map((doctor) => {
          if (doctor.id === selectedStaff) {
            return {
              ...doctor,
              schedule: [...doctor.schedule, newSchedule],
            }
          }
          return doctor
        }))
      } else {
        setNurses(nurses.map((nurse) => {
          if (nurse.id === selectedStaff) {
            return {
              ...nurse,
              schedule: [...nurse.schedule, newSchedule],
            }
          }
          return nurse
        }))
      }

      setShowScheduleForm(false)
      setScheduleForm({
        dayOfWeek: '1',
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
      })
    } catch (error) {
      setError('Failed to create schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleDelete = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/admin/schedule/${scheduleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete schedule')
      }

      // Update local state
      if (staffType === 'DOCTOR') {
        setDoctors(doctors.map((doctor) => ({
          ...doctor,
          schedule: doctor.schedule.filter((s) => s.id !== scheduleId),
        })))
      } else {
        setNurses(nurses.map((nurse) => ({
          ...nurse,
          schedule: nurse.schedule.filter((s) => s.id !== scheduleId),
        })))
      }
    } catch (error) {
      setError('Failed to delete schedule')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Staff Scheduling
          </h2>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Staff Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <label htmlFor="staffType" className="block text-sm font-medium text-gray-700">
                Staff Type
              </label>
              <select
                id="staffType"
                value={staffType}
                onChange={(e) => {
                  setStaffType(e.target.value as 'DOCTOR' | 'NURSE')
                  setSelectedStaff('')
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="DOCTOR">Doctors</option>
                <option value="NURSE">Nurses</option>
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="staff" className="block text-sm font-medium text-gray-700">
                Select Staff Member
              </label>
              <select
                id="staff"
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">Choose a staff member</option>
                {staffType === 'DOCTOR'
                  ? doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.firstName} {doctor.lastName} ({doctor.specialization})
                      </option>
                    ))
                  : nurses.map((nurse) => (
                      <option key={nurse.id} value={nurse.id}>
                        {nurse.firstName} {nurse.lastName}
                      </option>
                    ))}
              </select>
            </div>

            {selectedStaff && (
              <button
                onClick={() => setShowScheduleForm(true)}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Add Schedule
              </button>
            )}
          </div>

          {showScheduleForm && selectedStaff && (
            <div className="mt-6 bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Schedule</h3>
              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700">
                    Day of Week
                  </label>
                  <select
                    id="dayOfWeek"
                    value={scheduleForm.dayOfWeek}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, dayOfWeek: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    {daysOfWeek.map((day, index) => (
                      <option key={day} value={index + 1}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                    Start Time
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    value={scheduleForm.startTime}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, startTime: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                    End Time
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    value={scheduleForm.endTime}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, endTime: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={scheduleForm.isAvailable}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, isAvailable: e.target.checked })
                    }
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">
                    Available for Appointments
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowScheduleForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Schedule Display */}
        <div className="lg:col-span-2">
          {selectedStaff ? (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Current Schedule
                </h3>
              </div>
              <div className="border-t border-gray-200">
                <ul role="list" className="divide-y divide-gray-200">
                  {((staffType === 'DOCTOR'
                    ? doctors.find((d) => d.id === selectedStaff)?.schedule
                    : nurses.find((n) => n.id === selectedStaff)?.schedule) || []).map(
                    (schedule) => (
                      <li key={schedule.id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <CalendarIcon
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {daysOfWeek[schedule.dayOfWeek - 1]}
                            </span>
                          </div>
                          <button
                            onClick={() => handleScheduleDelete(schedule.id)}
                            className="ml-4 text-sm font-medium text-red-600 hover:text-red-500"
                          >
                            Delete
                          </button>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <div className="flex items-center text-sm text-gray-500">
                              <ClockIcon
                                className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                              {schedule.startTime} - {schedule.endTime}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                schedule.isAvailable
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {schedule.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                        </div>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No staff member selected
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a staff member to view or manage their schedule.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}