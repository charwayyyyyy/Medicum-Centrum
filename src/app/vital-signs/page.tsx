'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  ChartBarIcon,
  HeartIcon,
  UserIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

interface Patient {
  id: string
  firstName: string
  lastName: string
}

interface VitalSign {
  id: string
  patientId: string
  temperature: number
  bloodPressure: string
  heartRate: number
  respiratoryRate: number
  notes: string
  createdAt: string
  patient: Patient
}

export default function VitalSignsPage() {
  const { data: session } = useSession()
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<string>('')
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    temperature: '',
    bloodPressure: '',
    heartRate: '',
    respiratoryRate: '',
    notes: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsResponse, vitalsResponse] = await Promise.all([
          fetch('/api/patients'),
          selectedPatient ? fetch(`/api/vital-signs?patientId=${selectedPatient}`) : null,
        ])

        if (!patientsResponse.ok) {
          throw new Error('Failed to fetch patients')
        }

        const patientsData = await patientsResponse.json()
        setPatients(patientsData)

        if (vitalsResponse) {
          if (!vitalsResponse.ok) {
            throw new Error('Failed to fetch vital signs')
          }
          const vitalsData = await vitalsResponse.json()
          setVitalSigns(vitalsData)
        }
      } catch (error) {
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedPatient])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/vital-signs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient,
          ...formData,
          temperature: parseFloat(formData.temperature),
          heartRate: parseInt(formData.heartRate),
          respiratoryRate: parseInt(formData.respiratoryRate),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save vital signs')
      }

      const newVitalSign = await response.json()
      setVitalSigns([newVitalSign, ...vitalSigns])
      setShowForm(false)
      setFormData({
        temperature: '',
        bloodPressure: '',
        heartRate: '',
        respiratoryRate: '',
        notes: '',
      })
    } catch (error) {
      setError('Failed to save vital signs')
    } finally {
      setLoading(false)
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
            Vital Signs Management
          </h2>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Patient Selection and Form */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <label htmlFor="patient" className="block text-sm font-medium text-gray-700">
                Select Patient
              </label>
              <select
                id="patient"
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">Choose a patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName}
                  </option>
                ))}
              </select>
            </div>

            {selectedPatient && (
              <button
                onClick={() => setShowForm(true)}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Record New Vitals
              </button>
            )}
          </div>

          {showForm && selectedPatient && (
            <div className="mt-6 bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Record Vital Signs</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    id="temperature"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="bloodPressure" className="block text-sm font-medium text-gray-700">
                    Blood Pressure
                  </label>
                  <input
                    type="text"
                    id="bloodPressure"
                    value={formData.bloodPressure}
                    onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                    placeholder="120/80"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="heartRate" className="block text-sm font-medium text-gray-700">
                    Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    id="heartRate"
                    value={formData.heartRate}
                    onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="respiratoryRate" className="block text-sm font-medium text-gray-700">
                    Respiratory Rate (breaths/min)
                  </label>
                  <input
                    type="number"
                    id="respiratoryRate"
                    value={formData.respiratoryRate}
                    onChange={(e) => setFormData({ ...formData, respiratoryRate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
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

        {/* Vital Signs History */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            vitalSigns.length > 0 ? (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">Vital Signs History</h3>
                </div>
                <div className="border-t border-gray-200">
                  <ul role="list" className="divide-y divide-gray-200">
                    {vitalSigns.map((vital) => (
                      <li key={vital.id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(vital.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <div className="flex items-center text-sm text-gray-500">
                              <ChartBarIcon
                                className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                              {vital.temperature}°C
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              <HeartIcon
                                className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                              {vital.heartRate} bpm
                            </div>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <UserIcon
                              className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                            {vital.bloodPressure}
                          </div>
                        </div>
                        {vital.notes && (
                          <div className="mt-2 text-sm text-gray-500">{vital.notes}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No vital signs recorded
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start by recording new vital signs for this patient.
                </p>
              </div>
            )
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No patient selected
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a patient to view or record vital signs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}