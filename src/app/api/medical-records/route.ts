import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET /api/medical-records
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')

    let where: any = {}

    // Filter records based on user role
    switch (session.user.role) {
      case 'PATIENT':
        const patient = await prisma.patient.findFirst({
          where: { userId: session.user.id },
        })
        if (!patient) {
          return NextResponse.json(
            { error: 'Patient profile not found' },
            { status: 404 }
          )
        }
        where.patientId = patient.id
        break

      case 'DOCTOR':
        if (patientId) {
          // Check if doctor has access to this patient
          const doctor = await prisma.doctor.findFirst({
            where: { userId: session.user.id },
          })
          if (!doctor) {
            return NextResponse.json(
              { error: 'Doctor profile not found' },
              { status: 404 }
            )
          }
          const hasAccess = await prisma.appointment.findFirst({
            where: {
              doctorId: doctor.id,
              patientId: patientId,
            },
          })
          if (!hasAccess) {
            return NextResponse.json(
              { error: 'Access denied to patient records' },
              { status: 403 }
            )
          }
          where.patientId = patientId
        }
        break

      case 'NURSE':
        if (patientId) {
          // Check if nurse is assigned to the patient's doctor
          const nurse = await prisma.nurse.findFirst({
            where: { userId: session.user.id },
          })
          if (!nurse) {
            return NextResponse.json(
              { error: 'Nurse profile not found' },
              { status: 404 }
            )
          }
          const hasAccess = await prisma.nurseAssignment.findFirst({
            where: {
              nurseId: nurse.id,
              doctor: {
                appointments: {
                  some: {
                    patientId: patientId,
                  },
                },
              },
            },
          })
          if (!hasAccess) {
            return NextResponse.json(
              { error: 'Access denied to patient records' },
              { status: 403 }
            )
          }
          where.patientId = patientId
        }
        break

      case 'ADMIN':
        if (patientId) {
          where.patientId = patientId
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const records = await prisma.medicalRecord.findMany({
      where,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        prescriptions: true,
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error('Error fetching medical records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medical records' },
      { status: 500 }
    )
  }
}

// POST /api/medical-records
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Only doctors can create medical records' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { patientId, diagnosis, treatment, notes, prescriptions } = body

    // Validate input
    if (!patientId || !diagnosis || !treatment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get doctor's ID
    const doctor = await prisma.doctor.findFirst({
      where: { userId: session.user.id },
    })

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor profile not found' },
        { status: 404 }
      )
    }

    // Create medical record with prescriptions
    const record = await prisma.medicalRecord.create({
      data: {
        patientId,
        diagnosis,
        treatment,
        notes,
        prescriptions: {
          create: prescriptions?.map((prescription: any) => ({
            medication: prescription.medication,
            dosage: prescription.dosage,
            frequency: prescription.frequency,
            duration: prescription.duration,
            notes: prescription.notes,
            doctorId: doctor.id,
          })),
        },
      },
      include: {
        patient: true,
        prescriptions: true,
        doctor: true,
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating medical record:', error)
    return NextResponse.json(
      { error: 'Failed to create medical record' },
      { status: 500 }
    )
  }
}

// PATCH /api/medical-records
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Only doctors can update medical records' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { id, diagnosis, treatment, notes, prescriptions } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      )
    }

    // Get doctor's ID
    const doctor = await prisma.doctor.findFirst({
      where: { userId: session.user.id },
    })

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor profile not found' },
        { status: 404 }
      )
    }

    // Update medical record
    const record = await prisma.medicalRecord.update({
      where: { id },
      data: {
        diagnosis,
        treatment,
        notes,
        prescriptions: {
          deleteMany: {},
          create: prescriptions?.map((prescription: any) => ({
            medication: prescription.medication,
            dosage: prescription.dosage,
            frequency: prescription.frequency,
            duration: prescription.duration,
            notes: prescription.notes,
            doctorId: doctor.id,
          })),
        },
      },
      include: {
        patient: true,
        prescriptions: true,
        doctor: true,
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error updating medical record:', error)
    return NextResponse.json(
      { error: 'Failed to update medical record' },
      { status: 500 }
    )
  }
}