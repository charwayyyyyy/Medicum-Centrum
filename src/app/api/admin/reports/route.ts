import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET /api/admin/reports
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can access reports' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const reportType = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!reportType || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Report type and date range are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    switch (reportType) {
      case 'appointments': {
        const appointments = await prisma.appointment.findMany({
          where: {
            date: {
              gte: start,
              lte: end,
            },
          },
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            doctor: {
              select: {
                firstName: true,
                lastName: true,
                specialization: true,
              },
            },
          },
          orderBy: {
            date: 'asc',
          },
        })

        // Calculate statistics
        const totalAppointments = appointments.length
        const statusCounts = appointments.reduce(
          (acc, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        )

        return NextResponse.json({
          data: appointments,
          stats: {
            total: totalAppointments,
            byStatus: statusCounts,
          },
        })
      }

      case 'staff-workload': {
        // Get doctor workload
        const doctorWorkload = await prisma.doctor.findMany({
          include: {
            appointments: {
              where: {
                date: {
                  gte: start,
                  lte: end,
                },
              },
            },
            nurseAssignments: {
              include: {
                tasks: {
                  where: {
                    createdAt: {
                      gte: start,
                      lte: end,
                    },
                  },
                },
              },
            },
          },
        })

        // Get nurse workload
        const nurseWorkload = await prisma.nurse.findMany({
          include: {
            assignments: {
              include: {
                tasks: {
                  where: {
                    createdAt: {
                      gte: start,
                      lte: end,
                    },
                  },
                },
              },
            },
          },
        })

        return NextResponse.json({
          doctors: doctorWorkload.map((doctor) => ({
            id: doctor.id,
            name: `${doctor.firstName} ${doctor.lastName}`,
            specialization: doctor.specialization,
            appointmentCount: doctor.appointments.length,
            taskCount: doctor.nurseAssignments.reduce(
              (sum, assignment) => sum + assignment.tasks.length,
              0
            ),
          })),
          nurses: nurseWorkload.map((nurse) => ({
            id: nurse.id,
            name: `${nurse.firstName} ${nurse.lastName}`,
            taskCount: nurse.assignments.reduce(
              (sum, assignment) => sum + assignment.tasks.length,
              0
            ),
          })),
        })
      }

      case 'patient-activity': {
        const patientActivity = await prisma.patient.findMany({
          include: {
            appointments: {
              where: {
                date: {
                  gte: start,
                  lte: end,
                },
              },
            },
            medicalRecords: {
              where: {
                createdAt: {
                  gte: start,
                  lte: end,
                },
              },
              include: {
                prescriptions: true,
              },
            },
            vitalSigns: {
              where: {
                recordedAt: {
                  gte: start,
                  lte: end,
                },
              },
            },
          },
        })

        return NextResponse.json(
          patientActivity.map((patient) => ({
            id: patient.id,
            name: `${patient.firstName} ${patient.lastName}`,
            appointmentCount: patient.appointments.length,
            recordCount: patient.medicalRecords.length,
            prescriptionCount: patient.medicalRecords.reduce(
              (sum, record) => sum + record.prescriptions.length,
              0
            ),
            vitalSignCount: patient.vitalSigns.length,
          }))
        )
      }

      case 'system-usage': {
        const userActivity = await prisma.user.groupBy({
          by: ['role'],
          _count: {
            id: true,
          },
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        })

        const appointmentActivity = await prisma.appointment.groupBy({
          by: ['status'],
          _count: {
            id: true,
          },
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        })

        const recordActivity = await prisma.medicalRecord.count({
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        })

        const taskActivity = await prisma.nurseTask.groupBy({
          by: ['status'],
          _count: {
            id: true,
          },
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        })

        return NextResponse.json({
          users: userActivity,
          appointments: appointmentActivity,
          records: recordActivity,
          tasks: taskActivity,
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}