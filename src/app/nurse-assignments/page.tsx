'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  UserGroupIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

interface Doctor {
  id: string
  firstName: string
  lastName: string
  specialization: string
}

interface Patient {
  id: string
  firstName: string
  lastName: string
}

interface Task {
  id: string
  title: string
  description: string
  status: 'PENDING' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  patientId: string
  patient: Patient
  doctorId: string
  doctor: Doctor
  createdAt: string
}

interface Assignment {
  id: string
  doctorId: string
  doctor: Doctor
  tasks: Task[]
}

export default function NurseAssignmentsPage() {
  const { data: session } = useSession()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notifications, setNotifications] = useState<string[]>([])

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await fetch('/api/nurse-assignments')
        if (!response.ok) {
          throw new Error('Failed to fetch assignments')
        }
        const data = await response.json()
        setAssignments(data)
      } catch (error) {
        setError('Failed to load assignments')
      } finally {
        setLoading(false)
      }
    }

    fetchAssignments()

    // Set up WebSocket connection for real-time updates
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}/nurse-notifications`
    )

    ws.onmessage = (event) => {
      const notification = JSON.parse(event.data)
      setNotifications((prev) => [notification.message, ...prev])
    }

    return () => {
      ws.close()
    }
  }, [])

  const handleTaskComplete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/nurse-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      setAssignments((prevAssignments) =>
        prevAssignments.map((assignment) => ({
          ...assignment,
          tasks: assignment.tasks.map((task) =>
            task.id === taskId ? { ...task, status: 'COMPLETED' } : task
          ),
        }))
      )
    } catch (error) {
      setError('Failed to update task status')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-600 bg-red-100'
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-green-600 bg-green-100'
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
            Nurse Assignments
          </h2>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Assignments List */}
        <div className="lg:col-span-2">
          {assignments.length > 0 ? (
            <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="p-6">
                  <div className="flex items-center">
                    <UserGroupIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                    <h3 className="ml-3 text-lg font-medium text-gray-900">
                      Dr. {assignment.doctor.firstName} {assignment.doctor.lastName}
                    </h3>
                    <span className="ml-2 text-sm text-gray-500">
                      ({assignment.doctor.specialization})
                    </span>
                  </div>

                  <div className="mt-4 space-y-4">
                    {assignment.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-gray-50 rounded-lg p-4 flex items-start justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center">
                            <ClipboardDocumentListIcon
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                            <h4 className="ml-2 text-sm font-medium text-gray-900">
                              {task.title}
                            </h4>
                            <span
                              className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">{task.description}</p>
                          <div className="mt-2 text-xs text-gray-500">
                            Patient: {task.patient.firstName} {task.patient.lastName}
                          </div>
                        </div>
                        {task.status === 'PENDING' ? (
                          <button
                            onClick={() => handleTaskComplete(task.id)}
                            className="ml-4 flex-shrink-0 bg-white rounded-md p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <CheckCircleIcon className="h-5 w-5 text-primary-600" />
                          </button>
                        ) : (
                          <div className="ml-4 flex-shrink-0">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Completed
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No assignments found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You currently have no assigned patients or tasks.
              </p>
            </div>
          )}
        </div>

        {/* Notifications Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <BellIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              <h3 className="ml-3 text-lg font-medium text-gray-900">Notifications</h3>
            </div>

            <div className="mt-4 space-y-4">
              {notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700"
                  >
                    {notification}
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 text-sm">
                  No new notifications
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}