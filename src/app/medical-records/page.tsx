'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

interface MedicalRecord {
  id: string
  date: string
  diagnosis: string
  treatment: string
  notes: string
  prescriptions: Prescription[]
  doctor: {
    firstName: string
    lastName: string
    specialization: string
  }
}

interface Prescription {
  id: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  notes: string
}

interface VitalSign {
  id: string
  date: string
  temperature: number
  bloodPressure: string
  heartRate: number
  respiratoryRate: number
  notes: string
}

export default function MedicalRecordsPage() {
  const { data: session } = useSession()
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [vitals, setVitals] = useState<VitalSign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)

  useEffect(() => {
    const fetchMedicalRecords = async () => {
      try {
        const [recordsResponse, vitalsResponse] = await Promise.all([
          fetch('/api/medical-records'),
          fetch('/api/vital-signs'),
        ])

        if (!recordsResponse.ok || !vitalsResponse.ok) {
          throw new Error('Failed to fetch medical data')
        }

        const recordsData = await recordsResponse.json()
        const vitalsData = await vitalsResponse.json()

        setRecords(recordsData)
        setVitals(vitalsData)
      } catch (error) {
        setError('Failed to load medical records')
      } finally {
        setLoading(false)
      }
    }

    fetchMedicalRecords()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Medical Records
          </h2>
        </div>
        {session?.user?.role === 'DOCTOR' && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              type="button"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Record
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Medical Records List */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-200">
              {records.map((record) => (
                <li
                  key={record.id}
                  className="px-6 py-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedRecord(record)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DocumentTextIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Dr. {record.doctor.firstName} {record.doctor.lastName} -{' '}
                        {record.doctor.specialization}
                      </div>
                      <div className="text-sm text-gray-500">{record.diagnosis}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Record Details */}
        <div className="lg:col-span-1">
          {selectedRecord ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Record Details
                </h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(selectedRecord.date).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Doctor</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      Dr. {selectedRecord.doctor.firstName} {selectedRecord.doctor.lastName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Diagnosis</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedRecord.diagnosis}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Treatment</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedRecord.treatment}</dd>
                  </div>
                  {selectedRecord.notes && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Notes</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedRecord.notes}</dd>
                    </div>
                  )}
                  {selectedRecord.prescriptions.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Prescriptions</dt>
                      <dd className="mt-1">
                        <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                          {selectedRecord.prescriptions.map((prescription) => (
                            <li
                              key={prescription.id}
                              className="pl-3 pr-4 py-3 flex items-center justify-between text-sm"
                            >
                              <div className="w-0 flex-1 flex items-center">
                                <ClipboardDocumentListIcon
                                  className="flex-shrink-0 h-5 w-5 text-gray-400"
                                  aria-hidden="true"
                                />
                                <span className="ml-2 flex-1 w-0 truncate">
                                  {prescription.medication} - {prescription.dosage}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 text-center rounded-lg border-2 border-dashed border-gray-300">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No record selected
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a medical record to view its details
              </p>
            </div>
          )}

          {/* Vital Signs */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Vital Signs</h3>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <ul role="list" className="divide-y divide-gray-200">
                {vitals.slice(0, 5).map((vital) => (
                  <li key={vital.id} className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-900">
                        {new Date(vital.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="mr-2">🌡️</span>
                          {vital.temperature}°C
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          <span className="mr-2">❤️</span>
                          {vital.heartRate} bpm
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <span className="mr-2">🩺</span>
                        {vital.bloodPressure}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}