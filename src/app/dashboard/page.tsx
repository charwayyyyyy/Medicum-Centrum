'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

interface DashboardStats {
  appointments: number
  patients?: number
  doctors?: number
  nurses?: number
  upcomingAppointments?: any[]
  recentPatients?: any[]
  assignedTasks?: any[]
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({ appointments: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    )
  }

  const renderPatientDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Upcoming Appointments"
          value={stats.upcomingAppointments?.length || 0}
          icon={CalendarIcon}
          description="Scheduled appointments"
        />
        <DashboardCard
          title="Medical Records"
          value="View"
          icon={ChartBarIcon}
          description="Access your medical history"
          link="/medical-records"
        />
        <DashboardCard
          title="Prescriptions"
          value="View"
          icon={ClockIcon}
          description="Current medications"
          link="/prescriptions"
        />
      </div>

      {stats.upcomingAppointments && stats.upcomingAppointments.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Appointments</h3>
          <div className="space-y-4">
            {stats.upcomingAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderDoctorDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Today's Appointments"
          value={stats.appointments}
          icon={CalendarIcon}
          description="Scheduled for today"
        />
        <DashboardCard
          title="Total Patients"
          value={stats.patients || 0}
          icon={UserGroupIcon}
          description="Under your care"
        />
        <DashboardCard
          title="Assigned Nurses"
          value={stats.nurses || 0}
          icon={UserGroupIcon}
          description="Supporting staff"
        />
        <DashboardCard
          title="Pending Tasks"
          value={stats.assignedTasks?.length || 0}
          icon={ClockIcon}
          description="Requiring attention"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats.upcomingAppointments && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Schedule</h3>
            <div className="space-y-4">
              {stats.upcomingAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          </div>
        )}

        {stats.recentPatients && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Patients</h3>
            <div className="space-y-4">
              {stats.recentPatients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderNurseDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Assigned Patients"
          value={stats.patients || 0}
          icon={UserGroupIcon}
          description="Under your care"
        />
        <DashboardCard
          title="Tasks"
          value={stats.assignedTasks?.length || 0}
          icon={ClockIcon}
          description="Pending tasks"
        />
        <DashboardCard
          title="Today's Schedule"
          value="View"
          icon={CalendarIcon}
          description="Your daily agenda"
          link="/schedule"
        />
      </div>

      {stats.assignedTasks && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Tasks</h3>
          <div className="space-y-4">
            {stats.assignedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Patients"
          value={stats.patients || 0}
          icon={UserGroupIcon}
          description="Registered patients"
        />
        <DashboardCard
          title="Doctors"
          value={stats.doctors || 0}
          icon={UserGroupIcon}
          description="Medical staff"
        />
        <DashboardCard
          title="Nurses"
          value={stats.nurses || 0}
          icon={UserGroupIcon}
          description="Support staff"
        />
        <DashboardCard
          title="Appointments"
          value={stats.appointments}
          icon={CalendarIcon}
          description="Today's appointments"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Statistics</h3>
          {/* Add system statistics chart here */}
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h3>
          {/* Add activity log here */}
        </div>
      </div>
    </div>
  )

  return (
    <div className="py-6">
      <div className="px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="mt-8">
          {session?.user?.role === 'PATIENT' && renderPatientDashboard()}
          {session?.user?.role === 'DOCTOR' && renderDoctorDashboard()}
          {session?.user?.role === 'NURSE' && renderNurseDashboard()}
          {session?.user?.role === 'ADMIN' && renderAdminDashboard()}
        </div>
      </div>
    </div>
  )
}

interface DashboardCardProps {
  title: string
  value: string | number
  icon: any
  description: string
  link?: string
}

function DashboardCard({ title, value, icon: Icon, description, link }: DashboardCardProps) {
  const content = (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
              </dd>
              <dd className="text-sm text-gray-500">{description}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )

  if (link) {
    return <a href={link}>{content}</a>
  }

  return content
}

function AppointmentCard({ appointment }: { appointment: any }) {
  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
      <CalendarIcon className="h-6 w-6 text-gray-400" />
      <div>
        <p className="text-sm font-medium text-gray-900">
          {appointment.type} with Dr. {appointment.doctor.lastName}
        </p>
        <p className="text-sm text-gray-500">
          {new Date(appointment.datetime).toLocaleString()}
        </p>
      </div>
    </div>
  )
}

function PatientCard({ patient }: { patient: any }) {
  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
      <UserGroupIcon className="h-6 w-6 text-gray-400" />
      <div>
        <p className="text-sm font-medium text-gray-900">
          {patient.firstName} {patient.lastName}
        </p>
        <p className="text-sm text-gray-500">{patient.lastVisit}</p>
      </div>
    </div>
  )
}

function TaskCard({ task }: { task: any }) {
  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
      <ClockIcon className="h-6 w-6 text-gray-400" />
      <div>
        <p className="text-sm font-medium text-gray-900">{task.title}</p>
        <p className="text-sm text-gray-500">{task.description}</p>
      </div>
    </div>
  )
}