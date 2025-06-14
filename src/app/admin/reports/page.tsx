'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { toast } from 'react-hot-toast'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

type ReportType = 'appointments' | 'staff-workload' | 'patient-activity' | 'system-usage'

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState<ReportType>('appointments')
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date().setDate(1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  })
  const [reportData, setReportData] = useState<any>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user.role !== 'ADMIN') {
      router.push('/dashboard')
    } else {
      fetchReport()
    }
  }, [session, status, router])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        type: reportType,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })

      const response = await fetch(`/api/admin/reports?${queryParams}`)
      if (!response.ok) throw new Error('Failed to fetch report')
      const data = await response.json()
      setReportData(data)
    } catch (error) {
      toast.error('Failed to load report')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const renderAppointmentsReport = () => {
    if (!reportData) return null

    const statusData = Object.entries(reportData.stats.byStatus).map(
      ([status, count]) => ({
        name: status,
        value: count,
      })
    )

    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Appointment Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <div className="text-2xl font-bold">
                Total Appointments: {reportData.stats.total}
              </div>
              {statusData.map((status) => (
                <div
                  key={status.name}
                  className="flex justify-between items-center"
                >
                  <span className="text-gray-600">{status.name}</span>
                  <span className="font-medium">{status.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
          <h3 className="text-lg font-medium mb-4">Recent Appointments</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.data.slice(0, 10).map((appointment: any) => (
                <tr key={appointment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(new Date(appointment.date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {appointment.patient.firstName} {appointment.patient.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {appointment.doctor.firstName} {appointment.doctor.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {appointment.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderStaffWorkloadReport = () => {
    if (!reportData) return null

    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Doctor Workload</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.doctors}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="appointmentCount" name="Appointments" fill="#0088FE" />
                <Bar dataKey="taskCount" name="Tasks" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Nurse Workload</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.nurses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="taskCount" name="Tasks" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )
  }

  const renderPatientActivityReport = () => {
    if (!reportData) return null

    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Patient Activity Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="appointmentCount"
                  name="Appointments"
                  fill="#0088FE"
                />
                <Bar dataKey="recordCount" name="Records" fill="#00C49F" />
                <Bar
                  dataKey="prescriptionCount"
                  name="Prescriptions"
                  fill="#FFBB28"
                />
                <Bar
                  dataKey="vitalSignCount"
                  name="Vital Signs"
                  fill="#FF8042"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )
  }

  const renderSystemUsageReport = () => {
    if (!reportData) return null

    const userActivityData = reportData.users.map((item: any) => ({
      name: item.role,
      value: item._count.id,
    }))

    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">User Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userActivityData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {userActivityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h4 className="text-lg font-medium mb-4">Records Created</h4>
            <div className="text-3xl font-bold">{reportData.records}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h4 className="text-lg font-medium mb-4">Task Status</h4>
            <div className="space-y-2">
              {reportData.tasks.map((task: any) => (
                <div
                  key={task.status}
                  className="flex justify-between items-center"
                >
                  <span className="text-gray-600">{task.status}</span>
                  <span className="font-medium">{task._count.id}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h4 className="text-lg font-medium mb-4">Appointment Status</h4>
            <div className="space-y-2">
              {reportData.appointments.map((appointment: any) => (
                <div
                  key={appointment.status}
                  className="flex justify-between items-center"
                >
                  <span className="text-gray-600">{appointment.status}</span>
                  <span className="font-medium">{appointment._count.id}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Reports & Analytics</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-white p-4 rounded-lg shadow">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="border rounded-md p-2"
          >
            <option value="appointments">Appointments Report</option>
            <option value="staff-workload">Staff Workload Report</option>
            <option value="patient-activity">Patient Activity Report</option>
            <option value="system-usage">System Usage Report</option>
          </select>

          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, startDate: e.target.value })
            }
            className="border rounded-md p-2"
          />

          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, endDate: e.target.value })
            }
            className="border rounded-md p-2"
          />

          <button
            onClick={fetchReport}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Generate Report
          </button>
        </div>

        {reportType === 'appointments' && renderAppointmentsReport()}
        {reportType === 'staff-workload' && renderStaffWorkloadReport()}
        {reportType === 'patient-activity' && renderPatientActivityReport()}
        {reportType === 'system-usage' && renderSystemUsageReport()}
      </div>
    </div>
  )
}