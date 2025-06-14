import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { sendAppointmentEmail } from '@/lib/email'
import { sendSMS } from '@/lib/sms'

// GET /api/appointments
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const date = searchParams.get('date')

    let where: any = {}

    // Filter by user role
    switch (session.user.role) {
      case 'PATIENT':
        where.patient = { userId: session.user.id }
        break
      case 'DOCTOR':
        where.doctor = { userId: session.user.id }
        break
      case 'NURSE':
        // Nurses can see appointments for their assigned doctors
        const nurseAssignments = await prisma.nurseAssignment.findMany({
          where: { nurse: { userId: session.user.id } },
          select: { doctorId: true },
        })
        where.doctorId = { in: nurseAssignments.map((a) => a.doctorId) }
        break
      case 'ADMIN':
        // Admins can see all appointments
        break
      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Filter by status if provided
    if (status) {
      where.status = status
    }

    // Filter by date if provided
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      where.datetime = {
        gte: startDate,
        lt: endDate,
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
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
        datetime: 'asc',
      },
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

// POST /api/appointments
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { doctorId, datetime, type, notes } = body

    // Validate input
    if (!doctorId || !datetime || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if the time slot is available
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId,
        datetime: new Date(datetime),
        status: { not: 'CANCELLED' },
      },
    })

    if (existingAppointment) {
      return NextResponse.json(
        { error: 'Time slot is not available' },
        { status: 400 }
      )
    }

    // Get patient ID from session
    const patient = await prisma.patient.findFirst({
      where: { userId: session.user.id },
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient profile not found' },
        { status: 400 }
      )
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        doctorId,
        patientId: patient.id,
        datetime: new Date(datetime),
        type,
        notes,
        status: 'SCHEDULED',
      },
      include: {
        patient: true,
        doctor: true,
      },
    })

    // Send notifications
    try {
      // Send email notification
      await sendAppointmentEmail({
        to: session.user.email!,
        appointmentDate: appointment.datetime,
        doctorName: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
        type: appointment.type,
      })

      // Send SMS notification if phone number is available
      if (appointment.patient.phone) {
        await sendSMS({
          to: appointment.patient.phone,
          message: `Your appointment with Dr. ${appointment.doctor.lastName} is scheduled for ${appointment.datetime.toLocaleString()}`,
        })
      }
    } catch (error) {
      console.error('Error sending notifications:', error)
      // Continue even if notifications fail
    }

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}

// PATCH /api/appointments
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, status, notes } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user has permission to update the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          select: { userId: true },
        },
        doctor: {
          select: { userId: true },
        },
      },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Check permissions based on role
    const canUpdate =
      session.user.role === 'ADMIN' ||
      (session.user.role === 'DOCTOR' && appointment.doctor.userId === session.user.id) ||
      (session.user.role === 'PATIENT' && appointment.patient.userId === session.user.id)

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status,
        notes: notes || appointment.notes,
      },
      include: {
        patient: true,
        doctor: true,
      },
    })

    // Send notifications for status changes
    if (status === 'CANCELLED' || status === 'CONFIRMED') {
      try {
        // Send email notification
        await sendAppointmentEmail({
          to: session.user.email!,
          appointmentDate: updatedAppointment.datetime,
          doctorName: `${updatedAppointment.doctor.firstName} ${updatedAppointment.doctor.lastName}`,
          type: updatedAppointment.type,
          status,
        })

        // Send SMS notification
        if (updatedAppointment.patient.phone) {
          await sendSMS({
            to: updatedAppointment.patient.phone,
            message: `Your appointment with Dr. ${updatedAppointment.doctor.lastName} has been ${status.toLowerCase()}`,
          })
        }
      } catch (error) {
        console.error('Error sending notifications:', error)
        // Continue even if notifications fail
      }
    }

    return NextResponse.json(updatedAppointment)
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
}