import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET /api/admin/stats
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can access dashboard statistics' },
        { status: 403 }
      )
    }

    // Get total counts
    const [patients, doctors, nurses, appointments] = await Promise.all([
      prisma.patient.count(),
      prisma.doctor.count(),
      prisma.nurse.count(),
      prisma.appointment.count(),
    ])

    // Get appointments by status
    const appointmentsByStatus = await prisma.appointment.groupBy({
      by: ['status'],
      _count: true,
    })

    // Get upcoming appointments
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: new Date(),
        },
        status: 'SCHEDULED',
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
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
      take: 10,
    })

    // Format the response
    const stats = {
      totalPatients: patients,
      totalDoctors: doctors,
      totalNurses: nurses,
      totalAppointments: appointments,
      appointmentsByStatus: appointmentsByStatus.map((status) => ({
        status: status.status,
        count: status._count,
      })),
      upcomingAppointments: upcomingAppointments.map((appointment) => ({
        id: appointment.id,
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        doctorName: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
        date: appointment.date.toISOString(),
        status: appointment.status,
      })),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching admin statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}