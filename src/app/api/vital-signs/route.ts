import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { z } from 'zod'

// Schema for vital signs validation
const vitalSignSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  temperature: z.number().min(35).max(42),
  bloodPressure: z.string().regex(/^\d{2,3}\/\d{2,3}$/, 'Invalid blood pressure format'),
  heartRate: z.number().min(40).max(200),
  respiratoryRate: z.number().min(8).max(40),
  notes: z.string().optional(),
})

// GET /api/vital-signs
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')

    let where: any = {}

    // Filter based on user role and access permissions
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
      case 'NURSE':
        if (!patientId) {
          return NextResponse.json(
            { error: 'Patient ID is required' },
            { status: 400 }
          )
        }
        // Verify access to patient
        const hasAccess = await verifyPatientAccess(session.user.id, patientId, session.user.role)
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Access denied to patient records' },
            { status: 403 }
          )
        }
        where.patientId = patientId
        break

      case 'ADMIN':
        if (patientId) {
          where.patientId = patientId
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const vitalSigns = await prisma.vitalSign.findMany({
      where,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        nurse: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(vitalSigns)
  } catch (error) {
    console.error('Error fetching vital signs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vital signs' },
      { status: 500 }
    )
  }
}

// POST /api/vital-signs
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'NURSE') {
      return NextResponse.json(
        { error: 'Only nurses can record vital signs' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validatedData = vitalSignSchema.parse(body)

    // Get nurse ID
    const nurse = await prisma.nurse.findFirst({
      where: { userId: session.user.id },
    })

    if (!nurse) {
      return NextResponse.json(
        { error: 'Nurse profile not found' },
        { status: 404 }
      )
    }

    // Verify access to patient
    const hasAccess = await verifyPatientAccess(session.user.id, validatedData.patientId, 'NURSE')
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to patient' },
        { status: 403 }
      )
    }

    // Create vital sign record
    const vitalSign = await prisma.vitalSign.create({
      data: {
        ...validatedData,
        nurseId: nurse.id,
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        nurse: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json(vitalSign, { status: 201 })
  } catch (error) {
    console.error('Error recording vital signs:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to record vital signs' },
      { status: 500 }
    )
  }
}

// Helper function to verify access to patient
async function verifyPatientAccess(
  userId: string,
  patientId: string,
  role: string
): Promise<boolean> {
  try {
    switch (role) {
      case 'DOCTOR':
        const doctor = await prisma.doctor.findFirst({
          where: { userId },
        })
        if (!doctor) return false

        const doctorPatient = await prisma.appointment.findFirst({
          where: {
            doctorId: doctor.id,
            patientId,
          },
        })
        return !!doctorPatient

      case 'NURSE':
        const nurse = await prisma.nurse.findFirst({
          where: { userId },
        })
        if (!nurse) return false

        const nurseAssignment = await prisma.nurseAssignment.findFirst({
          where: {
            nurseId: nurse.id,
            doctor: {
              appointments: {
                some: {
                  patientId,
                },
              },
            },
          },
        })
        return !!nurseAssignment

      default:
        return false
    }
  } catch (error) {
    console.error('Error verifying patient access:', error)
    return false
  }
}